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
import MobileNav from '@/components/ui/MobileNav'

export default function Home() {
  const supabaseClient = useSupabaseClient()
  const user = useUser()
  const [activeTab, setActiveTab] = useState('tasks')

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-100">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-gray-900">🌱 Memory Grove</h1>
          <p className="text-center text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">30 Day Launch Tracker</p>
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
      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 text-white p-4 sm:p-6 lg:p-8 rounded-xl mb-4 sm:mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
                <span className="hidden sm:inline">🌱 Memory Grove - 30 Day Launch Tracker</span>
                <span className="sm:hidden">🌱 Memory Grove</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg opacity-90">San Diego Launch Sprint</p>
            </div>
            <button
              onClick={() => {
                supabaseClient.auth.signOut()
                toast.success('Signed out successfully')
              }}
              className="self-end sm:self-auto text-xs sm:text-sm bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all hover:shadow-lg backdrop-blur-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation - Desktop */}
        <div className="hidden md:flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 lg:px-6 py-2.5 lg:py-3 font-semibold whitespace-nowrap rounded-lg transition-all duration-200 text-sm lg:text-base ${
                activeTab === tab.id
                  ? 'bg-white text-green-700 shadow-lg transform scale-105 border-b-2 border-green-600'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-md'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Navigation - Mobile */}
        <MobileNav 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] border border-gray-100">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}