import { NextRequest, NextResponse } from 'next/server'

interface SynthesisRequest {
  itpSelfScores: { humble: number; hungry: number; smart: number } | null
  itpManagerScores: { humble: number; hungry: number; smart: number } | null
  feedback360Text: string
  selfReview: string
  managerComments: string
}

interface SynthesisResponse {
  strengths: string
  developmentFeedback: string
  goalsNextYear: string
  overallAssessment: string
}

export async function POST(request: NextRequest) {
  try {
    const data: SynthesisRequest = await request.json()
    
    // Extract and analyze data
    const itpAnalysis = analyzeITPScores(data.itpSelfScores, data.itpManagerScores)
    const synthesizedReview = await synthesizeReview(data, itpAnalysis)
    
    return NextResponse.json(synthesizedReview)
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Failed to synthesize review' },
      { status: 500 }
    )
  }
}

function analyzeITPScores(
  selfScores: { humble: number; hungry: number; smart: number } | null,
  managerScores: { humble: number; hungry: number; smart: number } | null
) {
  if (!selfScores || !managerScores) {
    return 'ITP assessment data incomplete'
  }

  const gaps = {
    humble: managerScores.humble - selfScores.humble,
    hungry: managerScores.hungry - selfScores.hungry,
    smart: managerScores.smart - selfScores.smart
  }

  const analysis: string[] = []
  
  // Analyze gaps
  Object.entries(gaps).forEach(([trait, gap]) => {
    if (Math.abs(gap) >= 2) {
      analysis.push(
        gap > 0 
          ? `Manager rates ${trait} higher than self-assessment (${managerScores[trait as keyof typeof managerScores]} vs ${selfScores[trait as keyof typeof selfScores]}) - potential blind spot in self-awareness`
          : `Self-assessment in ${trait} is higher than manager perspective (${selfScores[trait as keyof typeof selfScores]} vs ${managerScores[trait as keyof typeof managerScores]}) - may indicate overconfidence`
      )
    }
  })

  // Overall strengths
  const avgScores = {
    humble: (selfScores.humble + managerScores.humble) / 2,
    hungry: (selfScores.hungry + managerScores.hungry) / 2,
    smart: (selfScores.smart + managerScores.smart) / 2
  }

  const strengths = Object.entries(avgScores)
    .filter(([_, score]) => score >= 8)
    .map(([trait, score]) => `Strong ${trait} (avg ${score.toFixed(1)})`)

  const developmentAreas = Object.entries(avgScores)
    .filter(([_, score]) => score <= 6)
    .map(([trait, score]) => `Development opportunity in ${trait} (avg ${score.toFixed(1)})`)

  return {
    gaps: analysis,
    strengths,
    developmentAreas,
    avgScores
  }
}

async function synthesizeReview(data: SynthesisRequest, itpAnalysis: any): Promise<SynthesisResponse> {
  // This would call Claude/OpenAI API in a real implementation
  // For now, return a sophisticated synthesis based on the inputs
  
  const prompt = `Synthesize a professional performance review based on these inputs:

360 FEEDBACK:
${data.feedback360Text}

SELF REVIEW:
${data.selfReview}

MANAGER COMMENTS:
${data.managerComments}

ITP ANALYSIS:
${JSON.stringify(itpAnalysis, null, 2)}

Generate responses for these sections:
1. Greatest Strengths
2. Development Feedback  
3. Goals for Next Year
4. Overall Assessment

Make it professional, balanced, and actionable.`

  // Simulate AI response - in production, call Anthropic Claude API
  return {
    strengths: generateStrengthsSection(data, itpAnalysis),
    developmentFeedback: generateDevelopmentSection(data, itpAnalysis),
    goalsNextYear: generateGoalsSection(data, itpAnalysis),
    overallAssessment: generateOverallSection(data, itpAnalysis)
  }
}

function generateStrengthsSection(data: SynthesisRequest, itpAnalysis: any): string {
  const strengths = []
  
  // Extract strengths from ITP
  if (itpAnalysis.strengths.length > 0) {
    strengths.push(`ITP Assessment reveals: ${itpAnalysis.strengths.join(', ')}`)
  }
  
  // Pattern match common strength themes from inputs
  const strengthKeywords = ['strategic', 'technical', 'innovative', 'collaborative', 'leadership', 'problem-solving', 'communication']
  const foundStrengths = strengthKeywords.filter(keyword => 
    data.feedback360Text.toLowerCase().includes(keyword) || 
    data.selfReview.toLowerCase().includes(keyword) ||
    data.managerComments.toLowerCase().includes(keyword)
  )

  return `Based on comprehensive feedback analysis, key strengths include:

• ${foundStrengths.slice(0, 3).map(s => `Strong ${s} capabilities`).join('\n• ')}
• ${itpAnalysis.strengths.join('\n• ')}
• Demonstrates consistent value delivery across multiple domains
• Effective collaboration and cross-functional understanding

The feedback consistently highlights the ability to balance strategic thinking with practical execution, creating meaningful business impact.`
}

function generateDevelopmentSection(data: SynthesisRequest, itpAnalysis: any): string {
  const developmentAreas = []
  
  // Extract development themes
  if (data.feedback360Text.includes('communication') || data.managerComments.includes('communication')) {
    developmentAreas.push('Enhanced communication consistency and responsiveness')
  }
  
  if (data.feedback360Text.includes('follow-through') || data.managerComments.includes('execution')) {
    developmentAreas.push('Improved project follow-through and execution discipline')
  }
  
  if (itpAnalysis.developmentAreas.length > 0) {
    developmentAreas.push(...itpAnalysis.developmentAreas)
  }

  return `Primary development priorities focus on operational excellence and leadership transition:

• ${developmentAreas.slice(0, 4).join('\n• ')}
• Time management and workload prioritization
• Building scalable team processes and delegation capabilities

${itpAnalysis.gaps.length > 0 ? `\nITP Assessment insights:\n• ${itpAnalysis.gaps.join('\n• ')}` : ''}

These development areas represent opportunities to amplify existing strengths through better systems and processes.`
}

function generateGoalsSection(data: SynthesisRequest, itpAnalysis: any): string {
  return `Based on feedback themes and development priorities:

1. **Communication Excellence**: Establish consistent response protocols and proactive status updates for all projects and stakeholder interactions.

2. **Execution Systems**: Implement structured project management approaches ensuring reliable follow-through from concept to completion.

3. **Leadership Development**: Transition focus from individual contribution to team amplification through delegation and process development.

4. **Strategic Impact**: Leverage domain expertise to drive broader organizational transformation while maintaining focus on highest-priority initiatives.

5. **Self-Management**: Develop sustainable work practices including boundary setting and stress management for long-term effectiveness.

Success metrics should include stakeholder feedback on communication consistency, project completion rates, and team development progress.`
}

function generateOverallSection(data: SynthesisRequest, itpAnalysis: any): string {
  return `This individual demonstrates exceptional potential with a strong foundation of technical expertise and strategic thinking capabilities. The feedback reveals someone who consistently adds value through innovative problem-solving and cross-functional collaboration.

The development areas identified are primarily about maximizing existing strengths through better operational discipline and leadership systems. With focused attention on communication consistency and execution follow-through, this person is well-positioned to excel in expanded responsibilities.

The combination of ${itpAnalysis.strengths.join(', ')} positions them strongly for continued growth and increased organizational impact. The path forward involves building sustainable systems that allow their capabilities to scale effectively.`
}