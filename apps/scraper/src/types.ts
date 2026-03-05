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
