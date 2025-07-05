import { useEffect, useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import toast from 'react-hot-toast'
import TasksTab from '@/components/tabs/TasksTab'
import BudgetTab from '@/components/tabs/BudgetTab'
import PartnershipsTab from '@/components/tabs/PartnershipsTab'
import MarketingTab from '@/components/tabs/MarketingTab'
import MetricsTab from '@/components/tabs/MetricsTab'
import ContactsTab from '@/components/tabs/ContactsTab'
import InventoryTab from '@/components/tabs/InventoryTab'

export default function Home() {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const [activeTab, setActiveTab] = useState('tasks')

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
          <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">🌱 Memory Grove</h1>
          <p className="text-center text-gray-600 mb-8 text-lg">30 Day Launch Tracker</p>
          <Auth
            supabaseClient={supabaseClient}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#15803d',
                    brandAccent: '#166534',
                  }
                }
              }
            }}
            providers={['google']}
            redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
          />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'tasks', label: '📋 Tasks & Timeline', component: TasksTab },
    { id: 'budget', label: '💰 Budget Tracker', component: BudgetTab },
    { id: 'partnerships', label: '🤝 Partnerships', component: PartnershipsTab },
    { id: 'marketing', label: '📱 Marketing', component: MarketingTab },
    { id: 'metrics', label: '📊 Metrics & KPIs', component: MetricsTab },
    { id: 'contacts', label: '👥 Contacts', component: ContactsTab },
    { id: 'inventory', label: '📦 Inventory', component: InventoryTab },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TasksTab

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-8 rounded-xl mb-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">🌱 Memory Grove - 30 Day Launch Tracker</h1>
              <p className="text-lg opacity-90">San Diego Launch Sprint</p>
            </div>
            <button
              onClick={() => {
                supabaseClient.auth.signOut()
                toast.success('Signed out successfully')
              }}
              className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-lg transition-all hover:shadow-lg backdrop-blur-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold whitespace-nowrap rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-green-700 shadow-lg transform scale-105 border-b-2 border-green-600'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-xl p-8 min-h-[600px] border border-gray-100">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}