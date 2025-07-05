import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Custom tooltip for revenue chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Format Y axis for currency
const formatCurrency = (value) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value}`
}

// Format Y axis for numbers
const formatNumber = (value) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value
}

// Enhanced Revenue Chart with gradient and animation
export const EnhancedRevenueChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Revenue Growth</h3>
        <span className="text-sm text-gray-500">Last 30 days</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Enhanced Units Sold Chart
export const EnhancedUnitsChart = ({ data }) => {
  const maxUnits = Math.max(...data.map(d => d.units))
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Units Sold</h3>
        <span className="text-sm text-gray-500">Peak: {maxUnits} units</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Bar 
            dataKey="units" 
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.units > 10 ? '#10b981' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Conversion Funnel Chart
export const ConversionFunnelChart = ({ visitors, conversions }) => {
  const data = [
    { name: 'Visitors', value: visitors, fill: '#3b82f6' },
    { name: 'Conversions', value: conversions, fill: '#10b981' }
  ]
  
  const conversionRate = visitors > 0 ? ((conversions / visitors) * 100).toFixed(1) : 0
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Conversion Funnel</h3>
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{visitors}</div>
          <div className="text-sm text-gray-500">Visitors</div>
        </div>
        <div className="flex-1 mx-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-sm font-medium text-gray-700">
                {conversionRate}% conversion
              </span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{conversions}</div>
          <div className="text-sm text-gray-500">Conversions</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
        <div 
          className="bg-gradient-to-r from-blue-600 to-green-600 h-4 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(conversionRate * 10, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Enhanced Metric Card with animation
export const EnhancedMetricCard = ({ label, value, target, icon, prefix = '', suffix = '', trend = null }) => {
  const percentage = target > 0 ? (value / target * 100).toFixed(1) : 0
  const isExceeded = value > target
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer">
      <div className="flex justify-between items-start mb-3">
        <div className="text-gray-600 text-sm font-medium">{label}</div>
        {trend !== null && (
          <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-3 text-gray-900">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Target: {prefix}{target.toLocaleString()}{suffix}</span>
          <span className={`font-semibold ${isExceeded ? 'text-green-600' : 'text-gray-700'}`}>
            {percentage}%
          </span>
        </div>
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${
              isExceeded ? 'bg-green-600' : percentage > 80 ? 'bg-yellow-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}