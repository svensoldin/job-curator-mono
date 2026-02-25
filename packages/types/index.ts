export interface SearchTask {
  created_at: string;
  id: string;
  job_title: string;
  location: string;
  salary: string;
  skills: string;
  total_jobs: number;
  updated_at: string;
  user_id: string;
}

export interface UserCriteria {
  jobTitle: string;
  location: string;
  skills: string;
  salary: string;
}

export interface JobPost {
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
