import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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

export default function ContactsTab() {
  const supabase = useSupabaseClient()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState('contacts') // 'contacts' or 'resources'

  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      toast.error('Error fetching contacts')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchContacts()
    
    const channel = supabase
      .channel('contacts-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'contacts' 
        }, 
        (payload) => {
          console.log('Contact change received!', payload)
          if (payload.eventType === 'INSERT') {
            setContacts(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setContacts(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setContacts(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Contacts subscription status:', status)
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchContacts])

  const addContact = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          name: 'New Contact',
          organization: '',
          role: '',
          email: '',
          phone: '',
          last_contact: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setContacts(prev => [...prev, data])
      }
      
      toast.success('Contact added!')
    } catch (error) {
      toast.error('Error adding contact')
      console.error('Error:', error)
    }
  }

  const updateContact = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      toast.error('Error updating contact')
      console.error('Error:', error)
    }
  }

  const deleteContact = async (id) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setContacts(prev => prev.filter(item => item.id !== id))
      
      toast.success('Contact deleted')
    } catch (error) {
      toast.error('Error deleting contact')
      console.error('Error:', error)
    }
  }

  // San Diego resources (static data)
  const sanDiegoResources = [
    { name: 'Tech Coast Angels', organization: 'Angel Investor Group', email: 'screening@techcoastangels.com', phone: '(858) 964-1300' },
    { name: 'SCORE San Diego', organization: 'Small Business Mentorship', email: 'info@sandiego.score.org', phone: '(619) 557-7272' },
    { name: 'CONNECT', organization: 'Innovation Network', email: 'info@connect.org', phone: '(858) 964-1300' },
    { name: 'San Diego Regional EDC', organization: 'Economic Development', email: 'info@sandiegobusiness.org', phone: '(619) 234-8484' },
    { name: 'Biocom California', organization: 'Life Science Association', email: 'info@biocom.org', phone: '(858) 455-0300' },
    { name: 'SD Startup Week', organization: 'Annual Event', email: 'team@sandiegostartupweek.com', phone: '' },
    { name: 'EvoNexus', organization: 'Incubator', email: 'info@evonexus.org', phone: '(858) 866-7500' },
    { name: 'Qualcomm Ventures', organization: 'Corporate VC', email: 'ventures@qualcomm.com', phone: '' },
  ]

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Name', 'Organization', 'Role', 'Email', 'Phone', 'Last Contact', 'Notes']
    const csvContent = [
      headers.join(','),
      ...filteredContacts.map(contact => [
        contact.name || '',
        contact.organization || '',
        contact.role || '',
        contact.email || '',
        contact.phone || '',
        contact.last_contact || '',
        (contact.notes || '').replace(/,/g, ';')
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('Contacts exported!')
  }

  if (loading) return <div className="text-center py-8">Loading contacts...</div>

  // Contact row component
  const ContactRow = ({ contact }) => {
    const nameField = useEditableField(contact.name, (value) => 
      updateContact(contact.id, { name: value })
    )
    
    const organizationField = useEditableField(contact.organization || '', (value) => 
      updateContact(contact.id, { organization: value })
    )
    
    const roleField = useEditableField(contact.role || '', (value) => 
      updateContact(contact.id, { role: value })
    )
    
    const emailField = useEditableField(contact.email || '', (value) => 
      updateContact(contact.id, { email: value })
    )
    
    const phoneField = useEditableField(contact.phone || '', (value) => 
      updateContact(contact.id, { phone: value })
    )
    
    const notesField = useEditableField(contact.notes || '', (value) => 
      updateContact(contact.id, { notes: value })
    )

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          <Input
            {...nameField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...organizationField}
            placeholder="Organization..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...roleField}
            placeholder="Role..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...emailField}
            type="email"
            placeholder="email@example.com"
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            {...phoneField}
            placeholder="(555) 123-4567"
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <input
            type="date"
            value={contact.last_contact || ''}
            onChange={(e) => updateContact(contact.id, { last_contact: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
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
            onClick={() => deleteContact(contact.id)}
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
        <h2 className="text-2xl font-bold">Contacts</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {subscription ? '🟢 Real-time sync active' : '🔴 Connecting...'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveView('contacts')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'contacts' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          My Contacts ({filteredContacts.length})
        </button>
        <button
          onClick={() => setActiveView('resources')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'resources' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          San Diego Resources
        </button>
      </div>

      {/* Contacts View */}
      {activeView === 'contacts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Badge variant="default">{filteredContacts.length} contacts</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportToCSV}>Export CSV</Button>
              <Button onClick={addContact}>+ Add Contact</Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Organization</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Last Contact</th>
                  <th className="text-left p-3">Notes</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* San Diego Resources View */}
      {activeView === 'resources' && (
        <div>
          <div className="mb-4">
            <p className="text-gray-600">Key San Diego resources for your memorial garden business launch:</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sanDiegoResources.map((resource, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-lg">{resource.name}</h4>
                <p className="text-gray-600">{resource.organization}</p>
                {resource.email && (
                  <p className="mt-2">
                    <span className="text-gray-500">Email:</span>{' '}
                    <a href={`mailto:${resource.email}`} className="text-blue-600 hover:underline">
                      {resource.email}
                    </a>
                  </p>
                )}
                {resource.phone && (
                  <p>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <a href={`tel:${resource.phone}`} className="text-blue-600 hover:underline">
                      {resource.phone}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}