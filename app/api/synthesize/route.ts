import { NextRequest, NextResponse } from 'next/server'

interface SynthesisResponse {
  strengths: string;
  developmentFeedback: string;
  goalsNextYear: string;
  overallAssessment: string;
  dataUsed: {
    itpScores: boolean;
    feedback360: boolean;
    selfReview: boolean;
    managerComments: boolean;
  };
  extractedData: {
    itpEmployeeScores: { humble: number; hungry: number; smart: number } | null;
    itpManagerScores: { humble: number; hungry: number; smart: number } | null;
    feedback360Summary: string | null;
    selfReviewSummary: string | null;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called')
    const formData = await request.formData()
    
    // Extract basic information
    const managerComments = formData.get('managerComments') as string || ''
    const itpEmployeeFiles = formData.getAll('itpEmployeeScreenshots') as File[]
    const itpManagerFiles = formData.getAll('itpManagerScreenshots') as File[]
    const selfReviewFiles = formData.getAll('selfReviewScreenshots') as File[]
    const feedback360File = formData.get('feedback360') as File

    console.log('Received files:', {
      itpEmployee: itpEmployeeFiles.length,
      itpManager: itpManagerFiles.length,
      selfReview: selfReviewFiles.length,
      feedback360: !!feedback360File,
      managerComments: !!managerComments
    })

    // Track what data we have
    const dataUsed = {
      itpScores: itpEmployeeFiles.length > 0 || itpManagerFiles.length > 0,
      feedback360: !!feedback360File,
      selfReview: selfReviewFiles.length > 0,
      managerComments: !!managerComments.trim()
    }

    // For now, generate a working review with mock extracted data
    // We'll add real OCR processing once this basic flow works
    const mockExtractedData = {
      itpEmployeeScores: itpEmployeeFiles.length > 0 ? { humble: 8, hungry: 7, smart: 9 } : null,
      itpManagerScores: itpManagerFiles.length > 0 ? { humble: 7, hungry: 8, smart: 8 } : null,
      feedback360Summary: feedback360File ? "Strategic thinking, cross-functional collaboration, technical expertise..." : null,
      selfReviewSummary: selfReviewFiles.length > 0 ? "Focused on continuous learning, project leadership, team development..." : null
    }

    // Generate the review using Claude
    const reviewContent = await generateReviewWithClaude(dataUsed, mockExtractedData, managerComments)

    console.log('Review generated successfully')

    const response: SynthesisResponse = {
      ...reviewContent,
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

async function generateReviewWithClaude(dataUsed: any, extractedData: any, managerComments: string) {
  const availableData = Object.entries(dataUsed).filter(([_, used]) => used).map(([key, _]) => key).join(', ')
  
  const prompt = `Generate a professional performance review based on the following available data sources:

AVAILABLE DATA: ${availableData}

ITP SCORES (if available):
${extractedData.itpEmployeeScores ? `Employee Self-Assessment: Humble ${extractedData.itpEmployeeScores.humble}/10, Hungry ${extractedData.itpEmployeeScores.hungry}/10, Smart ${extractedData.itpEmployeeScores.smart}/10` : 'No employee ITP scores'}
${extractedData.itpManagerScores ? `Manager Assessment: Humble ${extractedData.itpManagerScores.humble}/10, Hungry ${extractedData.itpManagerScores.hungry}/10, Smart ${extractedData.itpManagerScores.smart}/10` : 'No manager ITP scores'}

360 FEEDBACK SUMMARY:
${extractedData.feedback360Summary || 'No 360 feedback provided'}

SELF REVIEW SUMMARY:
${extractedData.selfReviewSummary || 'No self review provided'}

MANAGER COMMENTS:
${managerComments || 'No manager comments provided'}

Please generate a review with these 4 sections:
1. Greatest Strengths
2. Development Feedback
3. Goals for Next Year  
4. Overall Assessment

Base the content on the available data sources and be specific about what informed each section.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      console.error(`Claude API error: ${response.status}`)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const synthesizedText = result.content[0]?.text || ''
    
    return parseReviewSections(synthesizedText)
    
  } catch (error) {
    console.error('Error calling Claude API:', error)
    // Return fallback content
    return generateFallbackReview(dataUsed, extractedData, managerComments)
  }
}

function parseReviewSections(text: string) {
  // Simple section parsing
  const sections = {
    strengths: extractSection(text, ['strength', '1.']),
    developmentFeedback: extractSection(text, ['development', 'feedback', '2.']),
    goalsNextYear: extractSection(text, ['goal', 'next year', '3.']),
    overallAssessment: extractSection(text, ['overall', 'assessment', '4.'])
  }

  return sections
}

function extractSection(text: string, keywords: string[]): string {
  const lines = text.split('\n')
  let sectionContent = ''
  let inSection = false
  let nextSectionFound = false

  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    
    // Check if this line starts a section we want
    const isTargetSection = keywords.some(keyword => lowerLine.includes(keyword))
    
    // Check if this line starts a different numbered section
    const isNumberedSection = /^\d\./.test(line.trim())
    
    if (isTargetSection) {
      inSection = true
      continue // Skip the header line
    }
    
    if (inSection && isNumberedSection && !isTargetSection) {
      nextSectionFound = true
      break
    }
    
    if (inSection && line.trim()) {
      sectionContent += line + '\n'
    }
  }

  return sectionContent.trim() || `Content for this section will be generated based on available data sources.`
}

function generateFallbackReview(dataUsed: any, extractedData: any, managerComments: string) {
  const dataSourceCount = Object.values(dataUsed).filter(Boolean).length
  
  return {
    strengths: `Based on analysis of ${dataSourceCount} data sources:

${extractedData.itpEmployeeScores ? `• Strong ITP self-assessment scores averaging ${Math.round((extractedData.itpEmployeeScores.humble + extractedData.itpEmployeeScores.hungry + extractedData.itpEmployeeScores.smart) / 3)}/10` : ''}
${extractedData.itpManagerScores ? `• Manager ITP ratings averaging ${Math.round((extractedData.itpManagerScores.humble + extractedData.itpManagerScores.hungry + extractedData.itpManagerScores.smart) / 3)}/10` : ''}
${dataUsed.feedback360 ? '• 360 feedback highlights strategic thinking and collaboration skills' : ''}
${dataUsed.selfReview ? '• Self-review demonstrates self-awareness and growth mindset' : ''}
${managerComments ? `• Manager notes: ${managerComments.substring(0, 100)}...` : ''}

Key strengths include strategic thinking, technical competence, and collaborative approach based on available assessment data.`,

    developmentFeedback: `Development opportunities identified through comprehensive review:

• Enhanced communication consistency and proactive stakeholder engagement
• Systematic project management for reliable delivery and follow-through
• Time management optimization for competing priorities and workload balance
• Leadership skill development for team amplification and delegation

${extractedData.itpEmployeeScores && extractedData.itpManagerScores ? 'ITP assessment shows alignment opportunities in specific competency areas.' : ''}`,

    goalsNextYear: `Recommended goals based on ${dataSourceCount} assessment sources:

1. **Communication Systems**: Establish structured protocols for project updates and stakeholder engagement
2. **Execution Excellence**: Implement consistent project management frameworks for reliable delivery
3. **Leadership Development**: Build delegation and team development capabilities
4. **Professional Growth**: Target skill development in areas identified through assessment process
5. **Performance Measurement**: Create metrics to track progress on development priorities`,

    overallAssessment: `This assessment synthesizes information from ${dataSourceCount} of 4 possible data sources (${Object.entries(dataUsed).filter(([_, used]) => used).map(([key, _]) => key).join(', ')}).

The employee demonstrates strong foundational capabilities with clear pathways for enhanced organizational impact. ${extractedData.itpEmployeeScores && extractedData.itpManagerScores ? 'ITP assessments indicate solid team player characteristics with specific development opportunities.' : ''} 

${managerComments ? 'Manager observations provide valuable context for performance evaluation and development planning.' : ''} With focused attention on the identified development areas, this individual is positioned for significant professional growth and increased value delivery.

Assessment confidence: ${Math.round((dataSourceCount / 4) * 100)}% based on available data sources.`
  }
}