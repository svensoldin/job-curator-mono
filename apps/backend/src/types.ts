// Client-side user criteria (coming from job-searcher-client)
export interface UserCriteria {
  jobTitle: string;
  location: string;
  skills: string;
  salary: string;
}

export type ScrapeCriteria = Pick<UserCriteria, 'jobTitle' | 'location'>;

export interface JobPosting {
  title: string;
  company: string;
  location?: string;
  url: string;
  description: string;
  source: string;
  score?: number;
}
