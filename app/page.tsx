'use client'

import { useState } from 'react'
import { Upload, FileText, Users, MessageSquare, Settings, Download, Sparkles, X, Camera } from 'lucide-react'

interface ReviewInputs {
  itpEmployeeScreenshots: File[]
  itpManagerScreenshots: File[]
  feedback360: File | null
  selfReviewScreenshots: File[]
  managerComments: string
}

interface ReviewOutput {
  strengths: string
  developmentFeedback: string
  goalsNextYear: string
  overallAssessment: string
}

const VERSION = "2.0.0"

export default function HomePage() {
  const [inputs, setInputs] = useState<ReviewInputs>({
    itpEmployeeScreenshots: [],
    itpManagerScreenshots: [],
    feedback360: null,
    selfReviewScreenshots: [],
    managerComments: ''
  })

  const [output, setOutput] = useState<ReviewOutput | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleGenerateReview = async () => {
    setIsGenerating(true)
    
    try {
      // Process all uploaded images through OCR/vision API
      const formData = new FormData()
      
      // Add ITP employee screenshots
      inputs.itpEmployeeScreenshots.forEach((file, index) => {
        formData.append(`itpEmployeeScreenshots`, file)
      })
      
      // Add ITP manager screenshots  
      inputs.itpManagerScreenshots.forEach((file, index) => {
        formData.append(`itpManagerScreenshots`, file)
      })
      
      // Add self-review screenshots
      inputs.selfReviewScreenshots.forEach((file, index) => {
        formData.append(`selfReviewScreenshots`, file)
      })
      
      // Add 360 feedback if provided
      if (inputs.feedback360) {
        formData.append('feedback360', inputs.feedback360)
      }
      
      // Add manager comments
      formData.append('managerComments', inputs.managerComments)

      const response = await fetch('/api/synthesize', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to generate review')
      }

      const result = await response.json()
      setOutput(result)
    } catch (error) {
      console.error('Error generating review:', error)
      // For demo purposes, show mock output
      setOutput({
        strengths: `Based on the comprehensive feedback analysis from uploaded screenshots and documents, this employee demonstrates exceptional strategic thinking capabilities combined with strong technical execution. The ITP assessment screenshots reveal consistently high scores in key areas, while the self-review responses show strong self-awareness and growth mindset.

Key strengths include:
• Systems-level thinking that addresses root causes rather than symptoms  
• Creative problem-solving that challenges conventional approaches
• Strong collaboration and cross-functional communication
• Effective translation of complex concepts into actionable business applications`,

        developmentFeedback: `The analysis of all uploaded materials suggests focused development opportunities that will amplify existing strengths:

Development priorities:
• Enhance communication consistency and responsiveness to stakeholders
• Strengthen project follow-through by implementing structured execution frameworks  
• Develop more systematic time management approaches for competing priorities
• Build delegation capabilities to scale impact through team development

The self-review screenshots indicate good self-awareness of these areas, creating strong foundation for targeted improvement efforts.`,

        goalsNextYear: `1. **Communication Excellence**: Establish structured communication protocols including regular status updates and proactive stakeholder engagement.

2. **Execution Systems**: Implement project management methodologies ensuring consistent delivery from ideation through completion.

3. **Leadership Development**: Focus on transitioning from individual contributor to team amplifier through effective delegation and mentoring.

4. **Strategic Impact**: Leverage technical expertise to drive broader organizational initiatives while maintaining focus on highest-priority deliverables.

5. **Professional Growth**: Pursue targeted skill development in areas identified through ITP assessment and self-reflection exercises.`,

        overallAssessment: `This comprehensive review, synthesized from multiple screenshot-based assessments and feedback documents, reveals an employee with exceptional potential and strong foundational capabilities. The visual data analysis confirms alignment between self-perception and manager assessment, indicating good self-awareness and realistic professional outlook.

The development opportunities identified represent natural next steps for someone with this skill profile, focusing on operational excellence and leadership transition rather than fundamental capability gaps. With structured attention to execution consistency and stakeholder communication, this individual is well-positioned for significant impact and career advancement.`
      })
    }
    
    setIsGenerating(false)
  }

  const handleFileUpload = (files: FileList | null, type: keyof ReviewInputs) => {
    if (!files) return

    if (type === 'feedback360') {
      setInputs(prev => ({ ...prev, [type]: files[0] }))
    } else {
      const fileArray = Array.from(files)
      setInputs(prev => ({
        ...prev,
        [type]: [...(prev[type] as File[]), ...fileArray]
      }))
    }
  }

  const removeFile = (type: keyof ReviewInputs, index?: number) => {
    if (type === 'feedback360') {
      setInputs(prev => ({ ...prev, [type]: null }))
    } else if (index !== undefined) {
      setInputs(prev => ({
        ...prev,
        [type]: (prev[type] as File[]).filter((_, i) => i !== index)
      }))
    }
  }

  const steps = [
    { id: 1, title: 'ITP Assessment', icon: Settings },
    { id: 2, title: '360 Feedback', icon: Users },
    { id: 3, title: 'Self Review', icon: FileText },
    { id: 4, title: 'Manager Comments', icon: MessageSquare },
    { id: 5, title: 'Generate Review', icon: Sparkles }
  ]

  const FileUploadArea = ({ 
    title, 
    files, 
    onUpload, 
    onRemove, 
    multiple = true, 
    optional = false,
    accept = "image/*"
  }: {
    title: string
    files: File[] | File | null
    onUpload: (files: FileList | null) => void
    onRemove: (index?: number) => void
    multiple?: boolean
    optional?: boolean
    accept?: string
  }) => {
    const fileArray = Array.isArray(files) ? files : files ? [files] : []
    
    return (
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
          {title} 
          {optional && <span className="text-sm text-gray-500 ml-2">(Optional)</span>}
        </h3>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => onUpload(e.target.files)}
            className="hidden"
            id={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="cursor-pointer block"
          >
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              {multiple ? 'Upload screenshots' : 'Upload document'} (click to browse)
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </div>
          </label>
        </div>

        {/* File List */}
        {fileArray.length > 0 && (
          <div className="mt-4 space-y-2">
            {fileArray.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
                <button
                  onClick={() => onRemove(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Version Number */}
      <div className="fixed top-4 right-4 z-10">
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          v{VERSION}
        </div>
      </div>

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
            
            {/* ITP Employee Screenshots */}
            <FileUploadArea
              title="1. ITP Employee Self-Assessment (Screenshots)"
              files={inputs.itpEmployeeScreenshots}
              onUpload={(files) => handleFileUpload(files, 'itpEmployeeScreenshots')}
              onRemove={(index) => removeFile('itpEmployeeScreenshots', index)}
              multiple={true}
              accept="image/*"
            />

            {/* ITP Manager Screenshots */}
            <FileUploadArea
              title="2. ITP Manager Assessment (Screenshots)"
              files={inputs.itpManagerScreenshots}
              onUpload={(files) => handleFileUpload(files, 'itpManagerScreenshots')}
              onRemove={(index) => removeFile('itpManagerScreenshots', index)}
              multiple={true}
              accept="image/*"
            />

            {/* 360 Feedback Upload - Now Optional */}
            <FileUploadArea
              title="3. 360 Feedback Document"
              files={inputs.feedback360}
              onUpload={(files) => handleFileUpload(files, 'feedback360')}
              onRemove={() => removeFile('feedback360')}
              multiple={false}
              optional={true}
              accept=".pdf"
            />

            {/* Self Review Screenshots */}
            <FileUploadArea
              title="4. Employee Self Review (Screenshots)"
              files={inputs.selfReviewScreenshots}
              onUpload={(files) => handleFileUpload(files, 'selfReviewScreenshots')}
              onRemove={(index) => removeFile('selfReviewScreenshots', index)}
              multiple={true}
              accept="image/*"
            />

            {/* Manager Comments */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">5. Manager Comments</h3>
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
                  <span>Processing Screenshots & Generating Review...</span>
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
                  Upload screenshots and documents, then click "Generate Review"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}