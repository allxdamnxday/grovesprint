export default function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    rectangle: 'rounded-md',
    circle: 'rounded-full',
  }
  
  const style = {
    width: width || (variant === 'text' ? '75%' : '100%'),
    height: height || (variant === 'rectangle' ? '100px' : undefined),
  }
  
  return (
    <div 
      className={`animate-pulse bg-gray-200 ${variants[variant]} ${className}`}
      style={style}
    />
  )
}

// Table skeleton component
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="w-full">
      <div className="border-b-2 border-gray-200 pb-3 mb-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width={i === 0 ? '60px' : '120px'} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 py-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                variant="text" 
                width={colIndex === 0 ? '60px' : colIndex === columns - 1 ? '80px' : '120px'} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Card skeleton component
export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <Skeleton variant="title" width="60%" className="mb-4" />
      <Skeleton variant="text" width="100%" className="mb-2" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="90%" />
    </div>
  )
}