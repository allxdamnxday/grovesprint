import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

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

export default function InventoryTab() {
  const supabase = useSupabaseClient()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [assemblyNotes, setAssemblyNotes] = useState('')

  const fetchInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('component', { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      toast.error('Error fetching inventory')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchInventory()
    
    const channel = supabase
      .channel('inventory-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'inventory_items' 
        }, 
        (payload) => {
          console.log('Inventory change received!', payload)
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Inventory subscription status:', status)
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchInventory])

  const addInventoryItem = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          component: 'New Component',
          supplier: '',
          unit_cost: 0,
          min_order_quantity: 1,
          lead_time: '',
          in_stock: 0,
          on_order: 0,
          reorder_point: 25
        }])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setInventory(prev => [...prev, data])
      }
      
      toast.success('Inventory item added!')
    } catch (error) {
      toast.error('Error adding inventory item')
      console.error('Error:', error)
    }
  }

  const updateInventoryItem = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      toast.error('Error updating inventory item')
      console.error('Error:', error)
    }
  }

  const deleteInventoryItem = async (id) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setInventory(prev => prev.filter(item => item.id !== id))
      
      toast.success('Inventory item deleted')
    } catch (error) {
      toast.error('Error deleting inventory item')
      console.error('Error:', error)
    }
  }

  // Calculate summary statistics
  const summary = inventory.reduce((acc, item) => {
    const totalValue = item.in_stock * (item.unit_cost || 0)
    acc.totalUnits += item.in_stock
    acc.totalValue += totalValue
    acc.onOrder += item.on_order
    if (item.in_stock <= item.reorder_point) {
      acc.belowReorder++
    }
    return acc
  }, { totalUnits: 0, totalValue: 0, onOrder: 0, belowReorder: 0 })

  if (loading) return <div className="text-center py-8">Loading inventory...</div>

  // Inventory row component
  const InventoryRow = ({ item }) => {
    const componentField = useEditableField(item.component, (value) => 
      updateInventoryItem(item.id, { component: value })
    )
    
    const supplierField = useEditableField(item.supplier || '', (value) => 
      updateInventoryItem(item.id, { supplier: value })
    )
    
    const unitCostField = useEditableField(item.unit_cost || 0, (value) => 
      updateInventoryItem(item.id, { unit_cost: value }), 'number'
    )
    
    const minOrderField = useEditableField(item.min_order_quantity || 1, (value) => 
      updateInventoryItem(item.id, { min_order_quantity: value }), 'number'
    )
    
    const leadTimeField = useEditableField(item.lead_time || '', (value) => 
      updateInventoryItem(item.id, { lead_time: value })
    )
    
    const inStockField = useEditableField(item.in_stock || 0, (value) => 
      updateInventoryItem(item.id, { in_stock: value }), 'number'
    )
    
    const onOrderField = useEditableField(item.on_order || 0, (value) => 
      updateInventoryItem(item.id, { on_order: value }), 'number'
    )
    
    const reorderPointField = useEditableField(item.reorder_point || 25, (value) => 
      updateInventoryItem(item.id, { reorder_point: value }), 'number'
    )

    const needsReorder = item.in_stock <= item.reorder_point

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          <div className="flex items-center gap-2">
            <Input
              {...componentField}
              className="border-0 bg-transparent focus:bg-white"
            />
            {needsReorder && (
              <Badge variant="danger">
                Low Stock!
              </Badge>
            )}
          </div>
        </td>
        <td className="p-3">
          <Input
            {...supplierField}
            placeholder="Supplier name..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...unitCostField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...minOrderField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...leadTimeField}
            placeholder="e.g., 2 weeks"
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...inStockField}
            className={`border-0 bg-transparent focus:bg-white ${needsReorder ? 'text-red-600 font-semibold' : ''}`}
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...onOrderField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...reorderPointField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <input
            type="date"
            value={item.reorder_date || ''}
            onChange={(e) => updateInventoryItem(item.id, { reorder_date: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          />
        </td>
        <td className="p-3">
          <button
            onClick={() => deleteInventoryItem(item.id)}
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
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {subscription ? '🟢 Real-time sync active' : '🔴 Connecting...'}
          </div>
          <Button onClick={addInventoryItem}>+ Add Component</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-gray-600">Total Units</div>
          <div className="text-2xl font-bold">{summary.totalUnits}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-gray-600">Inventory Value</div>
          <div className="text-2xl font-bold">${summary.totalValue.toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-gray-600">On Order</div>
          <div className="text-2xl font-bold">{summary.onOrder}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-gray-600">Below Reorder</div>
          <div className={`text-2xl font-bold ${summary.belowReorder > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {summary.belowReorder}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2">
              <th className="text-left p-3">Component</th>
              <th className="text-left p-3">Supplier</th>
              <th className="text-left p-3">Unit Cost</th>
              <th className="text-left p-3">Min Order</th>
              <th className="text-left p-3">Lead Time</th>
              <th className="text-left p-3">In Stock</th>
              <th className="text-left p-3">On Order</th>
              <th className="text-left p-3">Reorder Point</th>
              <th className="text-left p-3">Reorder Date</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <InventoryRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Assembly Notes */}
      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Assembly Notes</h3>
        <textarea
          value={assemblyNotes}
          onChange={(e) => setAssemblyNotes(e.target.value)}
          placeholder="Add notes about kit assembly process, special instructions, etc..."
          className="w-full h-32 p-3 border rounded-lg resize-none"
        />
        <div className="mt-3 text-sm text-gray-600">
          <strong>Standard Kit Contents:</strong> 1 Certificate, 1 Seed Packet, 1 Gift Box, 1 QR Code Sticker
        </div>
      </div>
    </div>
  )
}