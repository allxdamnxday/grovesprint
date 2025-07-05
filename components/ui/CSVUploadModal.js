import { useState, useEffect } from 'react'
import Button from './Button'
import FileInput from './FileInput'
import Badge from './Badge'
import { parseCSV, createTaskCSVTemplate } from '@/utils/csvParser'
import { validateAndFormatTasks, findDuplicateTasks } from '@/utils/taskValidator'

export default function CSVUploadModal({ isOpen, onClose, onImport, existingTasks = [] }) {
  const [file, setFile] = useState(null)
  const [csvContent, setCsvContent] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [validationResult, setValidationResult] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setFile(null)
      setCsvContent('')
      setParsedData(null)
      setValidationResult(null)
      setShowPreview(false)
    }
  }, [isOpen])

  const handleFileSelect = (selectedFile, content) => {
    setFile(selectedFile)
    setCsvContent(content)
    
    try {
      const parsed = parseCSV(content)
      setParsedData(parsed)
      
      // Validate tasks
      const validation = validateAndFormatTasks(parsed)
      
      // Check for duplicates
      const duplicates = findDuplicateTasks(validation.validTasks, existingTasks)
      
      setValidationResult({
        ...validation,
        duplicates,
        hasDuplicates: duplicates.length > 0
      })
      
      setShowPreview(true)
    } catch (error) {
      setValidationResult({
        errors: [error.message],
        hasErrors: true,
        validTasks: [],
        summary: { total: 0, valid: 0, invalid: 0 }
      })
    }
  }

  const handleImport = async () => {
    if (!validationResult || validationResult.hasErrors || validationResult.validTasks.length === 0) {
      return
    }

    setIsImporting(true)
    
    try {
      await onImport(validationResult.validTasks)
      onClose()
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = createTaskCSVTemplate()
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'memory_grove_tasks_template.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Tasks from CSV</h2>
              <p className="text-gray-600 mt-1">Upload a CSV file to bulk import tasks</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showPreview ? (
            <div className="space-y-6">
              <FileInput onFileSelect={handleFileSelect} />
              
              <div className="text-center">
                <p className="text-gray-600 mb-3">Need a template to get started?</p>
                <Button variant="secondary" onClick={downloadTemplate}>
                  Download CSV Template
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Required columns: week, day, task, priority</li>
                  <li>• Optional columns: status, due_date, notes</li>
                  <li>• Week must be 1-4</li>
                  <li>• Priority must be: high, medium, or low</li>
                  <li>• Date format: YYYY-MM-DD</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Validation Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Validation Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {validationResult.summary.total}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {validationResult.summary.valid}
                    </div>
                    <div className="text-sm text-gray-600">Valid Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {validationResult.summary.invalid}
                    </div>
                    <div className="text-sm text-gray-600">Invalid Tasks</div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-800 space-y-1 max-h-32 overflow-y-auto">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duplicates Warning */}
              {validationResult.hasDuplicates && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Duplicate Tasks Found:</h4>
                  <ul className="text-sm text-amber-800 space-y-1 max-h-32 overflow-y-auto">
                    {validationResult.duplicates.map((dup, index) => (
                      <li key={index}>• {dup.message}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-amber-700 mt-2">
                    These tasks will be skipped during import.
                  </p>
                </div>
              )}

              {/* Preview Table */}
              {validationResult.validTasks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Preview (showing first 5 valid tasks)
                  </h4>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-3 font-medium text-gray-700">Week</th>
                          <th className="text-left p-3 font-medium text-gray-700">Day</th>
                          <th className="text-left p-3 font-medium text-gray-700">Task</th>
                          <th className="text-left p-3 font-medium text-gray-700">Priority</th>
                          <th className="text-left p-3 font-medium text-gray-700">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {validationResult.validTasks.slice(0, 5).map((task, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-3">{task.week}</td>
                            <td className="p-3">{task.day}</td>
                            <td className="p-3">{task.task}</td>
                            <td className="p-3">
                              <Badge 
                                variant={
                                  task.priority === 'high' ? 'danger' : 
                                  task.priority === 'medium' ? 'warning' : 
                                  'default'
                                }
                                size="sm"
                              >
                                {task.priority}
                              </Badge>
                            </td>
                            <td className="p-3">{task.due_date || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validationResult.validTasks.length > 5 && (
                    <p className="text-sm text-gray-600 mt-2">
                      ... and {validationResult.validTasks.length - 5} more tasks
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              {showPreview && validationResult && (
                <p className="text-sm text-gray-600">
                  {validationResult.summary.valid > 0
                    ? `Ready to import ${validationResult.summary.valid} tasks`
                    : 'No valid tasks to import'}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {showPreview && (
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Back
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              {showPreview && validationResult && validationResult.summary.valid > 0 && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing...' : `Import ${validationResult.summary.valid} Tasks`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}