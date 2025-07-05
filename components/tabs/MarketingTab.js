import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

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

export default function MarketingTab() {
  const supabase = useSupabaseClient()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [activeView, setActiveView] = useState('social') // 'social' or 'paid'

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      toast.error('Error fetching campaigns')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCampaigns()
    
    const channel = supabase
      .channel('marketing-channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'marketing_campaigns' 
        }, 
        (payload) => {
          console.log('Marketing change received!', payload)
          if (payload.eventType === 'INSERT') {
            setCampaigns(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setCampaigns(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ))
          } else if (payload.eventType === 'DELETE') {
            setCampaigns(prev => prev.filter(item => item.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('Marketing subscription status:', status)
      })

    setSubscription(channel)

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [supabase, fetchCampaigns])

  const addCampaign = async (type) => {
    try {
      const newCampaign = type === 'social' ? {
        date: new Date().toISOString().split('T')[0],
        platform: 'Instagram',
        content_type: 'Founder Story',
        caption: '',
        status: 'planned',
        campaign_type: 'social'
      } : {
        date: new Date().toISOString().split('T')[0],
        campaign_name: 'New Campaign',
        platform: 'Google Ads',
        budget: 0,
        spend: 0,
        conversions: 0,
        campaign_type: 'paid',
        status: 'planned'
      }

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert([newCampaign])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setCampaigns(prev => [data, ...prev])
      }
      
      toast.success('Campaign added!')
    } catch (error) {
      toast.error('Error adding campaign')
      console.error('Error:', error)
    }
  }

  const updateCampaign = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      toast.error('Error updating campaign')
      console.error('Error:', error)
    }
  }

  const deleteCampaign = async (id) => {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setCampaigns(prev => prev.filter(item => item.id !== id))
      
      toast.success('Campaign deleted')
    } catch (error) {
      toast.error('Error deleting campaign')
      console.error('Error:', error)
    }
  }

  const socialPlatformOptions = [
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'LinkedIn', label: 'LinkedIn' },
  ]

  const contentTypeOptions = [
    { value: 'Founder Story', label: 'Founder Story' },
    { value: 'Product Demo', label: 'Product Demo' },
    { value: 'Customer Story', label: 'Customer Story' },
    { value: 'Educational', label: 'Educational' },
  ]

  const paidPlatformOptions = [
    { value: 'Google Ads', label: 'Google Ads' },
    { value: 'Facebook Ads', label: 'Facebook Ads' },
    { value: 'Instagram Ads', label: 'Instagram Ads' },
    { value: 'TikTok Ads', label: 'TikTok Ads' },
  ]

  const statusOptions = [
    { value: 'planned', label: 'Planned' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'paused', label: 'Paused' },
  ]

  const getStatusVariant = (status) => {
    const variants = {
      'planned': 'default',
      'active': 'success',
      'completed': 'info',
      'paused': 'warning',
    }
    return variants[status] || 'default'
  }

  const getPlatformEmoji = (platform) => {
    const emojis = {
      'Instagram': '📸',
      'Facebook': '👍',
      'TikTok': '🎵',
      'LinkedIn': '👔',
      'Google Ads': '🔍',
      'Facebook Ads': '👍',
      'Instagram Ads': '📸',
      'TikTok Ads': '🎵',
    }
    return emojis[platform] || '📢'
  }

  if (loading) return <div className="text-center py-8">Loading campaigns...</div>

  // Filter campaigns by type
  const socialCampaigns = campaigns.filter(c => c.campaign_type === 'social' || (!c.campaign_type && c.content_type))
  const paidCampaigns = campaigns.filter(c => c.campaign_type === 'paid' || (!c.campaign_type && c.campaign_name))

  // Social Media Row Component
  const SocialMediaRow = ({ campaign }) => {
    const captionField = useEditableField(campaign.caption || '', (value) => 
      updateCampaign(campaign.id, { caption: value })
    )

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          <input
            type="date"
            value={campaign.date || ''}
            onChange={(e) => updateCampaign(campaign.id, { date: e.target.value })}
            className="px-2 py-1 border rounded text-sm"
          />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <span>{getPlatformEmoji(campaign.platform)}</span>
            <Select
              value={campaign.platform}
              onChange={(e) => updateCampaign(campaign.id, { platform: e.target.value })}
              options={socialPlatformOptions}
              className="border-0 bg-transparent"
            />
          </div>
        </td>
        <td className="p-3">
          <Select
            value={campaign.content_type}
            onChange={(e) => updateCampaign(campaign.id, { content_type: e.target.value })}
            options={contentTypeOptions}
            className="border-0 bg-transparent"
          />
        </td>
        <td className="p-3">
          <Input
            {...captionField}
            placeholder="Write caption..."
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Select
            value={campaign.status}
            onChange={(e) => updateCampaign(campaign.id, { status: e.target.value })}
            options={statusOptions}
            className="border-0 bg-transparent mb-1"
          />
          <Badge variant={getStatusVariant(campaign.status)}>
            {campaign.status}
          </Badge>
        </td>
        <td className="p-3">
          <button
            onClick={() => deleteCampaign(campaign.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </td>
      </tr>
    )
  }

  // Paid Ads Row Component
  const PaidAdsRow = ({ campaign }) => {
    const nameField = useEditableField(campaign.campaign_name || '', (value) => 
      updateCampaign(campaign.id, { campaign_name: value })
    )
    
    const budgetField = useEditableField(campaign.budget || 0, (value) => 
      updateCampaign(campaign.id, { budget: value }), 'number'
    )
    
    const spendField = useEditableField(campaign.spend || 0, (value) => 
      updateCampaign(campaign.id, { spend: value }), 'number'
    )
    
    const conversionsField = useEditableField(campaign.conversions || 0, (value) => 
      updateCampaign(campaign.id, { conversions: value }), 'number'
    )

    const cpa = campaign.conversions > 0 ? (campaign.spend / campaign.conversions).toFixed(2) : '-'
    const roi = campaign.spend > 0 ? (((campaign.conversions * 50 - campaign.spend) / campaign.spend) * 100).toFixed(1) : '-'

    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="p-3">
          <Input
            {...nameField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <span>{getPlatformEmoji(campaign.platform)}</span>
            <Select
              value={campaign.platform}
              onChange={(e) => updateCampaign(campaign.id, { platform: e.target.value })}
              options={paidPlatformOptions}
              className="border-0 bg-transparent"
            />
          </div>
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...budgetField}
            className="border-0 bg-transparent focus:bg-white"
          />
        </td>
        <td className="p-3">
          <Input
            type="number"
            {...spendField}
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
        <td className="p-3 font-semibold">
          ${cpa}
        </td>
        <td className={`p-3 font-semibold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {roi}%
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={campaign.start_date || ''}
              onChange={(e) => updateCampaign(campaign.id, { start_date: e.target.value })}
              className="px-1 py-0.5 border rounded text-xs"
            />
            <span>-</span>
            <input
              type="date"
              value={campaign.end_date || ''}
              onChange={(e) => updateCampaign(campaign.id, { end_date: e.target.value })}
              className="px-1 py-0.5 border rounded text-xs"
            />
          </div>
        </td>
        <td className="p-3">
          <Badge variant={getStatusVariant(campaign.status)}>
            {campaign.status}
          </Badge>
        </td>
        <td className="p-3">
          <button
            onClick={() => deleteCampaign(campaign.id)}
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
        <h2 className="text-2xl font-bold">Marketing Campaigns</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {subscription ? '🟢 Real-time sync active' : '🔴 Connecting...'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveView('social')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'social' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Social Media Content
        </button>
        <button
          onClick={() => setActiveView('paid')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeView === 'paid' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Paid Advertising
        </button>
      </div>

      {/* Social Media Content View */}
      {activeView === 'social' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Social Media Calendar</h3>
            <Button onClick={() => addCampaign('social')}>+ Add Post</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Platform</th>
                  <th className="text-left p-3">Content Type</th>
                  <th className="text-left p-3">Caption</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {socialCampaigns.map((campaign) => (
                  <SocialMediaRow key={campaign.id} campaign={campaign} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Advertising View */}
      {activeView === 'paid' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Paid Ad Campaigns</h3>
            <Button onClick={() => addCampaign('paid')}>+ Add Campaign</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3">Campaign Name</th>
                  <th className="text-left p-3">Platform</th>
                  <th className="text-left p-3">Budget</th>
                  <th className="text-left p-3">Spend</th>
                  <th className="text-left p-3">Conversions</th>
                  <th className="text-left p-3">CPA</th>
                  <th className="text-left p-3">ROI</th>
                  <th className="text-left p-3">Dates</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paidCampaigns.map((campaign) => (
                  <PaidAdsRow key={campaign.id} campaign={campaign} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> CPA (Cost Per Acquisition) = Spend ÷ Conversions | 
              ROI assumes $50 average order value
            </p>
          </div>
        </div>
      )}
    </div>
  )
}