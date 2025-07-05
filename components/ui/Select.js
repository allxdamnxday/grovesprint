import { forwardRef } from 'react'

const Select = forwardRef(({ label, error, options = [], className = '', variant = 'default', ...props }, ref) => {
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
      <select
        ref={ref}
        className={`w-full px-3 py-2 pr-10 text-gray-900 rounded-md transition-all duration-200 focus:outline-none shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.5rem] bg-no-repeat ${
          variants[variant]
        } ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-gray-900">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

export default Select