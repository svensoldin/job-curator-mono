import { Mistral } from '@mistralai/mistralai';
import type { HardConstraints, StructuredSummary } from '@repo/types';
import type { Json } from '../../lib/supabase.types.js';
import { supabase } from '../../lib/supabase.js';
import {
  SUPABASE_USER_PROFILES_TABLE,
  SUPABASE_MATCH_CACHE_TABLE,
} from '../../constants/supabase.js';
import logger from '../../utils/logger.js';

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

/**
 * Returns true if the job is a "hidden gem": high vector similarity to the
 * user's profile but low keyword overlap with the user's skill graph. This
 * surfaces jobs the user might overlook because the vocabulary differs.
 *
 * Conditions:
 *   - similarity >= 0.75
 *   - overlap < 0.30  (fraction of skillGraph keys found in summary.stack)
 */
function computeIsHiddenGem(
  similarity: number,
  skillGraph: Record<string, number> | null,
  summary: StructuredSummary | null
): boolean {
  if (!skillGraph || !summary) return false;

  const keys = Object.keys(skillGraph);
  if (keys.length === 0) return false;

  if (similarity < 0.75) return false;

  const stackLower = summary.stack.map((s) => s.toLowerCase());
  const matchedCount = keys.filter((k) => stackLower.includes(k.toLowerCase())).length;
  const overlap = matchedCount / keys.length;

  return overlap < 0.3;
}

interface LlmScoredJob {
  job_id: number;
  score: number;
  reasoning: string;
  missing_skills: string[];
  salary_alignment: string;
}

/**
 * Fetches the user's profile from `user_profiles`, ensuring the embedding is
 * present. Throws if the profile is missing or the embedding is null.
 */
async function fetchProfile(userId: string): Promise<{
  embedding: string;
  hard_constraints: Json;
  skill_graph: Json;
  raw_profile_text: string | null;
}> {
  const { data: profile, error } = await supabase
    .from(SUPABASE_USER_PROFILES_TABLE)
    .select('embedding, hard_constraints, skill_graph, raw_profile_text')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw new Error(`Profile not found for user ${userId}`);
  if (!profile.embedding)
    throw new Error(`Profile embedding is null for user ${userId} — run ProfileService first`);

  return { ...profile, embedding: profile.embedding as string };
}

/**
 * Calls the `match_jobs_for_user` RPC with location and salary filters derived
 * from the user's hard constraints. Returns `null` (instead of an empty array)
 * when no candidate jobs are found, so the caller can short-circuit cleanly.
 */
async function fetchCandidateJobs(
  userId: string,
  profile: Awaited<ReturnType<typeof fetchProfile>>
) {
  const constraints = profile.hard_constraints as HardConstraints | null;
  const locationFilter = constraints?.location;
  const salaryMin = constraints?.salary_min;

  const rpcArgs: {
    query_embedding: string;
    match_count: number;
    location_filter?: string;
    salary_min?: number;
  } = {
    // pgvector stores embeddings as strings in the Supabase JS client
    query_embedding: profile.embedding,
    match_count: 30,
  };
  if (locationFilter) rpcArgs.location_filter = locationFilter;
  if (salaryMin !== undefined) rpcArgs.salary_min = salaryMin;

  const { data: jobs, error } = await supabase.rpc('match_jobs_for_user', rpcArgs);

  if (error) throw error;
  if (!jobs || jobs.length === 0) {
    logger.info(`No matching jobs found for user ${userId}`);
    return null;
  }

  logger.info(`Found ${jobs.length} candidate jobs for user ${userId}`);
  return jobs;
}

/**
 * Sends all candidate jobs in a single batch prompt to Mistral for LLM scoring.
 * Uses structured_summary (not full description) to keep the prompt compact.
 * Throws if the response is malformed or missing the expected `results` array.
 */
