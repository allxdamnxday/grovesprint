export default function PriorityDot({ priority }) {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }
  
  return (
    <span 
      className={`inline-block w-3 h-3 rounded-full ${colors[priority] || colors.medium}`}
      title={`${priority} priority`}
    />
  )
}