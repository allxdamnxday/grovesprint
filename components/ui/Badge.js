export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-900 border border-gray-200',
    success: 'bg-green-50 text-green-900 border border-green-200',
    warning: 'bg-amber-50 text-amber-900 border border-amber-200',
    danger: 'bg-red-50 text-red-900 border border-red-200',
    info: 'bg-blue-50 text-blue-900 border border-blue-200',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }
  
  return (
    <span className={`inline-flex items-center font-semibold rounded-full shadow-sm ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  )
}