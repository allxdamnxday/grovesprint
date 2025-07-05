// Enhanced skeleton loaders with smooth animations
export const MetricCardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
      <div className="h-8 bg-gray-300 rounded w-32 mb-3"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-2 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  )
}

export const ChartSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    </div>
  )
}

export const TableRowSkeleton = () => {
  return (
    <tr className="border-b animate-pulse">
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </td>
      <td className="p-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
    </tr>
  )
}

// Full page skeleton for metrics
export const MetricsPageSkeleton = () => {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-40"></div>
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Additional metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg border p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2">
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="text-left p-3">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}