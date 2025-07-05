import React from 'react'

/**
 * MobileCard - A responsive card component for displaying data on mobile devices
 * Replaces table rows with a more mobile-friendly card layout
 */
export default function MobileCard({ 
  children, 
  className = '', 
  onDelete,
  onEdit,
  onClick,
  swipeable = false 
}) {
  return (
    <div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3
        transition-all duration-200 hover:shadow-md
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="space-y-3">
        {children}
      </div>
      
      {(onDelete || onEdit) && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * MobileCardRow - A row within a mobile card
 */
export function MobileCardRow({ label, value, className = '' }) {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

/**
 * MobileCardHeader - Header section for a mobile card
 */
export function MobileCardHeader({ title, subtitle, badge, priority }) {
  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-2">
        {priority && priority}
        {badge && badge}
      </div>
    </div>
  )
}