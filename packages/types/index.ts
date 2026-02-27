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

export interface HardConstraints {
  location?: string;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  plan: 'free' | 'premium';
  hard_constraints: HardConstraints | null;
  skill_graph: Record<string, number> | null; // e.g. { "React": 5, "Node": 3 }
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | null;
  culture_preference: 'startup' | 'scale-up' | 'big_corp' | null;
  tech_stack_weights: Record<string, number> | null;
  raw_profile_text: string | null;
  embedded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StructuredSummary {
  stack: string[];
  seniority: string;
  culture: string;
  responsibilities: string;
  salary: string;
}

export interface MatchResult {
  id: string;
  user_id: string;
  job_id: number;
  score: number | null;
  reasoning: string | null;
  missing_skills: string[] | null;
  salary_alignment: string | null;
  is_hidden_gem: boolean;
  cached_at: string;
}

export interface MatchWithJob extends MatchResult {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    url: string;
    source: string;
    structured_summary: StructuredSummary | null;
  };
}
