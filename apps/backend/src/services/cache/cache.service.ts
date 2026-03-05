import type { MatchWithJob } from '@repo/types';
import { supabase, SUPABASE_MATCH_CACHE_TABLE } from '@repo/pipeline';

export interface GetMatchesOptions {
  limit?: number;
  minScore?: number;
  hiddenGemsOnly?: boolean;
}

/**
 * Returns cached match results for a user, joined with the scraped job data.
 * Results are ordered by score descending. Supports optional filtering by
 * minimum score, hidden gem flag, and result limit.
 */
export async function getMatchesForUser(
  userId: string,
  options: GetMatchesOptions = {}
): Promise<MatchWithJob[]> {
  let query = supabase
    .from(SUPABASE_MATCH_CACHE_TABLE)
    .select('*, scraped_jobs(id,title,company,location,url,source,structured_summary)')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  if (options.minScore !== undefined) {
    query = query.gte('score', options.minScore);
  }

  if (options.hiddenGemsOnly) {
    query = query.eq('is_hidden_gem', true);
  }

  const { data, error } = await query.limit(options.limit ?? 50);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const { scraped_jobs, ...matchFields } = row as typeof row & {
      scraped_jobs: MatchWithJob['job'];
    };
    return { ...matchFields, job: scraped_jobs } as MatchWithJob;
  });
}

/**
 * Returns the full match detail for a single (user, job) pair, or null if no
 * cached result exists.
 */
export async function getMatchDetail(userId: string, jobId: number): Promise<MatchWithJob | null> {
  const { data, error } = await supabase
    .from(SUPABASE_MATCH_CACHE_TABLE)
    .select('*, scraped_jobs(id,title,company,location,url,source,structured_summary)')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { scraped_jobs, ...matchFields } = data as typeof data & {
    scraped_jobs: MatchWithJob['job'];
  };
  return { ...matchFields, job: scraped_jobs } as MatchWithJob;
}
