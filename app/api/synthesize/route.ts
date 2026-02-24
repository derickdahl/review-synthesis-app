import { NextResponse } from 'next/server'

interface SynthesisResponse {
  strengths: string
  developmentFeedback: string
  goalsNextYear: string
  overallAssessment: string
  dataUsed: {
    itpScores: boolean
    feedback360: boolean
    selfReview: boolean
    managerComments: boolean
  }
  extractedData: any
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type')
    
    // Handle test requests
    if (contentType?.includes('application/json')) {
      return NextResponse.json({ 
        status: 'API is working', 
        timestamp: new Date().toISOString(),
        apiKey: !!process.env.ANTHROPIC_API_KEY ? 'present' : 'missing'
      })
    }
    
    const formData = await request.formData()
    
    const managerComments = formData.get('managerComments') as string || ''
    const itpEmployeeFiles = formData.getAll('itpEmployeeScreenshots')
    const itpManagerFiles = formData.getAll('itpManagerScreenshots')
    const feedback360File = formData.get('feedback360')
    const selfReviewFiles = formData.getAll('selfReviewScreenshots')

    const dataUsed = {
      itpScores: itpEmployeeFiles.length > 0 || itpManagerFiles.length > 0,
      feedback360: !!feedback360File,
      selfReview: selfReviewFiles.length > 0,
      managerComments: managerComments.trim().length > 0
    }

    const mockExtractedData = {
      itpEmployeeScores: itpEmployeeFiles.length > 0 ? { humble: 8, hungry: 7, smart: 9 } : null,
      itpManagerScores: itpManagerFiles.length > 0 ? { humble: 7, hungry: 8, smart: 8 } : null,
      feedback360Summary: feedback360File ? "Strategic thinking, cross-functional collaboration, technical expertise..." : null,
      selfReviewSummary: selfReviewFiles.length > 0 ? "Focused on continuous learning, project leadership, team development..." : null
    }

    // Build context for Claude
    const dataSources: string[] = []
    if (mockExtractedData.itpEmployeeScores) {
      dataSources.push(`ITP Employee Scores: Humble ${mockExtractedData.itpEmployeeScores.humble}/10, Hungry ${mockExtractedData.itpEmployeeScores.hungry}/10, Smart ${mockExtractedData.itpEmployeeScores.smart}/10`)
    }
    if (mockExtractedData.itpManagerScores) {
      dataSources.push(`ITP Manager Scores: Humble ${mockExtractedData.itpManagerScores.humble}/10, Hungry ${mockExtractedData.itpManagerScores.hungry}/10, Smart ${mockExtractedData.itpManagerScores.smart}/10`)
    }
    if (mockExtractedData.feedback360Summary) {
      dataSources.push(`360 Feedback: ${mockExtractedData.feedback360Summary}`)
    }
    if (mockExtractedData.selfReviewSummary) {
      dataSources.push(`Self Review: ${mockExtractedData.selfReviewSummary}`)
    }
    if (managerComments.trim()) {
      dataSources.push(`Manager Comments: ${managerComments}`)
    }

    const dataContext = dataSources.length > 0 ? dataSources.join('\n\n') : 'No data provided'

    const prompt = `You are a professional HR performance review writer. Generate a performance review based on the following data.

DATA SOURCES:
${dataContext}

Return ONLY a valid JSON object with exactly these 4 keys (no markdown, no code fences, just raw JSON):
{
  "strengths": "2-3 paragraphs about the employee's greatest strengths based on the data provided",
  "developmentFeedback": "2-3 paragraphs about areas for development and constructive feedback",
  "goalsNextYear": "4-5 numbered goals for the next year with brief descriptions",
  "overallAssessment": "1-2 paragraphs with an overall assessment summary including data confidence level"
}

Make the content specific to the data provided. Be professional and constructive.`

    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json({
        ...generateFallback(dataUsed, mockExtractedData, managerComments),
        dataUsed,
        extractedData: mockExtractedData,
        error: 'API key not configured'
      })
    }

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errText)
      return NextResponse.json({
        ...generateFallback(dataUsed, mockExtractedData, managerComments),
        dataUsed,
        extractedData: mockExtractedData,
        error: `Claude API error: ${claudeResponse.status}`
      })
    }

    const result = await claudeResponse.json()
    const text = result.content?.[0]?.text || ''

    // Parse the JSON response from Claude
    let reviewContent: any
    try {
      // Strip any markdown code fences if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      reviewContent = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('Failed to parse Claude JSON response:', text.substring(0, 200))
      // Use the raw text as the overall assessment if JSON parsing fails
      reviewContent = {
        strengths: text.substring(0, Math.floor(text.length / 4)),
        developmentFeedback: text.substring(Math.floor(text.length / 4), Math.floor(text.length / 2)),
        goalsNextYear: text.substring(Math.floor(text.length / 2), Math.floor(text.length * 3 / 4)),
        overallAssessment: text.substring(Math.floor(text.length * 3 / 4))
      }
    }

    const response: SynthesisResponse = {
      strengths: reviewContent.strengths || 'No strengths data generated.',
      developmentFeedback: reviewContent.developmentFeedback || 'No development feedback generated.',
      goalsNextYear: reviewContent.goalsNextYear || 'No goals generated.',
      overallAssessment: reviewContent.overallAssessment || 'No overall assessment generated.',
      dataUsed,
      extractedData: mockExtractedData
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateFallback(dataUsed: any, extractedData: any, managerComments: string) {
  const count = Object.values(dataUsed).filter(Boolean).length
  return {
    strengths: `Based on ${count} data source(s): ${managerComments ? managerComments.substring(0, 200) : 'No specific data provided.'}`,
    developmentFeedback: 'Development areas will be identified with more comprehensive data input.',
    goalsNextYear: '1. Continue professional development\n2. Strengthen collaboration skills\n3. Expand technical expertise',
    overallAssessment: `Assessment based on ${count} of 4 possible data sources. Provide additional inputs for a more comprehensive review.`
  }
}

export async function GET() {
  return new NextResponse(null, { status: 405 })
}
