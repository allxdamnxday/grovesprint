import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import PriorityDot from '@/components/ui/PriorityDot'
import Modal from '@/components/ui/Modal'
import { TableSkeleton } from '@/components/ui/Skeleton'
import CSVUploadModal from '@/components/ui/CSVUploadModal'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { format } from 'date-fns'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DraggableTaskRow, DraggableTaskCard } from '../tasks/DraggableTask'
import { createDebouncedFunction } from '@/utils/debounce'

// Custom hook for handling input with local state and debounced saving
function useEditableField(initialValue, onSave, delay = 800) {
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const debouncedSaveRef = useRef(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    // Create debounced save function
    debouncedSaveRef.current = createDebouncedFunction(async (newValue) => {
      if (newValue !== initialValue) {
        setIsSaving(true)
        try {
          await onSave(newValue)
        } finally {
          setIsSaving(false)
        }
      }
    }, delay)

    return () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel()
      }
    }
  }, [onSave, initialValue, delay])

  const handleChange = (e) => {
    const newValue = e.target.value
    setValue(newValue)
    setIsEditing(true)
    
    // Trigger debounced save
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current(newValue)
    }
  }

  const handleBlur = () => {
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.flush(value)
    }
    setIsEditing(false)
  }

  return { value, onChange: handleChange, onBlur: handleBlur, isSaving }
}

