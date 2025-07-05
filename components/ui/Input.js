import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', variant = 'default', ...props }, ref) => {
  const variants = {
    default: `bg-white border border-gray-300 hover:border-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20`,
    filled: `bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-500/20`,
    minimal: `bg-transparent border-0 border-b border-gray-300 rounded-none hover:border-gray-400 focus:border-green-600 focus:ring-0 px-0`,
  }
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2 text-gray-900 placeholder-gray-400 rounded-md transition-all duration-200 focus:outline-none shadow-sm ${
          variants[variant]
        } ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input