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

interface ExtractedData {
  itpEmployeeScores: { humble: number; hungry: number; smart: number } | null
  itpManagerScores: { humble: number; hungry: number; smart: number } | null
  feedback360Text: string | null
  selfReviewText: string | null
  extractionStatus: {
    itpEmployee: 'pending' | 'processing' | 'complete' | 'error'
    itpManager: 'pending' | 'processing' | 'complete' | 'error'
    feedback360: 'pending' | 'processing' | 'complete' | 'error' | 'skipped'
    selfReview: 'pending' | 'processing' | 'complete' | 'error'
  }
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
}

const VERSION = "2.1.1"

export default function HomePage() {
  const [inputs, setInputs] = useState<ReviewInputs>({
    itpEmployeeScreenshots: [],
    itpManagerScreenshots: [],
    feedback360: null,
    selfReviewScreenshots: [],
    managerComments: ''
  })

  const [extractedData, setExtractedData] = useState<ExtractedData>({
    itpEmployeeScores: null,
    itpManagerScores: null,
    feedback360Text: null,
    selfReviewText: null,
    extractionStatus: {
      itpEmployee: 'pending',
      itpManager: 'pending',
      feedback360: 'pending',
      selfReview: 'pending'
    }
  })

  const [output, setOutput] = useState<ReviewOutput | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showExtractedData, setShowExtractedData] = useState(false)

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
    setIsGenerating(true)
    
    try {
      // First, extract data from all uploads
      await extractDataFromUploads()
      
      // Then synthesize the review
      const formData = new FormData()
      
      // Add all files and data
      inputs.itpEmployeeScreenshots.forEach((file) => {
        formData.append(`itpEmployeeScreenshots`, file)
      })
      
      inputs.itpManagerScreenshots.forEach((file) => {
        formData.append(`itpManagerScreenshots`, file)
      })
      
      inputs.selfReviewScreenshots.forEach((file) => {
        formData.append(`selfReviewScreenshots`, file)
      })
      
      if (inputs.feedback360) {
        formData.append('feedback360', inputs.feedback360)
      }
      
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
      updateCurrentStep()
      
    } catch (error) {
      console.error('Error generating review:', error)
      // Show error state
    }
    
    setIsGenerating(false)
  }

  const extractDataFromUploads = async () => {
    // Update status to show processing
    setExtractedData(prev => ({
      ...prev,
      extractionStatus: {
        itpEmployee: inputs.itpEmployeeScreenshots.length > 0 ? 'processing' : 'pending',
        itpManager: inputs.itpManagerScreenshots.length > 0 ? 'processing' : 'pending',
        feedback360: inputs.feedback360 ? 'processing' : 'skipped',
        selfReview: inputs.selfReviewScreenshots.length > 0 ? 'processing' : 'pending'
      }
    }))

    // Simulate extraction process (in real implementation, this would call the API)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock extracted data
    setExtractedData(prev => ({
      ...prev,
      itpEmployeeScores: inputs.itpEmployeeScreenshots.length > 0 ? { humble: 8, hungry: 7, smart: 9 } : null,
      itpManagerScores: inputs.itpManagerScreenshots.length > 0 ? { humble: 7, hungry: 8, smart: 8 } : null,
      feedback360Text: inputs.feedback360 ? "Extracted 360 feedback content would appear here..." : null,
      selfReviewText: inputs.selfReviewScreenshots.length > 0 ? "Extracted self-review text would appear here..." : null,
      extractionStatus: {
        itpEmployee: inputs.itpEmployeeScreenshots.length > 0 ? 'complete' : 'pending',
        itpManager: inputs.itpManagerScreenshots.length > 0 ? 'complete' : 'pending',
        feedback360: inputs.feedback360 ? 'complete' : 'skipped',
        selfReview: inputs.selfReviewScreenshots.length > 0 ? 'complete' : 'pending'
      }
    }))
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
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          stepStatus === 'complete' ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
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

            {/* Show Extracted Data Button */}
            {(extractedData.itpEmployeeScores || extractedData.itpManagerScores || extractedData.selfReviewText) && (
              <button
                onClick={() => setShowExtractedData(!showExtractedData)}
                className="mb-4 flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <Eye className="h-4 w-4" />
                <span>{showExtractedData ? 'Hide' : 'Show'} Extracted Data</span>
              </button>
            )}

            {/* Extracted Data Display */}
            {showExtractedData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Data Extracted from Uploads:</h4>
                {extractedData.itpEmployeeScores && (
                  <div className="mb-2">
                    <strong>Employee ITP:</strong> Humble: {extractedData.itpEmployeeScores.humble}/10, 
                    Hungry: {extractedData.itpEmployeeScores.hungry}/10, 
                    Smart: {extractedData.itpEmployeeScores.smart}/10
                  </div>
                )}
                {extractedData.itpManagerScores && (
                  <div className="mb-2">
                    <strong>Manager ITP:</strong> Humble: {extractedData.itpManagerScores.humble}/10, 
                    Hungry: {extractedData.itpManagerScores.hungry}/10, 
                    Smart: {extractedData.itpManagerScores.smart}/10
                  </div>
                )}
                {extractedData.selfReviewText && (
                  <div className="mb-2">
                    <strong>Self Review Extract:</strong> {extractedData.selfReviewText.substring(0, 100)}...
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleGenerateReview}
              disabled={isGenerating || getStepStatus(4) !== 'complete'}
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
                <button 
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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