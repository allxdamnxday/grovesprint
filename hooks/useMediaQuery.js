import { useState, useEffect } from 'react'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Define listener
    const listener = (e) => setMatches(e.matches)
    
    // Add listener
    if (media.addListener) {
      media.addListener(listener)
    } else {
      media.addEventListener('change', listener)
    }

    // Cleanup
    return () => {
      if (media.removeListener) {
        media.removeListener(listener)
      } else {
        media.removeEventListener('change', listener)
      }
    }
  }, [query])

  return matches
}

// Convenience hooks
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)')
}