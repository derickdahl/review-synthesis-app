'use client'

import { useState } from 'react'
import { Upload, FileText, Users, MessageSquare, Settings, Download, Sparkles, X, Camera, CheckCircle, Eye } from 'lucide-react'

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
  dataUsed: {
    itpScores: boolean
    feedback360: boolean
    selfReview: boolean
    managerComments: boolean
  }
  extractedData?: {
    itpEmployeeScores: { humble: number; hungry: number; smart: number } | null
    itpManagerScores: { humble: number; hungry: number; smart: number } | null
    feedback360Summary: string | null
    selfReviewSummary: string | null
  }
}

const VERSION = "2.3.2-logs"

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
  const [error, setError] = useState<string | null>(null)

  // Calculate completion status for each step
  const getStepStatus = (stepId: number) => {
    switch (stepId) {
      case 1: // ITP Assessment
        return (inputs.itpEmployeeScreenshots.length > 0 && inputs.itpManagerScreenshots.length > 0) ? 'complete' :
               (inputs.itpEmployeeScreenshots.length > 0 || inputs.itpManagerScreenshots.length > 0) ? 'partial' : 'incomplete'
      case 2: // 360 Feedback (optional)
        return inputs.feedback360 ? 'complete' : 'skipped'
      case 3: // Self Review
        return inputs.selfReviewScreenshots.length > 0 ? 'complete' : 'incomplete'
      case 4: // Manager Comments
        return inputs.managerComments.trim().length > 0 ? 'complete' : 'incomplete'
      case 5: // Generate Review
        return output ? 'complete' : 'incomplete'
      default:
        return 'incomplete'
    }
  }

  // Auto-advance current step based on completion
  const updateCurrentStep = () => {
    for (let i = 1; i <= 5; i++) {
      const status = getStepStatus(i)
      if (status === 'incomplete') {
        setCurrentStep(i)
        return
      }
    }
    setCurrentStep(5) // All steps complete
  }

  const handleGenerateReview = async () => {
    console.log('Generate review clicked')
    setIsGenerating(true)
    setError(null)
    
    try {
      // Build form data
      const formData = new FormData()
      
      // Add all files and data
      inputs.itpEmployeeScreenshots.forEach((file) => {
        formData.append('itpEmployeeScreenshots', file)
      })
      
      inputs.itpManagerScreenshots.forEach((file) => {
        formData.append('itpManagerScreenshots', file)
      })
      
      inputs.selfReviewScreenshots.forEach((file) => {
        formData.append('selfReviewScreenshots', file)
      })
      
      if (inputs.feedback360) {
        formData.append('feedback360', inputs.feedback360)
      }
      
      formData.append('managerComments', inputs.managerComments)

      console.log('Sending API request...')
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || `HTTP ${response.status}: Failed to generate review`)
      }

      const result = await response.json()
      console.log('Review generated:', result)
      setOutput(result)
      updateCurrentStep()
      
    } catch (error) {
      console.error('Error generating review:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`DETAILED ERROR: ${errorMessage}`)
      
      // Also try to show the error in the UI more prominently
      alert(`DEBUG ERROR: ${errorMessage}`)
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
    
    // Update step progress
    setTimeout(updateCurrentStep, 100)
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
    
    setTimeout(updateCurrentStep, 100)
  }

  const handleExport = async () => {
    if (!output) return

    const reviewText = `PERFORMANCE REVIEW
Generated on ${new Date().toLocaleDateString()}

GREATEST STRENGTHS:
${output.strengths}

DEVELOPMENT FEEDBACK:
${output.developmentFeedback}

GOALS FOR NEXT YEAR:
${output.goalsNextYear}

OVERALL ASSESSMENT:
${output.overallAssessment}

---
Data Sources Used:
${output.dataUsed.itpScores ? '✓' : '✗'} ITP Assessment Scores
${output.dataUsed.feedback360 ? '✓' : '✗'} 360 Feedback Document  
${output.dataUsed.selfReview ? '✓' : '✗'} Employee Self Review
${output.dataUsed.managerComments ? '✓' : '✗'} Manager Comments

Generated by Review Synthesis App v${VERSION}`

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(reviewText)
      alert('Review copied to clipboard!')
    } catch (err) {
      // Fallback: download as text file
      const blob = new Blob([reviewText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-review-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
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
    accept = "image/*",
    stepNumber
  }: {
    title: string
    files: File[] | File | null
    onUpload: (files: FileList | null) => void
    onRemove: (index?: number) => void
    multiple?: boolean
    optional?: boolean
    accept?: string
    stepNumber: number
  }) => {
    const fileArray = Array.isArray(files) ? files : files ? [files] : []
    const stepStatus = getStepStatus(stepNumber)
    
    return (
      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
          {stepStatus === 'complete' && <CheckCircle className="w-5 h-5 text-green-500 mr-2" />}
          {title} 
          {optional && <span className="text-sm text-gray-500 ml-2">(Optional)</span>}
        </h3>
        
        {/* Upload Area */}
        <div className={`sonance-upload-area rounded-lg p-6 text-center ${
          stepStatus === 'complete' ? 'sonance-upload-complete' : ''
        }`}>
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
            <div className="inline-flex items-center px-4 py-2 sonance-button-primary rounded-md">
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
        <div className="px-3 py-1 rounded-full text-sm font-medium" 
             style={{ backgroundColor: '#EEF4FF', color: '#0066CC' }}>
          v{VERSION}
        </div>
      </div>

      {/* Progress Steps - Now Functional */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const status = getStepStatus(step.id)
            const isActive = currentStep === step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  status === 'complete' 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : status === 'partial'
                      ? 'bg-yellow-500 border-yellow-500 text-white'
                      : isActive 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : status === 'skipped'
                          ? 'bg-gray-200 border-gray-300 text-gray-400'
                          : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {status === 'complete' ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : 
                  status === 'complete' ? 'text-green-600' : 
                  status === 'skipped' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {step.title}
                  {status === 'skipped' && ' (Skipped)'}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
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
          <div className="sonance-card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Review Inputs</h2>
            
            {/* ITP Employee Screenshots */}
            <FileUploadArea
              title="1. ITP Employee Self-Assessment (Screenshots)"
              files={inputs.itpEmployeeScreenshots}
              onUpload={(files) => handleFileUpload(files, 'itpEmployeeScreenshots')}
              onRemove={(index) => removeFile('itpEmployeeScreenshots', index)}
              multiple={true}
              accept="image/*"
              stepNumber={1}
            />

            {/* ITP Manager Screenshots */}
            <FileUploadArea
              title="2. ITP Manager Assessment (Screenshots)"
              files={inputs.itpManagerScreenshots}
              onUpload={(files) => handleFileUpload(files, 'itpManagerScreenshots')}
              onRemove={(index) => removeFile('itpManagerScreenshots', index)}
              multiple={true}
              accept="image/*"
              stepNumber={1}
            />

            {/* 360 Feedback Upload - Optional */}
            <FileUploadArea
              title="3. 360 Feedback Document"
              files={inputs.feedback360}
              onUpload={(files) => handleFileUpload(files, 'feedback360')}
              onRemove={() => removeFile('feedback360')}
              multiple={false}
              optional={true}
              accept=".pdf"
              stepNumber={2}
            />

            {/* Self Review Screenshots */}
            <FileUploadArea
              title="4. Employee Self Review (Screenshots)"
              files={inputs.selfReviewScreenshots}
              onUpload={(files) => handleFileUpload(files, 'selfReviewScreenshots')}
              onRemove={(index) => removeFile('selfReviewScreenshots', index)}
              multiple={true}
              accept="image/*"
              stepNumber={3}
            />

            {/* Manager Comments */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                {getStepStatus(4) === 'complete' && <CheckCircle className="w-5 h-5 text-green-500 mr-2" />}
                5. Manager Comments
              </h3>
              <textarea
                className={`w-full h-32 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  getStepStatus(4) === 'complete' ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder="Add your observations and comments about this employee..."
                value={inputs.managerComments}
                onChange={(e) => {
                  setInputs(prev => ({ ...prev, managerComments: e.target.value }))
                  setTimeout(updateCurrentStep, 100)
                }}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}

            {/* Generate Review Button */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                📝 You can generate a review with any combination of inputs above
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Error:</p>
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                </div>
              )}
              
              <button
                onClick={handleGenerateReview}
                disabled={isGenerating}
                className="w-full sonance-button-primary py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
              
              <button
                onClick={async () => {
                  try {
                    setError('')
                    console.log('Testing API directly...')
                    const response = await fetch('/api/synthesize', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ test: true })
                    })
                    const result = await response.text()
                    alert(`API Test: ${response.status} - ${result.substring(0, 200)}`)
                  } catch (err) {
                    alert(`API Test Failed: ${err}`)
                  }
                }}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg text-sm"
              >
                🔧 Test API
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <div className="sonance-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Generated Review</h2>
              {output && (
                <button 
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-white font-medium transition-all duration-200"
                  style={{ backgroundColor: '#10B981' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              )}
            </div>

            {output ? (
              <div className="space-y-6">
                {/* Data Sources Used */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Data Sources Used:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>{output.dataUsed.itpScores ? '✓' : '✗'} ITP Assessment Scores</div>
                    <div>{output.dataUsed.feedback360 ? '✓' : '✗'} 360 Feedback Document</div>
                    <div>{output.dataUsed.selfReview ? '✓' : '✗'} Employee Self Review</div>
                    <div>{output.dataUsed.managerComments ? '✓' : '✗'} Manager Comments</div>
                  </div>
                </div>

                {/* Extracted Data Debug Info */}
                {output.extractedData && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Extracted Data Summary:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {output.extractedData.itpEmployeeScores && (
                        <div>Employee ITP: H:{output.extractedData.itpEmployeeScores.humble} Hu:{output.extractedData.itpEmployeeScores.hungry} S:{output.extractedData.itpEmployeeScores.smart}</div>
                      )}
                      {output.extractedData.itpManagerScores && (
                        <div>Manager ITP: H:{output.extractedData.itpManagerScores.humble} Hu:{output.extractedData.itpManagerScores.hungry} S:{output.extractedData.itpManagerScores.smart}</div>
                      )}
                      {output.extractedData.feedback360Summary && (
                        <div>360 Feedback: {output.extractedData.feedback360Summary}</div>
                      )}
                      {output.extractedData.selfReviewSummary && (
                        <div>Self Review: {output.extractedData.selfReviewSummary}</div>
                      )}
                    </div>
                  </div>
                )}

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