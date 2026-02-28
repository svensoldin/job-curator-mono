import type { ScrapeCriteria } from '../types.js';

export const SCRAPE_TARGETS: ScrapeCriteria[] = [
  { jobTitle: 'Software Engineer' },
  { jobTitle: 'Frontend Developer' },
  { jobTitle: 'Backend Developer' },
  { jobTitle: 'Fullstack Developer' },
  { jobTitle: 'React Developer' },
];

export const MAX_JOBS_PER_BOARD = 50;
export const MAX_PAGES_PER_BOARD = 2;
export const MAX_JOBS = 100;
export const DELAY_BETWEEN_REQUESTS = 1000;
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
