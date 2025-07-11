import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { format } from 'date-fns'
import { 
  EnhancedRevenueChart, 
  EnhancedUnitsChart, 
  EnhancedMetricCard,
  ConversionFunnelChart 
} from '@/components/charts/EnhancedCharts'
import { MetricsPageSkeleton } from '@/components/ui/EnhancedSkeleton'

// Custom hook for handling input with local state
function useEditableField(initialValue, onSave, type = 'text') {
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (e) => {
    setValue(e.target.value)
    setIsEditing(true)
  }

  const handleBlur = () => {
    if (isEditing && value !== initialValue) {
      const finalValue = type === 'number' ? (parseFloat(value) || 0) : value
      onSave(finalValue)
      setIsEditing(false)
    }
  }

  return { value, onChange: handleChange, onBlur: handleBlur }
}

// Calculate trends (compare to previous period)
const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous * 100).toFixed(1)
}

export default function MetricsTab() {
  const supabase = useSupabaseClient()
  const [dailyMetrics, setDailyMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [chartData, setChartData] = useState([])
  const [partnerships, setPartnerships] = useState([])
  const [tasks, setTasks] = useState([])
  const [contacts, setContacts] = useState([])
  
  // Calculate aggregated metrics
  const aggregatedMetrics = dailyMetrics.reduce((acc, metric) => {
    acc.totalRevenue += parseFloat(metric.revenue || 0)
    acc.totalUnits += parseInt(metric.units_sold || 0)
    acc.totalVisitors += parseInt(metric.website_visitors || 0)
    acc.totalConversions += parseInt(metric.conversions || 0)
    acc.totalEmailSignups += parseInt(metric.email_signups || 0)
    return acc
  }, {
    totalRevenue: 0,
    totalUnits: 0,
    totalVisitors: 0,
    totalConversions: 0,
    totalEmailSignups: 0
  })
  
  // Calculate derived metrics
  const conversionRate = aggregatedMetrics.totalVisitors > 0 
    ? ((aggregatedMetrics.totalConversions / aggregatedMetrics.totalVisitors) * 100).toFixed(2)
    : 0
  
  const avgOrderValue = aggregatedMetrics.totalUnits > 0
    ? (aggregatedMetrics.totalRevenue / aggregatedMetrics.totalUnits).toFixed(2)
    : 0
    
  // Calculate real metrics from other tabs
  const signedPartnerships = partnerships.filter(p => p.status === 'signed').length
  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0
  const totalContacts = contacts.length

  const fetchDailyMetrics = useCallback(async () => {
    try {
      // Fetch daily metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('daily_metrics')
        .select('*')
        .order('date', { ascending: true })

      if (metricsError) throw metricsError
      setDailyMetrics(metricsData || [])
      
      // Fetch partnerships data
      const { data: partnershipsData, error: partnershipsError } = await supabase
        .from('partnerships')
        .select('*')
      
      if (!partnershipsError) {
        setPartnerships(partnershipsData || [])
      }
      
      // Fetch tasks data
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
      
      if (!tasksError) {
        setTasks(tasksData || [])
      }
      
      // Fetch contacts data
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
      
      if (!contactsError) {
        setContacts(contactsData || [])
      }
      
      // Prepare chart data
      const chartData = (metricsData || []).map(metric => ({
        date: format(new Date(metric.date), 'MMM dd'),
        revenue: parseFloat(metric.revenue || 0),
        units: parseInt(metric.units_sold || 0),
        visitors: parseInt(metric.website_visitors || 0)
      }))
      setChartData(chartData)
    } catch (error) {
      toast.error('Error fetching metrics')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchDailyMetrics()
    
    // Set up realtime subscriptions for all relevant tables
    const metricsChannel = supabase
      .channel('metrics-all-data')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'daily_metrics' }, 
        (payload) => {
          console.log('Metrics change received!', payload)
          if (payload.eventType === 'INSERT') {
            setDailyMetrics(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setDailyMetrics(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setDailyMetrics(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'partnerships' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPartnerships(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setPartnerships(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setPartnerships(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Metrics subscription status:', status)
      })

    setSubscription(metricsChannel)

    return () => {
      if (metricsChannel) {
        metricsChannel.unsubscribe()
      }
    }
  }, [supabase, fetchDailyMetrics])

  const addDailyMetric = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Check if today's entry already exists
      const existing = dailyMetrics.find(m => m.date === today)
      if (existing) {
        toast.error("Today's metrics already exist!")
        return
      }
      
      const { data, error } = await supabase
        .from('daily_metrics')
        .insert([{
          date: today,
          revenue: 0,
          units_sold: 0,
          website_visitors: 0,
          conversions: 0,
          email_signups: 0
        }])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setDailyMetrics(prev => [...prev, data])
      }
      
      toast.success('Daily metric entry added!')
    } catch (error) {
      toast.error('Error adding daily metric')
      console.error('Error:', error)
    }
  }

  const updateDailyMetric = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('daily_metrics')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      toast.error('Error updating metric')
      console.error('Error:', error)
    }
  }

  const deleteDailyMetric = async (id) => {
    try {
      const { error } = await supabase
        .from('daily_metrics')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setDailyMetrics(prev => prev.filter(item => item.id !== id))
      
      toast.success('Metric entry deleted')
    } catch (error) {
      toast.error('Error deleting metric')
      console.error('Error:', error)
    }
  }

  if (loading) return <MetricsPageSkeleton />

  // Daily metric row component
  const MetricRow = ({ metric }) => {
    const revenueField = useEditableField(metric.revenue || 0, (value) => 
      updateDailyMetric(metric.id, { revenue: value }), 'number'
    )
    
    const unitsField = useEditableField(metric.units_sold || 0, (value) => 
      updateDailyMetric(metric.id, { units_sold: value }), 'number'
    )
    
    const visitorsField = useEditableField(metric.website_visitors || 0, (value) => 
      updateDailyMetric(metric.id, { website_visitors: value }), 'number'
    )
    
    const conversionsField = useEditableField(metric.conversions || 0, (value) => 
      updateDailyMetric(metric.id, { conversions: value }), 'number'
    )
    
    const emailSignupsField = useEditableField(metric.email_signups || 0, (value) => 
      updateDailyMetric(metric.id, { email_signups: value }), 'number'
    )

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          {format(new Date(metric.date), 'MMM dd, yyyy')}
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...revenueField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...unitsField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...visitorsField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...conversionsField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...emailSignupsField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <button
            onClick={() => deleteDailyMetric(metric.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </td>
      </tr>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Metrics & KPIs</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {subscription ? '🟢 Real-time sync active' : '🔴 Connecting...'}
          </div>
          <Button onClick={addDailyMetric}>+ Add Today&apos;s Metrics</Button>
        </div>
      </div>

      {/* Metric Cards with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <EnhancedMetricCard 
          label="Memory Seed Kits Sold"
          value={aggregatedMetrics.totalUnits}
          target={100}
          trend={calculateTrend(aggregatedMetrics.totalUnits, 50)}
        />
        <EnhancedMetricCard 
          label="Total Revenue"
          value={aggregatedMetrics.totalRevenue}
          target={5000}
          prefix="$"
          trend={calculateTrend(aggregatedMetrics.totalRevenue, 2000)}
        />
        <EnhancedMetricCard 
          label="Email Subscribers"
          value={aggregatedMetrics.totalEmailSignups}
          target={500}
          trend={calculateTrend(aggregatedMetrics.totalEmailSignups, 200)}
        />
        <EnhancedMetricCard 
          label="Partnerships Signed"
          value={signedPartnerships}
          target={5}
          trend={null}
        />
        <EnhancedMetricCard 
          label="Task Completion"
          value={parseFloat(taskCompletionRate)}
          target={80}
          suffix="%"
          trend={null}
        />
        <EnhancedMetricCard 
          label="Total Contacts"
          value={totalContacts}
          target={50}
          trend={calculateTrend(totalContacts, 30)}
        />
      </div>
      
      {/* Additional KPI Row with enhanced cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <EnhancedMetricCard 
          label="Conversion Rate"
          value={parseFloat(conversionRate)}
          target={2}
          suffix="%"
          trend={calculateTrend(parseFloat(conversionRate), 1.5)}
        />
        <EnhancedMetricCard 
          label="Avg Order Value"
          value={parseFloat(avgOrderValue)}
          target={50}
          prefix="$"
          trend={calculateTrend(parseFloat(avgOrderValue), 45)}
        />
        <EnhancedMetricCard 
          label="Tasks Completed"
          value={completedTasks}
          target={totalTasks}
          trend={null}
        />
        <EnhancedMetricCard 
          label="Active Partnerships"
          value={partnerships.filter(p => p.status === 'active' || p.status === 'signed').length}
          target={10}
          trend={null}
        />
      </div>

      {/* Enhanced Charts with animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EnhancedRevenueChart data={chartData} />
        <EnhancedUnitsChart data={chartData} />
      </div>
      
      {/* Conversion Funnel */}
      <div className="mb-8">
        <ConversionFunnelChart 
          visitors={aggregatedMetrics.totalVisitors} 
          conversions={aggregatedMetrics.totalConversions}
        />
      </div>

      {/* Daily Metrics Table */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Metrics Entry</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Revenue ($)</th>
                <th className="text-left p-3">Units Sold</th>
                <th className="text-left p-3">Visitors</th>
                <th className="text-left p-3">Conversions</th>
                <th className="text-left p-3">Email Signups</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dailyMetrics.map((metric) => (
                <MetricRow key={metric.id} metric={metric} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}