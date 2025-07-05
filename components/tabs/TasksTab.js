import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import PriorityDot from '@/components/ui/PriorityDot'
import { TableSkeleton } from '@/components/ui/Skeleton'
import CSVUploadModal from '@/components/ui/CSVUploadModal'

// Custom hook for handling input with local state
function useEditableField(initialValue, onSave) {
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
      onSave(value)
      setIsEditing(false)
    }
  }

  return { value, onChange: handleChange, onBlur: handleBlur }
}

export default function TasksTab() {
  const supabase = useSupabaseClient()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [showCSVModal, setShowCSVModal] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('week', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      toast.error('Error fetching tasks')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTasks()
    
    // Set up realtime subscription
    const channel = supabase
      .channel('tasks-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        (payload) => {
          console.log('Task change received!', payload)
          // Handle different events
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new : task
            ))
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to tasks channel')
        }
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        console.log('Unsubscribing from tasks channel')
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchTasks])

  const addTask = async (week, day) => {
    try {
      const newTask = {
        task: 'New task',
        priority: 'medium',
        status: 'pending',
        completed: false,
        week: week,
        day: day
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single()

      if (error) throw error
      
      // Optimistically add the task to state
      if (data) {
        setTasks(prev => [...prev, data])
      }
      
      toast.success('Task added!')
    } catch (error) {
      toast.error('Error adding task')
      console.error('Error:', error)
    }
  }

  const updateTask = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      
      // Update status when task is completed
      if (updates.completed !== undefined) {
        await supabase
          .from('tasks')
          .update({ status: updates.completed ? 'completed' : 'pending' })
          .eq('id', id)
      }
    } catch (error) {
      toast.error('Error updating task')
      console.error('Error:', error)
    }
  }

  const deleteTask = async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Optimistically remove from state
      setTasks(prev => prev.filter(task => task.id !== id))
      
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Error deleting task')
      console.error('Error:', error)
    }
  }

  // Group tasks by week and day
  const groupedTasks = tasks.reduce((acc, task) => {
    const week = task.week || 0
    const day = task.day || 'Unassigned'
    
    if (!acc[week]) acc[week] = {}
    if (!acc[week][day]) acc[week][day] = []
    
    acc[week][day].push(task)
    return acc
  }, {})

  const weeks = [
    { number: 1, title: 'Week 1: Foundation & Legal Setup' },
    { number: 2, title: 'Week 2: Product Development & Marketing' },
    { number: 3, title: 'Week 3: Launch Preparation' },
    { number: 4, title: 'Week 4: Launch & Scale' },
  ]

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Launch Tasks & Timeline</h2>
          <div className="text-sm font-medium flex items-center gap-2">
            <span className="text-gray-400">🔄</span>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((week) => (
            <div key={week}>
              <div className="bg-gray-200 animate-pulse h-16 rounded-xl mb-4"></div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <TableSkeleton rows={3} columns={7} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Task row component with local state for editable fields
  const TaskRow = ({ task }) => {
    const taskNameField = useEditableField(task.task, (value) => 
      updateTask(task.id, { task: value })
    )
    
    const notesField = useEditableField(task.notes || '', (value) => 
      updateTask(task.id, { notes: value })
    )

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
        <td className="p-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => updateTask(task.id, { completed: e.target.checked })}
            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-1 cursor-pointer"
          />
        </td>
        <td className="p-3">
          <Input
            {...taskNameField}
            variant="filled"
            className="text-sm font-medium"
          />
        </td>
        <td className="p-3">
          <input
            type="date"
            value={task.due_date || ''}
            onChange={(e) => updateTask(task.id, { due_date: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 hover:border-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
          />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <PriorityDot priority={task.priority} />
            <Select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value })}
              options={priorityOptions}
              variant="minimal"
              className="text-sm font-medium py-1"
            />
          </div>
        </td>
        <td className="p-3">
          <Badge variant={task.status === 'completed' ? 'success' : 'warning'}>
            {task.status}
          </Badge>
        </td>
        <td className="p-3">
          <Input
            {...notesField}
            placeholder="Add notes..."
            variant="filled"
            className="text-sm"
          />
        </td>
        <td className="p-3">
          <button
            onClick={() => deleteTask(task.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium transition-all"
          >
            Delete
          </button>
        </td>
      </tr>
    )
  }

  const handleCSVImport = async (validTasks) => {
    try {
      // Bulk insert tasks
      const { data, error } = await supabase
        .from('tasks')
        .insert(validTasks)
        .select()

      if (error) throw error
      
      // Add imported tasks to state
      if (data && data.length > 0) {
        setTasks(prev => [...prev, ...data])
        toast.success(`Successfully imported ${data.length} tasks!`)
      }
    } catch (error) {
      toast.error('Error importing tasks: ' + error.message)
      console.error('Import error:', error)
      throw error
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Launch Tasks & Timeline</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => setShowCSVModal(true)}
          >
            📤 Import CSV
          </Button>
          <div className="text-sm font-medium flex items-center gap-2">
            <span className={subscription ? 'text-green-600' : 'text-red-600'}>
              {subscription ? '🟢' : '🔴'}
            </span>
            <span className="text-gray-600">
              {subscription ? 'Real-time sync active' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {weeks.map((week) => (
        <div key={week.number} className="mb-8">
          <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-5 rounded-xl mb-4 shadow-md">
            <h3 className="text-xl font-bold">{week.title}</h3>
          </div>

          {Object.entries(groupedTasks[week.number] || {}).map(([day, dayTasks]) => (
            <div key={day} className="bg-white p-6 mb-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-gray-900">{day}</h4>
                <Button
                  size="sm"
                  onClick={() => addTask(week.number, day)}
                >
                  + Add Task
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left p-3 w-10 text-gray-700 font-semibold">✓</th>
                      <th className="text-left p-3 text-gray-700 font-semibold">Task</th>
                      <th className="text-left p-3 w-32 text-gray-700 font-semibold">Due Date</th>
                      <th className="text-left p-3 w-28 text-gray-700 font-semibold">Priority</th>
                      <th className="text-left p-3 w-32 text-gray-700 font-semibold">Status</th>
                      <th className="text-left p-3 text-gray-700 font-semibold">Notes</th>
                      <th className="text-left p-3 w-20 text-gray-700 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dayTasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Add initial day group if week has no tasks */}
          {!groupedTasks[week.number] && (
            <div className="bg-white p-8 mb-4 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-center py-4">
                <p className="text-gray-600 mb-3 text-lg">No tasks for this week yet</p>
                <Button
                  size="sm"
                  onClick={() => addTask(week.number, `Day ${(week.number - 1) * 7 + 1}-${(week.number - 1) * 7 + 2}`)}
                >
                  + Add First Task
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onImport={handleCSVImport}
        existingTasks={tasks}
      />
    </div>
  )
}