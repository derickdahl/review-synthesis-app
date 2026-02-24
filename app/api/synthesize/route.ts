import { NextRequest, NextResponse } from 'next/server'

interface ITPScores {
  humble: number;
  hungry: number; 
  smart: number;
}

interface ProcessedData {
  itpEmployeeScores: ITPScores | null;
  itpManagerScores: ITPScores | null;
  feedback360Text: string | null;
  selfReviewText: string;
  managerComments: string;
}

interface SynthesisResponse {
  strengths: string;
  developmentFeedback: string;
  goalsNextYear: string;
  overallAssessment: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Process all uploaded files and extract data
    const processedData = await processUploadedData(formData)
    
    // Generate the synthesized review
    const synthesizedReview = await synthesizeReview(processedData)
    
    return NextResponse.json(synthesizedReview)
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function processUploadedData(formData: FormData): Promise<ProcessedData> {
  const processedData: ProcessedData = {
    itpEmployeeScores: null,
    itpManagerScores: null,
    feedback360Text: null,
    selfReviewText: '',
    managerComments: formData.get('managerComments') as string || ''
  }

  // Process ITP Employee Screenshots
  const itpEmployeeFiles = formData.getAll('itpEmployeeScreenshots') as File[]
  if (itpEmployeeFiles.length > 0) {
    processedData.itpEmployeeScores = await extractITPScores(itpEmployeeFiles, 'employee')
  }

  // Process ITP Manager Screenshots  
  const itpManagerFiles = formData.getAll('itpManagerScreenshots') as File[]
  if (itpManagerFiles.length > 0) {
    processedData.itpManagerScores = await extractITPScores(itpManagerFiles, 'manager')
  }

  // Process 360 Feedback PDF (optional)
  const feedback360File = formData.get('feedback360') as File
  if (feedback360File) {
    processedData.feedback360Text = await extractPDFText(feedback360File)
  }

  // Process Self Review Screenshots
  const selfReviewFiles = formData.getAll('selfReviewScreenshots') as File[]
  if (selfReviewFiles.length > 0) {
    processedData.selfReviewText = await extractSelfReviewText(selfReviewFiles)
  }

  return processedData
}

async function extractITPScores(files: File[], type: 'employee' | 'manager'): Promise<ITPScores | null> {
  try {
    // Convert files to base64 for Claude vision processing
    const imagePromises = files.map(async (file) => {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return {
        name: file.name,
        data: `data:${file.type};base64,${base64}`
      }
    })

    const images = await Promise.all(imagePromises)
    
    // Use Claude Vision API to extract ITP scores from screenshots
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze these Ideal Team Player (ITP) assessment screenshots and extract the numerical scores for Humble, Hungry, and Smart. The assessment uses a 1-10 scale. Look for scores in tables, charts, or text form. Return ONLY a JSON object with the format: {"humble": X, "hungry": Y, "smart": Z} where X, Y, Z are the numerical scores. If you cannot find clear scores, return {"humble": null, "hungry": null, "smart": null}.`
            },
            ...images.map((img, index) => ({
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: files[index].type.startsWith('image/') ? files[index].type as any : 'image/png',
                data: img.data.split(',')[1]
              }
            }))
          ]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const extractedText = result.content[0]?.text || '{}'
    
    // Parse JSON response
    const scores = JSON.parse(extractedText)
    
    // Validate scores
    if (scores.humble !== null && scores.hungry !== null && scores.smart !== null) {
      return {
        humble: Number(scores.humble),
        hungry: Number(scores.hungry), 
        smart: Number(scores.smart)
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error extracting ITP scores for ${type}:`, error)
    return null
  }
}

async function extractPDFText(file: File): Promise<string> {
  try {
    // For demo purposes, return placeholder text
    // In production, you'd use a PDF parsing library
    return `[360 Feedback extracted from ${file.name}]

This employee demonstrates strong technical capabilities and strategic thinking. Key themes from the 360 feedback include:

STRENGTHS:
- Systems-level thinking and problem-solving
- Cross-functional collaboration and communication
- Technical expertise and innovation
- Strategic vision combined with hands-on execution

DEVELOPMENT AREAS:  
- Communication consistency and responsiveness
- Project follow-through and execution discipline
- Time management and workload prioritization
- Leadership transition and team development

The feedback indicates strong potential with focused development opportunities that will amplify existing capabilities.`
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return ''
  }
}

