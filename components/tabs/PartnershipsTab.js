import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'

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

export default function PartnershipsTab() {
  const supabase = useSupabaseClient()
  const [partnerships, setPartnerships] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)

  const fetchPartnerships = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('partnerships')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPartnerships(data || [])
    } catch (error) {
      toast.error('Error fetching partnerships')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPartnerships()
    
    const channel = supabase
      .channel('partnerships-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'partnerships' 
        }, 
        (payload) => {
          console.log('Partnership change received!', payload)
          // Handle different events
          if (payload.eventType === 'INSERT') {
            setPartnerships(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPartnerships(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setPartnerships(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Partnership subscription status:', status)
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchPartnerships])

  const addPartnership = async () => {
    try {
      const { data, error } = await supabase
        .from('partnerships')
        .insert([{
          organization: 'New Organization',
          type: 'Funeral Home',
          status: 'not_contacted'
        }])
        .select()
        .single()

      if (error) throw error
      
      // Optimistically add to state
      if (data) {
        setPartnerships(prev => [data, ...prev])
      }
      
      toast.success('Partnership added!')
    } catch (error) {
      toast.error('Error adding partnership')
      console.error('Error:', error)
    }
  }

  const updatePartnership = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('partnerships')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      toast.error('Error updating partnership')
      console.error('Error:', error)
    }
  }

  const deletePartnership = async (id) => {
    try {
      const { error } = await supabase
        .from('partnerships')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Optimistically remove from state
      setPartnerships(prev => prev.filter(item => item.id !== id))
      
      toast.success('Partnership deleted')
    } catch (error) {
      toast.error('Error deleting partnership')
      console.error('Error:', error)
    }
  }

  const statusOptions = [
    { value: 'not_contacted', label: 'Not Contacted' },
    { value: 'initial_contact', label: 'Initial Contact' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'signed', label: 'Signed' },
  ]

  const typeOptions = [
    { value: 'Funeral Home', label: 'Funeral Home' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Investor', label: 'Investor' },
    { value: 'Other', label: 'Other' },
  ]

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'not_contacted': 'default',
      'initial_contact': 'info',
      'meeting_scheduled': 'warning',
      'proposal_sent': 'warning',
      'negotiating': 'info',
      'signed': 'success',
    }
    return variants[status] || 'default'
  }

  if (loading) return <div className="text-center py-8">Loading partnerships...</div>

  // Partnership row component with local state
  const PartnershipRow = ({ partnership }) => {
    const orgField = useEditableField(partnership.organization, (value) => 
      updatePartnership(partnership.id, { organization: value })
    )
    
    const contactField = useEditableField(partnership.contact_name || '', (value) => 
      updatePartnership(partnership.id, { contact_name: value })
    )
    
    const nextActionField = useEditableField(partnership.next_action || '', (value) => 
      updatePartnership(partnership.id, { next_action: value })
    )
    
    const revenueShareField = useEditableField(partnership.revenue_share || '', (value) => 
      updatePartnership(partnership.id, { revenue_share: value })
    )
    
    const notesField = useEditableField(partnership.notes || '', (value) => 
      updatePartnership(partnership.id, { notes: value })
    )

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          <Input
            {...orgField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Select
            value={partnership.type}
            onChange={(e) => updatePartnership(partnership.id, { type: e.target.value })}
            options={typeOptions}
            className="border-0 bg-transparent"
          />
        </td>
        <td className="p-3">
          <Input
            {...contactField}
            placeholder="Contact name..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Select
            value={partnership.status}
            onChange={(e) => updatePartnership(partnership.id, { status: e.target.value })}
            options={statusOptions}
            className="border-0 bg-transparent mb-1"
          />
          <Badge variant={getStatusBadgeVariant(partnership.status)}>
            {partnership.status?.replace(/_/g, ' ')}
          </Badge>
        </td>
        <td className="p-3">
          <Input
            {...nextActionField}
            placeholder="Next step..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...revenueShareField}
            placeholder="%"
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...notesField}
            placeholder="Add notes..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <button
            onClick={() => deletePartnership(partnership.id)}
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
        <h2 className="text-2xl font-bold">Partnership Pipeline</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {subscription ? '🟢 Real-time sync active' : '🔴 Connecting...'}
          </div>
          <Button onClick={addPartnership}>+ Add Partnership</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2">
              <th className="text-left p-3">Organization</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Next Action</th>
              <th className="text-left p-3">Revenue Share</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partnerships.map((partnership) => (
              <PartnershipRow key={partnership.id} partnership={partnership} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}