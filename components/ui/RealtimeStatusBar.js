import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function RealtimeStatusBar() {
  const supabase = useSupabaseClient()
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [lastSync, setLastSync] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('tasks').select('id').limit(1)
        if (!error) {
          setConnectionStatus('connected')
          setLastSync(new Date())
        } else {
          setConnectionStatus('error')
        }
      } catch {
        setConnectionStatus('error')
      }
    }

    // Initial check
    checkConnection()

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [supabase])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢'
      case 'error': return '🔴'
      default: return '🟡'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected'
      case 'error': return 'Connection Error'
      default: return 'Connecting...'
    }
  }

  const formatLastSync = () => {
    if (!lastSync) return 'Never'
    const seconds = Math.floor((new Date() - lastSync) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="fixed top-0 right-0 z-50 p-4">
      <div 
        className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all ${
          showDetails ? 'w-64' : 'w-auto'
        }`}
      >
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
        >
          <span className={getStatusColor()}>{getStatusIcon()}</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {showDetails && (
            <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
        
        {showDetails && (
          <div className="px-4 pb-3 space-y-2 border-t border-gray-100 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${getStatusColor()}`}>{getStatusText()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last sync</span>
              <span className="text-gray-700">{formatLastSync()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mode</span>
              <span className="text-gray-700">Real-time</span>
            </div>
            {connectionStatus === 'error' && (
              <button 
                onClick={() => window.location.reload()}
                className="w-full mt-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}