export default function TasksTab() {
  const supabase = useSupabaseClient()
  const user = useUser()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(null)
  const [currentDay, setCurrentDay] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [pendingUpdates, setPendingUpdates] = useState(new Set())
  const isMobile = useIsMobile()
  
  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('week', { ascending: true })
        .order('day', { ascending: true })
        .order('position', { ascending: true })
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
    
    // Set up realtime subscription with enhanced error handling
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
          
          // Skip updates that we initiated (pending updates)
          if (payload.eventType === 'UPDATE' && pendingUpdates.has(payload.new.id)) {
            // Remove from pending once we receive confirmation
            setPendingUpdates(prev => {
              const newSet = new Set(prev)
              newSet.delete(payload.new.id)
              return newSet
            })
            return
          }
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            setTasks(prev => {
              // Check if task already exists (from optimistic update)
              if (prev.some(t => t.id === payload.new.id)) {
                return prev
              }
              return [...prev, payload.new]
            })
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
          setConnectionStatus('connected')
          console.log('Successfully subscribed to tasks channel')
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error')
          toast.error('Real-time connection lost. Please refresh the page.')
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('timeout')
        }
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        console.log('Unsubscribing from tasks channel')
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchTasks, pendingUpdates])

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

  const updateTask = async (id, updates, skipOptimistic = false) => {
    try {
      // Add to pending updates to prevent echo from real-time
      setPendingUpdates(prev => new Set(prev).add(id))
      
      // Optimistic update - update local state immediately
      if (!skipOptimistic) {
        setTasks(prev => prev.map(task => 
          task.id === id 
            ? { 
                ...task, 
                ...updates,
                // If updating completed status, also update status field
                ...(updates.completed !== undefined ? {
                  status: updates.completed ? 'completed' : 'pending'
                } : {})
              } 
            : task
        ))
      }
      
      // Prepare final updates object
      const finalUpdates = {
        ...updates,
        // Include status update if completed is being changed
        ...(updates.completed !== undefined ? {
          status: updates.completed ? 'completed' : 'pending'
        } : {})
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(finalUpdates)
        .eq('id', id)

      if (error) throw error
      
    } catch (error) {
      // Rollback optimistic update on error
      if (!skipOptimistic) {
        fetchTasks()
      }
      
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
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
  
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }
  
  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }
    
    // Find the tasks and their contexts
    const activeTask = tasks.find(t => t.id === active.id)
    const overTask = tasks.find(t => t.id === over.id)
    
    if (!activeTask || !overTask) {
      setActiveId(null)
      return
    }
    
    // If moving within the same day
    if (activeTask.week === overTask.week && activeTask.day === overTask.day) {
      const dayTasks = tasks
        .filter(t => t.week === activeTask.week && t.day === activeTask.day)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
      
      const oldIndex = dayTasks.findIndex(t => t.id === active.id)
      const newIndex = dayTasks.findIndex(t => t.id === over.id)
      
      if (oldIndex !== newIndex) {
        const newDayTasks = arrayMove(dayTasks, oldIndex, newIndex)
        
        // Update positions
        const updates = newDayTasks.map((task, index) => ({
          id: task.id,
          position: index
        }))
        
        // Optimistically update UI
        setTasks(prevTasks => {
          const otherTasks = prevTasks.filter(
            t => !(t.week === activeTask.week && t.day === activeTask.day)
          )
          return [...otherTasks, ...newDayTasks.map((t, i) => ({ ...t, position: i }))]
        })
        
        // Update in database
        try {
          for (const update of updates) {
            await supabase
              .from('tasks')
              .update({ position: update.position })
              .eq('id', update.id)
          }
        } catch (error) {
          toast.error('Error updating task order')
          console.error('Error:', error)
          // Revert on error
          fetchTasks()
        }
      }
    } else {
      // Moving to a different day - update week/day and reset position
      try {
        await supabase
          .from('tasks')
          .update({ 
            week: overTask.week, 
            day: overTask.day,
            position: overTask.position + 1 
          })
          .eq('id', activeTask.id)
        
        toast.success('Task moved to ' + overTask.day)
        fetchTasks() // Refresh to get updated positions
      } catch (error) {
        toast.error('Error moving task')
        console.error('Error:', error)
      }
    }
    
    setActiveId(null)
  }

  // Filter tasks based on search query
  const filteredTasks = searchQuery.trim() === '' 
    ? tasks 
    : tasks.filter(task => {
        const searchLower = searchQuery.toLowerCase()
        return (
          task.task.toLowerCase().includes(searchLower) ||
          (task.notes && task.notes.toLowerCase().includes(searchLower)) ||
          task.priority.toLowerCase().includes(searchLower) ||
          task.status.toLowerCase().includes(searchLower)
        )
      })

  // Group tasks by week and day
  const groupedTasks = filteredTasks.reduce((acc, task) => {
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
    const taskNameField = useEditableField(task.task, async (value) => 
      await updateTask(task.id, { task: value })
    )
    
    const notesField = useEditableField(task.notes || '', async (value) => 
      await updateTask(task.id, { notes: value })
    )

    const rowContent = (
      <>
        <td className="p-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => updateTask(task.id, { completed: e.target.checked })}
            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-1 cursor-pointer"
          />
        </td>
        <td className="p-3">
          <div className="relative">
            <Input
              {...taskNameField}
              variant="filled"
              className="text-sm font-medium"
            />
            {taskNameField.isSaving && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Saving...</span>
            )}
          </div>
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
          <div className="relative">
            <Input
              {...notesField}
              placeholder="Add notes..."
              variant="filled"
              className="text-sm"
            />
            {notesField.isSaving && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Saving...</span>
            )}
          </div>
        </td>
        <td className="p-3">
          <button
            onClick={() => deleteTask(task.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium transition-all"
          >
            Delete
          </button>
        </td>
      </>
    )
    
    return (
      <DraggableTaskRow task={task} id={task.id}>
        {rowContent}
      </DraggableTaskRow>
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

  // Mobile Task Card Component
  const TaskCard = ({ task }) => {
    const handleEdit = () => {
      setEditingTask(task)
      setIsModalOpen(true)
    }
    
    const cardContent = (
      <>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => updateTask(task.id, { completed: e.target.checked })}
          className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-1 cursor-pointer"
        />
        <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PriorityDot priority={task.priority} />
                <span className="font-medium text-gray-900">{task.task}</span>
              </div>
              <Badge variant={task.status === 'completed' ? 'success' : 'warning'} size="sm">
                {task.status}
              </Badge>
            </div>
            
            {/* Due date if set */}
            {task.due_date && (
              <div className="text-sm text-gray-500 mb-2">
                Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
              </div>
            )}
            
            {/* Notes preview if exists */}
            {task.notes && (
              <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                {task.notes}
              </div>
            )}
        </div>
        
        {/* Action button */}
        <button
          onClick={handleEdit}
          className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
          View Details
        </button>
      </>
    )
    
    return (
      <DraggableTaskCard task={task} id={task.id}>
        {cardContent}
      </DraggableTaskCard>
    )
  }

  // Task Edit Form for Modal
  const TaskEditForm = ({ task }) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
          <input
            type="text"
            value={task.task}
            onChange={(e) => updateTask(task.id, { task: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={task.due_date || ''}
            onChange={(e) => updateTask(task.id, { due_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <Select
            value={task.priority}
            onChange={(e) => updateTask(task.id, { priority: e.target.value })}
            options={priorityOptions}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => updateTask(task.id, { completed: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Mark as completed</span>
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={task.notes || ''}
            onChange={(e) => updateTask(task.id, { notes: e.target.value })}
            placeholder="Add notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="3"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              deleteTask(task.id)
              setIsModalOpen(false)
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            Delete Task
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Launch Tasks & Timeline</h2>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full md:w-64"
            />
            <svg 
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {!isMobile && (
            <Button
              variant="secondary"
              onClick={() => setShowCSVModal(true)}
            >
              📤 Import CSV
            </Button>
          )}
          <div className="text-xs md:text-sm font-medium flex items-center gap-2">
            <span className={connectionStatus === 'connected' ? 'text-green-600' : connectionStatus === 'error' ? 'text-red-600' : 'text-yellow-600'}>
              {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'error' ? '🔴' : '🟡'}
            </span>
            <span className="text-gray-600 hidden md:inline">
              {connectionStatus === 'connected' ? 'Real-time sync active' : connectionStatus === 'error' ? 'Connection error' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      {searchQuery && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            Found <span className="font-semibold">{filteredTasks.length}</span> task{filteredTasks.length !== 1 ? 's' : ''} matching &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}

      {weeks.map((week) => {
        // Calculate week progress
        const weekTasks = Object.values(groupedTasks[week.number] || {}).flat()
        const weekCompleted = weekTasks.filter(t => t.completed).length
        const weekTotal = weekTasks.length
        const weekProgress = weekTotal > 0 ? ((weekCompleted / weekTotal) * 100).toFixed(0) : 0
        
        return (
          <div key={week.number} className="mb-8">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-5 rounded-xl mb-4 shadow-md">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <h3 className="text-lg md:text-xl font-bold">{week.title}</h3>
                {weekTotal > 0 && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-xs md:text-sm opacity-90">
                      {weekCompleted}/{weekTotal} tasks
                    </span>
                    <div className="bg-white/20 rounded-full h-2 w-24 md:w-32">
                      <div 
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{ width: `${weekProgress}%` }}
                      />
                    </div>
                    <span className="text-xs md:text-sm font-semibold">{weekProgress}%</span>
                  </div>
                )}
              </div>
            </div>

          {Object.entries(groupedTasks[week.number] || {}).map(([day, dayTasks]) => (
            <div key={day} className="bg-white p-4 md:p-6 mb-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-gray-900">{day}</h4>
                {!isMobile && (
                  <Button
                    size="sm"
                    onClick={() => addTask(week.number, day)}
                  >
                    + Add Task
                  </Button>
                )}
              </div>

              {/* Mobile View - Cards */}
              {isMobile ? (
                <SortableContext
                  items={dayTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {dayTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  <button
                    onClick={() => {
                      setCurrentWeek(week.number)
                      setCurrentDay(day)
                      addTask(week.number, day)
                    }}
                    className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border-2 border-dashed border-gray-300"
                  >
                    + Add Task to {day}
                  </button>
                  </div>
                </SortableContext>
              ) : (
                /* Desktop View - Table */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 w-10 text-gray-700 font-semibold"></th>
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
                      <SortableContext
                        items={dayTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {dayTasks.map((task) => (
                          <TaskRow key={task.id} task={task} />
                        ))}
                      </SortableContext>
                    </tbody>
                  </table>
                </div>
              )}
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
        )
      })}
      
      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onImport={handleCSVImport}
        existingTasks={tasks}
      />
      
      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        title="Edit Task"
      >
        {editingTask && <TaskEditForm task={editingTask} />}
      </Modal>
      
      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && (
          <div className="opacity-80">
            {tasks.find(t => t.id === activeId) && (
              <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-green-500">
                {tasks.find(t => t.id === activeId).task}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </div>
    </DndContext>
  )
}