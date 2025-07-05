import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { TableSkeleton } from '@/components/ui/Skeleton'

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

export default function BudgetTab() {
  const supabase = useSupabaseClient()
  const [budgetItems, setBudgetItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const totalBudget = 7000

  const fetchBudgetItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setBudgetItems(data || [])
    } catch (error) {
      toast.error('Error fetching budget items')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchBudgetItems()
    
    // Set up realtime subscription
    const channel = supabase
      .channel('budget-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'budget_items' 
        }, 
        (payload) => {
          console.log('Budget change received!', payload)
          // Handle different events
          if (payload.eventType === 'INSERT') {
            setBudgetItems(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setBudgetItems(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setBudgetItems(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Budget subscription status:', status)
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchBudgetItems])

  const addBudgetItem = async () => {
    try {
      const newItem = {
        category: 'General',
        item: 'New expense',
        budgeted: 0,
        actual: 0,
        date: new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('budget_items')
        .insert([newItem])
        .select()
        .single()

      if (error) throw error
      
      // Optimistically add to state
      if (data) {
        setBudgetItems(prev => [...prev, data])
      }
      
      toast.success('Budget item added!')
    } catch (error) {
      toast.error('Error adding budget item')
      console.error('Error:', error)
    }
  }

  const updateBudgetItem = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      toast.error('Error updating budget item')
      console.error('Error:', error)
    }
  }

  const deleteBudgetItem = async (id) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Optimistically remove from state
      setBudgetItems(prev => prev.filter(item => item.id !== id))
      
      toast.success('Budget item deleted')
    } catch (error) {
      toast.error('Error deleting budget item')
      console.error('Error:', error)
    }
  }

  // Calculate totals
  const totals = budgetItems.reduce((acc, item) => {
    acc.budgeted += parseFloat(item.budgeted || 0)
    acc.actual += parseFloat(item.actual || 0)
    return acc
  }, { budgeted: 0, actual: 0 })

  const remaining = totalBudget - totals.actual
  const percentUsed = totalBudget > 0 ? (totals.actual / totalBudget * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Budget Tracker</h2>
          <div className="text-sm font-medium flex items-center gap-2">
            <span className="text-gray-400">🔄</span>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
        
        {/* Budget Summary Skeleton */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-20"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <TableSkeleton rows={5} columns={8} />
        </div>
      </div>
    )
  }

  // Budget row component with local state
  const BudgetRow = ({ item }) => {
    const categoryField = useEditableField(item.category, (value) => 
      updateBudgetItem(item.id, { category: value })
    )
    
    const itemField = useEditableField(item.item, (value) => 
      updateBudgetItem(item.id, { item: value })
    )
    
    const budgetedField = useEditableField(item.budgeted || 0, (value) => 
      updateBudgetItem(item.id, { budgeted: value }), 'number'
    )
    
    const actualField = useEditableField(item.actual || 0, (value) => 
      updateBudgetItem(item.id, { actual: value }), 'number'
    )
    
    const notesField = useEditableField(item.notes || '', (value) => 
      updateBudgetItem(item.id, { notes: value })
    )

    const variance = (parseFloat(item.budgeted || 0) - parseFloat(item.actual || 0))

    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
        <td className="p-3">
          <Input
            {...categoryField}
            variant="filled"
            className="text-sm font-medium"
          />
        </td>
        <td className="p-3">
          <Input
            {...itemField}
            variant="filled"
            className="text-sm"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...budgetedField}
            variant="filled"
            className="text-sm font-medium"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...actualField}
            variant="filled"
            className="text-sm font-medium"
          />
        </td>
        <td className={`p-3 font-bold text-lg ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${variance.toFixed(2)}
        </td>
        <td className="p-3">
          <input
            type="date"
            value={item.date || ''}
            onChange={(e) => updateBudgetItem(item.id, { date: e.target.value })}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 hover:border-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
          />
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
            onClick={() => deleteBudgetItem(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium transition-all"
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
        <h2 className="text-3xl font-bold text-gray-900">Budget Tracker</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium flex items-center gap-2">
            <span className={subscription ? 'text-green-600' : 'text-red-600'}>
              {subscription ? '🟢' : '🔴'}
            </span>
            <span className="text-gray-600">
              {subscription ? 'Real-time sync active' : 'Connecting...'}
            </span>
          </div>
          <Button onClick={addBudgetItem}>
            + Add Budget Item
          </Button>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl mb-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-gray-600 text-sm font-medium mb-2">Total Budget</div>
            <div className="text-3xl font-bold text-gray-900">${totalBudget.toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-gray-600 text-sm font-medium mb-2">Spent</div>
            <div className="text-3xl font-bold text-red-600">
              ${totals.actual.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-gray-600 text-sm font-medium mb-2">Remaining</div>
            <div className={`text-3xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remaining.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-gray-600 text-sm font-medium mb-2">% Used</div>
            <div className="text-3xl font-bold text-gray-900">{percentUsed}%</div>
            <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-600' : percentUsed > 70 ? 'bg-amber-500' : 'bg-green-600'}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left p-3 text-gray-700 font-semibold">Category</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Item</th>
                <th className="text-left p-3 w-32 text-gray-700 font-semibold">Budgeted</th>
                <th className="text-left p-3 w-32 text-gray-700 font-semibold">Actual</th>
                <th className="text-left p-3 w-32 text-gray-700 font-semibold">Variance</th>
                <th className="text-left p-3 w-32 text-gray-700 font-semibold">Date</th>
                <th className="text-left p-3 text-gray-700 font-semibold">Notes</th>
                <th className="text-left p-3 w-20 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {budgetItems.map((item) => (
                <BudgetRow key={item.id} item={item} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="p-3 text-gray-900" colSpan="2">Totals</td>
                <td className="p-3 text-gray-900">${totals.budgeted.toFixed(2)}</td>
                <td className="p-3 text-gray-900">${totals.actual.toFixed(2)}</td>
                <td className={`p-3 text-lg ${(totals.budgeted - totals.actual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totals.budgeted - totals.actual).toFixed(2)}
                </td>
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}