# TalentSync

TalentSync is a modern applicant tracking system (ATS) designed to help companies streamline their recruitment process. It provides a centralized dashboard for managing candidates, tracking application stages, and integrating with external tools like HubSpot.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16.14 or later)
- npm (comes with Node.js)
- A Supabase account and project

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clear-match.git
cd clear-match
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🛠 Technology Stack

- **Frontend Framework**: Next.js 13.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components using Radix UI primitives
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Hooks
- **Form Handling**: React Hook Form
- **API Integration**: REST APIs with Next.js API routes

## 🎯 Features

### Implemented Features

#### Authentication
- ✅ User registration with email/password
- ✅ Login functionality
- ✅ Protected routes with middleware
- ✅ Session management

#### Dashboard
- ✅ Overview statistics (total candidates, pending actions, etc.)
- ✅ Candidate pipeline visualization
- ✅ Recent activity feed
- ✅ Skills distribution chart

#### UI/UX
- ✅ Responsive design
- ✅ Dark/light mode support
- ✅ Toast notifications
- ✅ Loading states and skeletons

### In Progress

#### HubSpot Integration
- ⏳ Contact synchronization
- ⏳ Edge function implementation
- ⏳ API credentials setup

#### Candidate Management
- ⏳ Detailed candidate profiles
- ⏳ Application stage tracking
- ⏳ Interview scheduling
- ⏳ Document management

#### Analytics
- ⏳ Advanced reporting
- ⏳ Custom dashboards
- ⏳ Data export

## 🔄 Current Status

The application is in active development with core features implemented and working:

- **Working Features**:
  - User authentication flow
  - Basic dashboard visualization
  - Protected route middleware
  - Responsive UI components

- **Needs Configuration**:
  - Supabase connection (requires environment variables)
  - HubSpot integration (requires API setup)

- **Under Development**:
  - Advanced candidate management features
  - Integration with external services
  - Analytics and reporting
  - Email notifications
