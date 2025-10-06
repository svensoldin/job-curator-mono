// Database types for Supabase tables

export interface JobSearch {
  id: string;
  user_id: string;
  job_title: string;
  location: string;
  skills: string;
  salary: string;
  total_jobs: number;
  created_at: string;
  updated_at: string;
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

export interface JobSearchWithStats extends JobSearch {
  result_count: number;
  avg_ai_score: number | null;
  max_ai_score: number | null;
}

export interface CreateJobSearchInput {
  user_id: string;
  job_title: string;
  location: string;
  skills: string;
  salary: string;
  total_jobs: number;
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