async function scoreJobs(
  userId: string,
  rawProfileText: string | null,
  jobs: NonNullable<Awaited<ReturnType<typeof fetchCandidateJobs>>>
): Promise<LlmScoredJob[]> {
  const jobsForPrompt = jobs.map((j) => ({
    job_id: j.id,
    title: j.title,
    company: j.company,
    summary: j.structured_summary,
  }));

  const prompt = `Candidate: ${rawProfileText}
Jobs: ${JSON.stringify(jobsForPrompt)}
Return a JSON object with a single key "results" containing an array where each element has: job_id, score (0-100), reasoning, missing_skills (array of strings), salary_alignment (string).`;

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    responseFormat: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Malformed JSON from Mistral for user ${userId}: ${text}`);
  }

  const results = (parsed as { results?: LlmScoredJob[] }).results;
  if (!Array.isArray(results)) {
    throw new Error(`Expected { results: [...] } from Mistral, got: ${text}`);
  }

  return results;
}

/**
 * Maps LLM scores to upsert rows (computing the hidden-gem flag) and writes
 * them to `match_cache`, resolving conflicts on `(user_id, job_id)`.
 */
async function buildAndUpsertMatches(
  userId: string,
  jobs: NonNullable<Awaited<ReturnType<typeof fetchCandidateJobs>>>,
  results: LlmScoredJob[],
  skillGraph: Json
): Promise<void> {
  const upsertRows = results.map((llm) => {
    const rpcRow = jobs.find((j) => j.id === llm.job_id);
    const isHiddenGem = computeIsHiddenGem(
      rpcRow?.similarity ?? 0,
      skillGraph as Record<string, number> | null,
      (rpcRow?.structured_summary as StructuredSummary | null) ?? null
    );

    return {
      user_id: userId,
      job_id: llm.job_id,
      score: llm.score,
      reasoning: llm.reasoning,
      missing_skills: llm.missing_skills,
      salary_alignment: llm.salary_alignment,
      is_hidden_gem: isHiddenGem,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from(SUPABASE_MATCH_CACHE_TABLE)
    .upsert(upsertRows, { onConflict: 'user_id,job_id' });

  if (error) throw error;

  logger.info(`Upserted ${upsertRows.length} match_cache rows for user ${userId}`);
}

/**
 * Runs the full 3-tier matching pipeline for a single user:
 *   1. Fetches the user's profile (requires a non-null embedding).
 *   2. Calls the `match_jobs_for_user` RPC to get vector-similar jobs.
 *   3. Sends all jobs in one batch prompt to Mistral for LLM scoring.
 *   4. Upserts scored results into `match_cache`.
 */
export async function runForUser(userId: string): Promise<void> {
  const profile = await fetchProfile(userId);
  const jobs = await fetchCandidateJobs(userId, profile);
  if (!jobs) return;
  const results = await scoreJobs(userId, profile.raw_profile_text, jobs);
  await buildAndUpsertMatches(userId, jobs, results, profile.skill_graph);
}

/**
 * Runs `runForUser` for every user that has a non-null embedding, sequentially
 * to avoid Mistral rate limits. Per-user errors are logged and skipped so the
 * rest of the users still get processed.
 */
export async function runForAllUsers(): Promise<void> {
  const { data: profiles, error } = await supabase
    .from(SUPABASE_USER_PROFILES_TABLE)
    .select('user_id')
    .not('embedding', 'is', null);

  if (error) throw error;
  if (!profiles || profiles.length === 0) {
    logger.info('No profiles with embeddings found');
    return;
  }

  logger.info(`Running matching pipeline for ${profiles.length} users`);

  for (const profile of profiles) {
    try {
      logger.info(`Processing user ${profile.user_id}`);
      await runForUser(profile.user_id);
      logger.info(`Completed matching for user ${profile.user_id}`);
    } catch (err) {
      logger.error(`Failed matching for user ${profile.user_id}:`, err);
    }
  }
}

// Testing purposes only
export { computeIsHiddenGem as _computeIsHiddenGem };
