export default function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', ...props }) {
  const baseStyles = 'font-semibold rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-[0.98]'
  
  const variants = {
    primary: 'bg-green-700 text-white hover:bg-green-800 hover:shadow-md focus:ring-green-600 disabled:bg-green-300 disabled:cursor-not-allowed',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:shadow-sm focus:ring-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-60' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}