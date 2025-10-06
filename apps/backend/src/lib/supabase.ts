import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types for database tables
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
  salary: number;
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
