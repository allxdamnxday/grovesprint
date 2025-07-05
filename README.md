# 🌱 Memory Grove Tracker

A comprehensive 30-day launch management system for Memory Grove - a memorial seed kit business. Built with Next.js and Supabase for real-time collaboration between business partners.

## Overview

Memory Grove Tracker helps manage the entire launch process for a memorial garden seed kit business, including:
- Task management with timeline tracking
- Budget planning and expense tracking
- Partnership pipeline management
- Marketing campaign coordination
- Metrics and KPI monitoring
- Contact management
- Inventory tracking

## Features

### ✅ Implemented (All Features Complete!)
- **Tasks & Timeline**: Week-by-week task organization with priority indicators
  - Real-time sync with visual connection status
  - Local state management for smooth typing
  - Week/day grouping structure
- **Budget Tracker**: Real-time budget vs actual tracking with variance calculations
  - $7,000 budget with visual spending progress
  - Automatic variance calculations
  - Category-based expense tracking
- **Partnerships**: Pipeline management for funeral homes, healthcare facilities, and investors
  - 6-stage pipeline tracking
  - Status badges with color coding
  - Revenue share tracking
- **Marketing Campaigns**: Complete social media and paid advertising management
  - Social media content calendar with platform-specific tracking
  - Paid ad campaigns with automatic CPA and ROI calculations
  - Multi-platform support (Instagram, Facebook, TikTok, LinkedIn, Google Ads)
- **Metrics Dashboard**: Visual KPI tracking with charts
  - 6 key metric cards with progress indicators
  - Revenue and units sold charts using Recharts
  - Daily metrics entry and tracking
  - Real-time dashboard updates
- **Contacts**: Full CRM functionality with San Diego resources
  - Searchable contact database
  - CSV export functionality
  - Curated San Diego business resources
  - Last contact tracking
- **Inventory**: Component tracking with reorder alerts
  - Visual reorder alerts when stock is low
  - Supplier and lead time management
  - Inventory value calculations
  - Assembly notes section
- **Authentication**: Secure login with Google OAuth via Supabase
- **Real-time Sync**: Instant updates between multiple users with optimistic UI updates

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Google OAuth credentials (optional, for authentication)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd memory-grove-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the initial schema (already applied if following setup instructions)
   - Run the additional schema from `supabase-additional-schema.sql`

5. Configure authentication:
   - In Supabase dashboard, go to Authentication > Providers
   - Enable Google provider (optional but recommended)

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
memory-grove-tracker/
├── pages/
│   ├── index.js          # Main app with tab navigation
│   ├── _app.js           # App wrapper with auth provider
│   └── api/              # API routes (if needed)
├── components/
│   ├── ui/               # Reusable UI components
│   └── tabs/             # Tab-specific components
├── lib/
│   └── supabase.js       # Supabase client configuration
└── styles/
    └── globals.css       # Global styles with Tailwind
```

## Database Schema

The app uses 7 main tables:
- `tasks` - Project tasks with week/day grouping
- `budget_items` - Budget tracking
- `partnerships` - Partnership pipeline
- `marketing_campaigns` - Marketing activities
- `daily_metrics` - KPI tracking
- `contacts` - Contact management
- `inventory_items` - Inventory tracking

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Netlify
- AWS Amplify
- Self-hosted with Node.js

## Usage

1. **Authentication**: Sign in with Google or email
2. **Tasks**: Organize tasks by week and day, set priorities and due dates
3. **Budget**: Track expenses against your $7,000 budget
4. **Partnerships**: Manage your partnership pipeline
5. **Real-time Sync**: All changes sync instantly between users

## Tech Stack

- **Frontend**: Next.js 15.3.5 (Pages Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel (recommended)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own projects!

## Recent Updates (v1.1.0)

### 🐛 Bug Fixes
- **Fixed Real-time Sync**: Tasks, budget items, and partnerships now sync instantly between users
- **Fixed Input Fields**: Resolved typing issues with local state management and onBlur updates
- **Added Connection Status**: Visual indicators show when real-time sync is active
- **Optimistic Updates**: UI updates immediately while database syncs in background

### 📊 Technical Improvements
- Implemented `useEditableField` custom hook for input management
- Fixed Supabase subscription event handling
- Added proper dependency arrays to useEffect hooks
- Improved error handling and user feedback

## Recent Feature Additions (v2.0.0)

### 🎉 All Features Now Complete!
- **Metrics Dashboard**: Interactive charts showing revenue trends and units sold
- **Marketing Campaigns**: Dual-view system for social media and paid advertising
- **Inventory Management**: Real-time stock tracking with visual reorder alerts
- **Contact CRM**: Full contact management with CSV export and San Diego resources

### 🚀 Application Status
✅ **All 7 tabs are now fully implemented!** The Memory Grove launch tracker is production-ready.

## Support

For issues or questions:
- Create an issue on GitHub
- Check Supabase documentation for database-related questions
- Review Next.js docs for framework questions