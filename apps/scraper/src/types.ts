// Client-side user criteria (coming from job-searcher-client)
export interface UserCriteria {
  jobTitle: string;
  location: string;
  skills: string;
  salary: string;
}

export type ScrapeCriteria = { jobTitle: string };

export interface JobPosting {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  score?: number;
}
