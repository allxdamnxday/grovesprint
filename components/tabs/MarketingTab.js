import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/useMediaQuery'

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
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const isMobile = useIsMobile()

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

  // Mobile Card Components - Cleaner Design
  const SocialMediaCard = ({ campaign }) => {
    const handleEdit = () => {
      setEditingCampaign(campaign)
      setIsModalOpen(true)
    }
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        {/* Header with Platform and Status */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPlatformEmoji(campaign.platform)}</span>
            <span className="font-medium text-gray-900">{campaign.platform}</span>
          </div>
          <Badge variant={getStatusVariant(campaign.status)} size="sm">
            {campaign.status}
          </Badge>
        </div>
        
        {/* Date - Muted */}
        <div className="text-sm text-gray-500 mb-3">
          {campaign.date ? format(new Date(campaign.date), 'MMMM d, yyyy') : 'No date set'}
        </div>
        
        {/* Content Type - Bold */}
        <div className="font-semibold text-gray-900 mb-3">
          {campaign.content_type}
        </div>
        
        {/* Caption Preview - 2 lines max */}
        {campaign.caption && (
          <div className="text-sm text-gray-700 mb-4 line-clamp-2">
            &ldquo;{campaign.caption}&rdquo;
          </div>
        )}
        
        {/* Single Primary Action */}
        <button
          onClick={handleEdit}
          className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
      </div>
    )
  }

  const PaidAdsCard = ({ campaign }) => {
    const cpa = campaign.conversions > 0 ? (campaign.spend / campaign.conversions).toFixed(2) : '-'
    const roi = campaign.spend > 0 ? (((campaign.conversions * 50 - campaign.spend) / campaign.spend) * 100).toFixed(1) : '-'
    const spendPercentage = campaign.budget > 0 ? Math.min((campaign.spend / campaign.budget) * 100, 100) : 0
    
    const handleEdit = () => {
      setEditingCampaign(campaign)
      setIsModalOpen(true)
    }
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        {/* Header with Platform and Status */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getPlatformEmoji(campaign.platform)}</span>
            <span className="font-medium text-gray-900">{campaign.platform}</span>
          </div>
          <Badge variant={getStatusVariant(campaign.status)} size="sm">
            {campaign.status}
          </Badge>
        </div>
        
        {/* Campaign Name - Bold and Prominent */}
        <div className="font-semibold text-lg text-gray-900 mb-4">
          {campaign.campaign_name || 'Untitled Campaign'}
        </div>
        
        {/* Budget Progress - Visual */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Budget</span>
            <span className="font-medium">${campaign.budget || 0}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Spent</span>
            <span className="font-medium">${campaign.spend || 0} ({spendPercentage.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${spendPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Key Metric - ROI Highlighted */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="text-sm text-gray-600 mb-1">Return on Investment</div>
          <div className={`text-2xl font-bold flex items-center gap-2 ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {roi}%
            {roi > 0 && <span className="text-lg">📈</span>}
          </div>
        </div>
        
        {/* Single Primary Action */}
        <button
          onClick={handleEdit}
          className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Performance
        </button>
      </div>
    )
  }

  // Edit Form Components for Modal
  const SocialMediaEditForm = ({ campaign }) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={campaign.date || ''}
            onChange={(e) => updateCampaign(campaign.id, { date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <Select
            value={campaign.platform}
            onChange={(e) => updateCampaign(campaign.id, { platform: e.target.value })}
            options={socialPlatformOptions}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
          <Select
            value={campaign.content_type}
            onChange={(e) => updateCampaign(campaign.id, { content_type: e.target.value })}
            options={contentTypeOptions}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
          <textarea
            value={campaign.caption || ''}
            onChange={(e) => updateCampaign(campaign.id, { caption: e.target.value })}
            placeholder="Write your social media caption..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="4"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            value={campaign.status}
            onChange={(e) => updateCampaign(campaign.id, { status: e.target.value })}
            options={statusOptions}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              deleteCampaign(campaign.id)
              setIsModalOpen(false)
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            Delete Post
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

  const PaidAdsEditForm = ({ campaign }) => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input
            type="text"
            value={campaign.campaign_name || ''}
            onChange={(e) => updateCampaign(campaign.id, { campaign_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter campaign name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <Select
            value={campaign.platform}
            onChange={(e) => updateCampaign(campaign.id, { platform: e.target.value })}
            options={paidPlatformOptions}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input
              type="number"
              value={campaign.budget || ''}
              onChange={(e) => updateCampaign(campaign.id, { budget: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Spend</label>
            <input
              type="number"
              value={campaign.spend || ''}
              onChange={(e) => updateCampaign(campaign.id, { spend: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conversions</label>
            <input
              type="number"
              value={campaign.conversions || ''}
              onChange={(e) => updateCampaign(campaign.id, { conversions: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={campaign.start_date || ''}
              onChange={(e) => updateCampaign(campaign.id, { start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <input
              type="date"
              value={campaign.end_date || ''}
              onChange={(e) => updateCampaign(campaign.id, { end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select
            value={campaign.status}
            onChange={(e) => updateCampaign(campaign.id, { status: e.target.value })}
            options={statusOptions}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => {
              deleteCampaign(campaign.id)
              setIsModalOpen(false)
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            Delete Campaign
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
      <div className="flex gap-2 md:gap-4 mb-6">
        <button
          onClick={() => setActiveView('social')}
          className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg font-medium transition-all ${
            activeView === 'social' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isMobile ? "Social" : "Social Media Content"}
        </button>
        <button
          onClick={() => setActiveView('paid')}
          className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg font-medium transition-all ${
            activeView === 'paid' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isMobile ? "Paid Ads" : "Paid Advertising"}
        </button>
      </div>

      {/* Social Media Content View */}
      {activeView === 'social' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Social Media Calendar</h3>
            {!isMobile && (
              <Button size="md" onClick={() => addCampaign('social')}>
                + Add Post
              </Button>
            )}
          </div>
          
          {/* Mobile View */}
          {isMobile ? (
            <div className="space-y-3">
              {socialCampaigns.map((campaign) => (
                <SocialMediaCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            /* Desktop View */
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
          )}
        </div>
      )}

      {/* Paid Advertising View */}
      {activeView === 'paid' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Paid Ad Campaigns</h3>
            {!isMobile && (
              <Button size="md" onClick={() => addCampaign('paid')}>
                + Add Campaign
              </Button>
            )}
          </div>
          
          {/* Mobile View */}
          {isMobile ? (
            <div className="space-y-3">
              {paidCampaigns.map((campaign) => (
                <PaidAdsCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            /* Desktop View */
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
          )}
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> CPA (Cost Per Acquisition) = Spend ÷ Conversions | 
              ROI assumes $50 average order value
            </p>
          </div>
        </div>
      )}
      
      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => addCampaign(activeView)}
            className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all hover:shadow-xl flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCampaign(null)
        }}
        title={editingCampaign?.campaign_type === 'paid' || editingCampaign?.campaign_name ? 'Edit Campaign' : 'Edit Social Post'}
      >
        {editingCampaign && (
          editingCampaign.campaign_type === 'paid' || editingCampaign.campaign_name ? (
            <PaidAdsEditForm campaign={editingCampaign} />
          ) : (
            <SocialMediaEditForm campaign={editingCampaign} />
          )
        )}
      </Modal>
    </div>
  )
}