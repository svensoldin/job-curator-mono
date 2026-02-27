// Re-export the shared Supabase client from @repo/pipeline
export { supabase } from '@repo/pipeline';

export interface JobSearch {
  id: string;
  user_id: string;
  job_title: string;
  location: string;
  skills: string;
  salary: number;
  total_jobs: number;
  created_at: string;
}

export interface JobResult {
  id: string;
  search_id: string;
  title: string;
  company: string;
  description: string | null;
  url: string;
  source: string;
  ai_score: number | null;
  created_at: string;
}

export interface CreateJobSearchInput {
  user_id: string;
  job_title: string;
  location: string;
  skills: string;
  salary: string;
}

export interface CreateJobResultInput {
  search_id: string;
  title: string;
  company: string;
  description: string | null;
  url: string;
  source: string;
  ai_score: number | null;
}
