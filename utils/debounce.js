export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Create a debounced function with a cancel method
export function createDebouncedFunction(func, wait) {
  let timeout
  
  const debounced = function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
  
  debounced.cancel = () => {
    clearTimeout(timeout)
  }
  
  debounced.flush = (...args) => {
    clearTimeout(timeout)
    func(...args)
  }
  
  return debounced
}