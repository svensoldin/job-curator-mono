# Job Curator

An AI-powered job search platform that automates the tedious process of browsing hundreds of job listings. Instead of manually scrolling through multiple job boards, users define their criteria once, and the system scrapes, analyzes, and ranks opportunities based on personalized match scores.

**Live Demo:** [View Project](https://github.com/svensoldin/job-searcher-client)

## The Problem

Job searching is exhausting. Candidates spend hours each day:

- Manually browsing multiple job boards
- Reading through irrelevant listings
- Trying to assess which roles truly match their skills
- Missing opportunities because they appear on different platforms

## The Solution

Job Curator flips the script. You tell us what you're looking for once, and our system:

1. **Scrapes** major job boards in real-time
2. **Analyzes** every listing against your specific criteria using AI
3. **Ranks** results with personalized match scores (0-100)
4. **Delivers** curated results to your dashboard

All while you focus on what matters—preparing for interviews and building your career.

## Architecture

This project demonstrates a modern, scalable full-stack architecture designed to handle asynchronous workloads efficiently.

### Tech Stack

**Frontend (This Repository)**

- **Next.js 15** - React framework with App Router for server/client components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with dark mode support
- **Supabase Client** - Real-time subscriptions and authentication

**Backend** ([job-searcher](https://github.com/svensoldin/job-searcher))

- **Express.js** - RESTful API server
- **Node.js** - Asynchronous task processing
- **Supabase** - PostgreSQL database with Row Level Security
- **Mistral AI** - Large language model for job analysis and ranking

### System Design

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Next.js   │────────▶│  Express API │────────▶│  Supabase   │
│   Client    │◀────────│   (Backend)  │◀────────│  PostgreSQL │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │                        │                         │
      │                   ┌────▼────┐               ┌───▼───┐
      │                   │ Task    │               │  RLS  │
      │                   │ Manager │               │ Auth  │
      │                   └────┬────┘               └───────┘
      │                        │
      │                   ┌────▼────┐
      └──────────────────▶│ Realtime│
         WebSocket        │ Updates │
                         └─────────┘
```

**Key Architectural Decisions:**

1. **Asynchronous Task Processing**
   - Job searches can take 5-10 minutes (scraping + AI analysis)
   - Backend uses a task queue system to prevent HTTP timeouts
   - Frontend receives instant acknowledgment with a `taskId`

2. **Real-time Updates via Supabase**
   - Replaced traditional polling with WebSocket subscriptions

3. **Backend-Owned Business Logic**
   - All database writes happen server-side (security & data integrity)
   - Service role key bypasses RLS for administrative operations
   - Client uses anon key with RLS for user-specific data access

4. **Type-Safe Contract**
   - Shared TypeScript interfaces between frontend and backend
   - API responses are strongly typed

## Features

### For Users

- **Smart Criteria Collection** - Multi-step wizard for defining job preferences
- **Async Search Processing** - Start search and check back later
- **Real-time Dashboard** - Live updates when searches complete
- **AI Match Scores** - Each job ranked 0-100 based on your profile
- **Dark Mode** - Full theme support for comfortable browsing
- **Authentication** - Secure login with Supabase Auth, featuring Github OAuth

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account
- Access to backend API ([job-searcher](https://github.com/svensoldin/job-searcher))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/svensoldin/job-searcher-client.git
   cd job-searcher-client
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_JOB_SCRAPER_URL=http://localhost:4000
   ```

4. **Run development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Backend Setup

This frontend requires the backend API to function. See [job-searcher](https://github.com/svensoldin/job-searcher) for setup instructions.

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # User dashboard with search results
│   │   └── components/     # PendingTasks, SearchResults, etc.
│   ├── search/             # Multi-step search wizard
│   │   └── api/           # Backend proxy API route
│   ├── login/             # Authentication pages
│   ├── layout.tsx         # Root layout with theme
│   └── page.tsx           # Landing page
├── lib/
│   ├── supabase/          # Supabase client configuration
│   └── db.ts              # Database utilities
├── types/
│   ├── api.ts             # API response types
│   └── database.ts        # Database schema types
└── routes.ts              # Route constants
```

## Future Enhancements

- **Redis store** - Use in-memory store for the task manager service
- **Application Tracking** - Track which jobs you've applied to
- **Resume Parsing** - Auto-fill criteria from uploaded resume
- **Job Board Expansion** - Support for more platforms

## Contributing

This is a portfolio project, but feedback and suggestions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use this project as reference for your own work.

## Author

**Sven Soldin**

- GitHub: [@svensoldin](https://github.com/svensoldin)
