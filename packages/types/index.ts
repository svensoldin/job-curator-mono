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
