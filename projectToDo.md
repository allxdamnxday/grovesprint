# Memory Grove Tracker - Project TODO

This document outlines the implementation plan for the remaining features following the same patterns established in the completed tabs.

## 🎯 Implementation Priority

1. **Metrics Tab** (High Priority) - Essential for tracking launch success
2. **Marketing Tab** (High Priority) - Critical for campaign management
3. **Inventory Tab** (Medium Priority) - Important for product fulfillment
4. **Contacts Tab** (Low Priority) - Nice to have for relationship management

## 📋 Implementation Guidelines

### Pattern to Follow
Each tab implementation should follow the established pattern:

```javascript
// 1. Import required dependencies
import { useState, useEffect, useCallback } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
// ... other imports

// 2. Use the useEditableField hook for input management
function useEditableField(initialValue, onSave, type = 'text') {
  // ... (copy from existing tabs)
}

// 3. Set up real-time subscriptions with proper event handling
const channel = supabase
  .channel('table-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, 
    (payload) => {
      // Handle INSERT, UPDATE, DELETE events
    }
  )
  .subscribe()

// 4. Implement optimistic updates for better UX
// 5. Add connection status indicator
// 6. Use local state for row components
```

## 🚀 Feature Implementation Details

### 1. Metrics Tab (MetricsTab.js)

**Database Table**: `daily_metrics` (already exists)

**Features to implement**:
- Dashboard with 6 key metric cards:
  - Memory Seed Kits Sold (target: 100)
  - Total Revenue (target: $5,000)
  - Email Subscribers (target: 500)
  - Partnerships Signed (target: 1)
  - Website Conversion Rate (target: 2%)
  - Customer Acquisition Cost (target: <$50)
- Daily metrics entry table
- Charts using Recharts library
- Real-time sync for collaborative tracking

**Implementation Steps**:
```javascript
// 1. Create metric cards component
const MetricCard = ({ label, value, target, icon }) => {
  const percentage = (value / target * 100).toFixed(1)
  return (
    <div className="bg-gray-50 p-6 rounded-lg text-center">
      <div className="text-gray-600">{label}</div>
      <div className="text-3xl font-bold my-2">{value}</div>
      <div className="text-sm text-gray-500">Target: {target}</div>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div 
          className="h-2 rounded-full bg-green-600"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// 2. Add Recharts for visualization
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// 3. Implement daily metrics tracking table
// Follow the same pattern as TasksTab with useEditableField
```

### 2. Marketing Tab (MarketingTab.js)

**Database Table**: `marketing_campaigns` (needs to be created - see supabase-additional-schema.sql)

**Features to implement**:
- Social Media Content Calendar
  - Date, Platform, Content Type, Caption, Status, Engagement
  - Platforms: Instagram, Facebook, TikTok, LinkedIn
  - Content Types: Founder Story, Product Demo, Customer Story, Educational
- Paid Advertising Campaigns
  - Campaign Name, Platform, Budget, Start/End Date, Spend, Conversions
  - Calculate CPA (Cost Per Acquisition) automatically
  - ROI calculations
- Real-time sync

**Implementation Steps**:
```javascript
// 1. Create two sections: Social Media and Paid Ads
// 2. Implement calendar view for social posts
// 3. Add CPA calculation: CPA = spend / conversions
// 4. Use date-fns for date formatting
// 5. Add platform-specific icons/badges
```

### 3. Inventory Tab (InventoryTab.js)

**Database Table**: `inventory_items` (needs to be created - see supabase-additional-schema.sql)

**Features to implement**:
- Component tracking table
  - Component, Supplier, Unit Cost, Min Order, Lead Time
  - In Stock, On Order, Reorder Point, Reorder Date
- Summary cards showing:
  - Total Units, Units Sold, In Stock, Items Below Reorder Point
- Reorder alerts (visual indicators when stock <= reorder point)
- Assembly notes section (textarea for instructions)

**Implementation Steps**:
```javascript
// 1. Create inventory summary cards (similar to budget summary)
// 2. Implement reorder alert logic:
const needsReorder = item.in_stock <= item.reorder_point

// 3. Add visual indicators for low stock
// 4. Include supplier quick-add functionality
// 5. Add kit assembly notes section
```

### 4. Contacts Tab (ContactsTab.js)

**Database Table**: `contacts` (already exists)

**Features to implement**:
- Contact management table
  - Name, Organization, Role, Email, Phone, Last Contact, Notes
- San Diego resources section (static list)
- Search/filter functionality
- Import/Export capability (CSV)
- Real-time sync

**Implementation Steps**:
```javascript
// 1. Create searchable contact list
const [searchTerm, setSearchTerm] = useState('')
const filteredContacts = contacts.filter(contact => 
  contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  contact.organization.toLowerCase().includes(searchTerm.toLowerCase())
)

// 2. Add San Diego resources as a separate section
const sanDiegoResources = [
  { name: 'Tech Coast Angels', email: 'screening@techcoastangels.com' },
  // ... etc
]

// 3. Implement CSV export
const exportToCSV = () => {
  // Convert contacts to CSV format
  // Trigger download
}
```

## 📊 Additional Enhancements

### 1. Dashboard Page (pages/dashboard.js)
Create a summary dashboard that shows:
- Key metrics from all tabs
- Recent activity feed
- Quick actions
- Progress towards 30-day goals

### 2. Reports Page (pages/reports.js)
- Weekly progress reports
- Budget vs actual analysis
- Partnership pipeline visualization
- Export functionality

### 3. Settings Page (pages/settings.js)
- User profile management
- Notification preferences
- Data export/import
- Theme customization

## 🛠️ Technical Considerations

### State Management
- Continue using Supabase real-time subscriptions
- Maintain local state for inputs with `useEditableField`
- Implement optimistic updates for all CRUD operations

### Performance
- Lazy load charts (dynamic imports)
- Implement pagination for large datasets
- Use React.memo for expensive components

### Error Handling
- Add error boundaries
- Implement retry logic for failed requests
- Show user-friendly error messages

### Testing
Consider adding:
- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests

## 📅 Suggested Timeline

**Week 1**:
- Day 1-2: Implement Metrics Tab with charts
- Day 3-4: Complete Marketing Tab
- Day 5: Test and fix real-time sync

**Week 2**:
- Day 1-2: Implement Inventory Tab
- Day 3-4: Complete Contacts Tab
- Day 5: Integration testing

**Week 3**:
- Day 1-2: Create Dashboard page
- Day 3-4: Add Reports functionality
- Day 5: Final testing and deployment

## 🎨 UI/UX Improvements

1. **Loading States**: Add skeleton screens for better perceived performance
2. **Empty States**: Design helpful empty states with CTAs
3. **Mobile Responsiveness**: Ensure all tables work on mobile
4. **Keyboard Navigation**: Add keyboard shortcuts for power users
5. **Dark Mode**: Consider adding theme toggle

## 📝 Documentation Needs

1. Update README.md with new features
2. Create user guide for non-technical users
3. Document API endpoints if creating any
4. Add inline code comments for complex logic

## 🚀 Deployment Checklist

Before deploying new features:
- [ ] Run all SQL migrations
- [ ] Test real-time sync with multiple users
- [ ] Verify all environment variables
- [ ] Test on production data (backup first!)
- [ ] Update documentation
- [ ] Create release notes

---

*This roadmap follows the patterns established in the existing codebase. Each implementation should maintain consistency with the current architecture and user experience.*