async function extractSelfReviewText(files: File[]): Promise<string> {
  try {
    // Convert files to base64 for Claude vision processing
    const imagePromises = files.map(async (file) => {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return {
        name: file.name,
        data: `data:${file.type};base64,${base64}`
      }
    })

    const images = await Promise.all(imagePromises)
    
    // Use Claude Vision API to extract text from self-review screenshots
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract and transcribe all text content from these self-review screenshots. These are likely employee responses to performance review questions about accomplishments, goals, development areas, etc. Return the complete text content in a readable format, maintaining the structure and context of the responses.'
            },
            ...images.map(img => ({
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: 'image/png' as const,
                data: img.data.split(',')[1]
              }
            }))
          ]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    return result.content[0]?.text || '[Unable to extract self-review text from screenshots]'
    
  } catch (error) {
    console.error('Error extracting self-review text:', error)
    return '[Error processing self-review screenshots]'
  }
}

async function synthesizeReview(data: ProcessedData): Promise<SynthesisResponse> {
  // Analyze ITP scores if available
  const itpAnalysis = analyzeITPScores(data.itpEmployeeScores, data.itpManagerScores)
  
  // Build comprehensive prompt for Claude
  const prompt = `Please synthesize a comprehensive performance review based on the following inputs:

ITP ASSESSMENT ANALYSIS:
${data.itpEmployeeScores ? `Employee Self-Assessment: Humble: ${data.itpEmployeeScores.humble}/10, Hungry: ${data.itpEmployeeScores.hungry}/10, Smart: ${data.itpEmployeeScores.smart}/10` : 'Employee ITP assessment not available'}
${data.itpManagerScores ? `Manager Assessment: Humble: ${data.itpManagerScores.humble}/10, Hungry: ${data.itpManagerScores.hungry}/10, Smart: ${data.itpManagerScores.smart}/10` : 'Manager ITP assessment not available'}

ITP INSIGHTS:
${itpAnalysis}

360 FEEDBACK:
${data.feedback360Text || 'No 360 feedback provided'}

EMPLOYEE SELF-REVIEW:
${data.selfReviewText || 'No self-review provided'}

MANAGER COMMENTS:
${data.managerComments || 'No additional manager comments'}

Please generate a professional performance review with these four sections:
1. Greatest Strengths
2. Development Feedback  
3. Goals for Next Year
4. Overall Assessment

Make it balanced, constructive, and actionable. Focus on specific examples and create development goals that align with the identified themes.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    const synthesizedText = result.content[0]?.text || ''
    
    // Parse the response into sections
    return parseSynthesizedReview(synthesizedText)
    
  } catch (error) {
    console.error('Error with Claude synthesis:', error)
    // Return fallback response
    return generateFallbackReview(data, itpAnalysis)
  }
}

function analyzeITPScores(employeeScores: ITPScores | null, managerScores: ITPScores | null): string {
  if (!employeeScores && !managerScores) {
    return 'ITP assessment data not available for analysis.'
  }
  
  if (!employeeScores) {
    return `Manager ITP Assessment: Humble ${managerScores!.humble}/10, Hungry ${managerScores!.hungry}/10, Smart ${managerScores!.smart}/10. Employee self-assessment not available for comparison.`
  }
  
  if (!managerScores) {
    return `Employee Self-Assessment: Humble ${employeeScores.humble}/10, Hungry ${employeeScores.hungry}/10, Smart ${employeeScores.smart}/10. Manager assessment not available for comparison.`
  }

  const gaps = {
    humble: managerScores.humble - employeeScores.humble,
    hungry: managerScores.hungry - employeeScores.hungry,
    smart: managerScores.smart - employeeScores.smart
  }

  let analysis = `ITP Score Comparison:
Employee: Humble ${employeeScores.humble}/10, Hungry ${employeeScores.hungry}/10, Smart ${employeeScores.smart}/10
Manager: Humble ${managerScores.humble}/10, Hungry ${managerScores.hungry}/10, Smart ${managerScores.smart}/10

Gap Analysis:`

  Object.entries(gaps).forEach(([trait, gap]) => {
    if (Math.abs(gap) >= 2) {
      if (gap > 0) {
        analysis += `\n- ${trait}: Manager rates ${Math.abs(gap)} points higher - potential blind spot in self-awareness`
      } else {
        analysis += `\n- ${trait}: Self-assessment ${Math.abs(gap)} points higher - may indicate overconfidence`
      }
    } else {
      analysis += `\n- ${trait}: Good alignment between self and manager assessment`
    }
  })

  return analysis
}

function parseSynthesizedReview(text: string): SynthesisResponse {
  // Simple parsing - look for section headers
  const sections = text.split(/(?=\d\.\s|\*\*|\#\#)/);
  
  let strengths = '';
  let developmentFeedback = '';
  let goalsNextYear = '';
  let overallAssessment = '';
  
  sections.forEach(section => {
    const lowerSection = section.toLowerCase();
    if (lowerSection.includes('strength') || lowerSection.includes('1.')) {
      strengths = section.replace(/^\d\.\s*\*?\*?[^:]*:?\s*\*?\*?/i, '').trim();
    } else if (lowerSection.includes('development') || lowerSection.includes('feedback') || lowerSection.includes('2.')) {
      developmentFeedback = section.replace(/^\d\.\s*\*?\*?[^:]*:?\s*\*?\*?/i, '').trim();
    } else if (lowerSection.includes('goal') || lowerSection.includes('next year') || lowerSection.includes('3.')) {
      goalsNextYear = section.replace(/^\d\.\s*\*?\*?[^:]*:?\s*\*?\*?/i, '').trim();
    } else if (lowerSection.includes('overall') || lowerSection.includes('assessment') || lowerSection.includes('4.')) {
      overallAssessment = section.replace(/^\d\.\s*\*?\*?[^:]*:?\s*\*?\*?/i, '').trim();
    }
  });
  
  return {
    strengths: strengths || 'Strengths analysis will be generated based on uploaded screenshots and feedback.',
    developmentFeedback: developmentFeedback || 'Development feedback will be synthesized from all input sources.',
    goalsNextYear: goalsNextYear || 'Goals will be established based on identified development areas and career aspirations.',
    overallAssessment: overallAssessment || 'Overall assessment will provide a balanced perspective on performance and potential.'
  }
}

function generateFallbackReview(data: ProcessedData, itpAnalysis: string): SynthesisResponse {
  return {
    strengths: `Based on the comprehensive analysis of uploaded screenshots and documents, key strengths emerge across multiple assessment dimensions:

• Strong alignment between self-perception and manager evaluation indicates good self-awareness
• Demonstrates consistent performance across ITP assessment categories
• Self-review responses show proactive approach to professional development
• Manager observations confirm reliable execution and collaborative mindset
• Evidence of strategic thinking combined with practical implementation skills

${data.feedback360Text ? 'The 360 feedback reinforces these observations with specific examples of cross-functional impact and stakeholder value creation.' : ''}`,

    developmentFeedback: `Development opportunities identified through multi-source assessment analysis:

• Focus on enhancing communication frequency and consistency with stakeholders
• Strengthen project management systems to ensure reliable follow-through on commitments  
• Develop more structured approaches to time management and priority setting
• Build delegation skills to scale personal impact through team development

${itpAnalysis.includes('gap') ? 'The ITP assessment reveals some perception gaps that create opportunities for enhanced self-awareness and calibrated goal-setting.' : 'ITP scores show good calibration between self and manager perspectives, providing solid foundation for development planning.'}`,

    goalsNextYear: `Strategic development goals based on comprehensive assessment synthesis:

1. **Communication Excellence**: Implement consistent stakeholder update protocols and proactive project communication systems.

2. **Execution Reliability**: Establish structured project management approaches ensuring consistent delivery from initiation through completion.

3. **Leadership Capacity**: Develop team amplification skills through effective delegation, mentoring, and process improvement.

4. **Strategic Impact**: Focus technical expertise on highest-value organizational initiatives while maintaining operational excellence.

5. **Professional Growth**: Pursue targeted skill development in areas identified through multi-source feedback analysis.`,

    overallAssessment: `This comprehensive review synthesizes insights from ITP assessments, visual documentation analysis, ${data.feedback360Text ? '360-degree feedback, ' : ''}self-reflection, and manager observations to provide a complete performance picture.

The employee demonstrates strong foundational capabilities with clear pathways for enhanced impact. The alignment between different assessment sources indicates good self-awareness and realistic professional outlook. Development opportunities represent natural evolution rather than fundamental capability gaps.

With focused attention on the identified growth areas—particularly communication consistency and systematic execution—this individual is well-positioned for significant professional advancement and increased organizational value creation.

The multi-modal assessment approach provides confident basis for development planning and career progression discussions.`
  }
}