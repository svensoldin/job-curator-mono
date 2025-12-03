# Job Curator Backend

A backend API service that searches job boards, analyzes postings with AI, and curates relevant opportunities based on user preferences.

## What it does

This service provides REST endpoints that accept job search requests (title, location, skills, salary preferences) and returns curated job postings. It:

- Scrapes job listings from LinkedIn and Welcome to the Jungle
- Uses AI (Mistral) to analyze and score each job against user criteria
- Stores search results in Supabase for persistence
- Manages asynchronous search tasks with progress tracking

Users can start a search, check its status, and retrieve scored results once complete.

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account and project
- Mistral API key

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.template .env
   ```

   Add your credentials:

   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   MISTRAL_API_KEY=your_mistral_key
   PORT=4000
   ```

3. Run the server:
   ```bash
   pnpm dev
   ```

## API Usage

Start a job search:

```bash
POST /jobs/start
{
  "userId": "123",
  "jobTitle": "Software Engineer",
  "location": "Paris",
  "skills": "TypeScript, React",
  "salary": "60000"
}
```

Check search progress:

```bash
GET /jobs/status/:taskId
```

Get results:

```bash
GET /jobs/results/:taskId
```

## License

MIT

MIT License
