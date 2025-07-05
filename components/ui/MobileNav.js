import React, { useState, useRef, useEffect } from 'react'

/**
 * MobileNav - A mobile-optimized navigation component with dropdown and scroll indicators
 */
export default function MobileNav({ tabs, activeTab, onTabChange }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const scrollContainerRef = useRef(null)
  const activeTabRef = useRef(null)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current && isMobile) {
      activeTabRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      })
    }
  }, [activeTab, isMobile])

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  if (!isMobile) {
    // Desktop view - horizontal tabs
    return (
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={tab.id === activeTab ? activeTabRef : null}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 font-semibold whitespace-nowrap rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-green-700 shadow-lg transform scale-105 border-b-2 border-green-600'
                : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md'
            }`}
          >
            <span className="text-sm sm:text-base">{tab.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Dropdown Navigation */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200"
        >
          <span className="font-semibold text-gray-900">
            {activeTabData?.label || 'Select Tab'}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  setShowDropdown(false)
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  activeTab === tab.id ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Horizontal Scroll Navigation (alternative) */}
      <div 
        ref={scrollContainerRef}
        className="md:hidden flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={tab.id === activeTab ? activeTabRef : null}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap rounded-full transition-all duration-200 text-sm ${
              activeTab === tab.id
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  )
}

/**
 * MobileBottomNav - A fixed bottom navigation bar for mobile
 */
export function MobileBottomNav({ tabs, activeTab, onTabChange }) {
  const maxVisibleTabs = 5
  const visibleTabs = tabs.slice(0, maxVisibleTabs)
  const moreTabs = tabs.slice(maxVisibleTabs)

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="grid grid-cols-5 h-16">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === tab.id 
                ? 'text-green-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl">{tab.icon || '📋'}</span>
            <span className="text-xs font-medium">{tab.shortLabel || tab.label.split(' ')[0]}</span>
          </button>
        ))}
        {moreTabs.length > 0 && (
          <button
            className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <span className="text-xl">⋯</span>
            <span className="text-xs font-medium">More</span>
          </button>
        )}
      </div>
    </div>
  )
}