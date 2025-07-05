import { useState, useRef } from 'react'

export default function FileInput({ 
  accept = '.csv', 
  onFileSelect, 
  maxSize = 1048576, // 1MB default
  className = '' 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    setError('')
    
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase()
    if (fileExtension !== 'csv') {
      setError('Please upload a CSV file')
      return
    }
    
    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1048576).toFixed(1)}MB`)
      return
    }
    
    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      onFileSelect(file, content)
    }
    reader.onerror = () => {
      setError('Error reading file')
    }
    reader.readAsText(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className="text-4xl text-gray-400">
            📁
          </div>
          <div>
            <p className="text-gray-700 font-medium">
              {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              CSV files only (max {(maxSize / 1048576).toFixed(1)}MB)
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}