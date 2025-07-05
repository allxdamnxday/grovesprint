import React, { useState, useEffect } from 'react'

/**
 * ResponsiveTable - A wrapper component that switches between table and card view based on screen size
 */
export default function ResponsiveTable({ 
  children, 
  mobileView,
  breakpoint = 640,
  className = ''
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [breakpoint])

  if (isMobile && mobileView) {
    return (
      <div className={`space-y-3 ${className}`}>
        {mobileView}
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  )
}

/**
 * ResponsiveTableContainer - Container for responsive tables with loading states
 */
export function ResponsiveTableContainer({ 
  title, 
  description, 
  actionButton,
  children,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
  className = ""
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {(title || actionButton) && (
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {actionButton && (
              <div className="flex-shrink-0">
                {actionButton}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </div>
            </div>
          </div>
        ) : empty ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}