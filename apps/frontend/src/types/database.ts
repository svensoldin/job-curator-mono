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
