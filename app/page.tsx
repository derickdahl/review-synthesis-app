'use client'

import { useState } from 'react'
import { Upload, FileText, Users, MessageSquare, Settings, Download, Sparkles } from 'lucide-react'

interface ReviewInputs {
  itpSelfScores: { humble: number; hungry: number; smart: number } | null
  itpManagerScores: { humble: number; hungry: number; smart: number } | null
  feedback360: File | null
  selfReview: string
  managerComments: string
}

interface ReviewOutput {
  strengths: string
  developmentFeedback: string
  goalsNextYear: string
  overallAssessment: string
}

export default function HomePage() {
  const [inputs, setInputs] = useState<ReviewInputs>({
    itpSelfScores: null,
    itpManagerScores: null,
    feedback360: null,
    selfReview: '',
    managerComments: ''
  })

  const [output, setOutput] = useState<ReviewOutput | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleGenerateReview = async () => {
    setIsGenerating(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Mock generated review
    setOutput({
      strengths: `Based on the comprehensive feedback analysis, this employee demonstrates exceptional strategic thinking capabilities combined with strong technical execution. The 360 feedback consistently highlights their ability to bridge high-level business concepts with practical implementation. Their cross-functional collaboration skills enable them to understand diverse departmental needs and create solutions that benefit the broader organization.

Key strengths include:
• Systems-level thinking that addresses root causes rather than symptoms  
• Creative problem-solving that challenges conventional approaches
• Deep technical expertise across multiple domains
• Effective translation of complex concepts into actionable business applications`,

      developmentFeedback: `The primary development focus should be on communication consistency and follow-through execution. While the feedback recognizes strong capabilities, there are clear opportunities to enhance reliability and organizational impact.

Development priorities:
• Improve responsiveness to emails, calls, and project updates - establish standard response time commitments
• Enhance project follow-through by creating clear action plans with defined timelines and ownership
• Strengthen time management through better boundary setting and workload prioritization
• Develop more consistent communication about project status and any timeline changes`,

      goalsNextYear: `1. **Communication Excellence**: Implement a structured communication framework including 24-48 hour response commitments and weekly status updates for active projects.

2. **Execution Systems**: Develop and utilize project management methodologies that ensure consistent follow-through from ideation to completion.

3. **Leadership Development**: Focus on transitioning from individual contributor to team amplifier - building support structures and delegation capabilities.

4. **Strategic Impact Expansion**: Leverage technical expertise to drive broader organizational transformation while maintaining focus on highest-priority initiatives.

5. **Sustainable Performance**: Establish workload boundaries and stress management practices to ensure long-term effectiveness in expanded role.`,

      overallAssessment: `This employee brings exceptional value through their unique combination of strategic vision and technical execution capabilities. Their systems thinking and innovative problem-solving consistently create organizational benefits that extend beyond immediate project scope. The development areas identified are primarily about maximizing their existing strengths through better operational discipline and communication consistency. With focused attention on follow-through and stakeholder communication, they are well-positioned to excel in their expanded leadership role.`
    })
    
    setIsGenerating(false)
  }

  const handleFileUpload = (file: File) => {
    setInputs(prev => ({ ...prev, feedback360: file }))
  }

  const steps = [
    { id: 1, title: 'ITP Assessment', icon: Settings },
    { id: 2, title: '360 Feedback', icon: Users },
    { id: 3, title: 'Self Review', icon: FileText },
    { id: 4, title: 'Manager Comments', icon: MessageSquare },
    { id: 5, title: 'Generate Review', icon: Sparkles }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Review Inputs</h2>
            
            {/* ITP Assessment */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">1. Ideal Team Player Assessment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Self-Assessment</h4>
                  <div className="space-y-2">
                    {['humble', 'hungry', 'smart'].map(trait => (
                      <div key={trait} className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 w-16 capitalize">{trait}:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          onChange={(e) => {
                            const value = parseInt(e.target.value)
                            setInputs(prev => ({
                              ...prev,
                              itpSelfScores: {
                                ...prev.itpSelfScores,
                                [trait]: value
                              } as any
                            }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Manager Assessment</h4>
                  <div className="space-y-2">
                    {['humble', 'hungry', 'smart'].map(trait => (
                      <div key={trait} className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 w-16 capitalize">{trait}:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          onChange={(e) => {
                            const value = parseInt(e.target.value)
                            setInputs(prev => ({
                              ...prev,
                              itpManagerScores: {
                                ...prev.itpManagerScores,
                                [trait]: value
                              } as any
                            }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 360 Feedback Upload */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">2. 360 Feedback Document</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">Upload 360 feedback PDF</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="feedback-upload"
                />
                <label
                  htmlFor="feedback-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer"
                >
                  Choose File
                </label>
                {inputs.feedback360 && (
                  <p className="mt-2 text-sm text-green-600">{inputs.feedback360.name}</p>
                )}
              </div>
            </div>

            {/* Self Review */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">3. Employee Self Review</h3>
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste employee's self-review text here..."
                value={inputs.selfReview}
                onChange={(e) => setInputs(prev => ({ ...prev, selfReview: e.target.value }))}
              />
            </div>

            {/* Manager Comments */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">4. Manager Comments</h3>
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add your observations and comments about this employee..."
                value={inputs.managerComments}
                onChange={(e) => setInputs(prev => ({ ...prev, managerComments: e.target.value }))}
              />
            </div>

            <button
              onClick={handleGenerateReview}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Review</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Generated Review</h2>
              {output && (
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              )}
            </div>

            {output ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Greatest Strengths</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{output.strengths}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Development Feedback</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{output.developmentFeedback}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Goals for Next Year</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{output.goalsNextYear}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Overall Assessment</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{output.overallAssessment}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Generated review will appear here</p>
                <p className="text-sm text-gray-400 mt-2">
                  Fill in the inputs and click "Generate Review" to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}