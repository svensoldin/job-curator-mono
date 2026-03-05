import type { HardConstraints, UserProfile } from '@repo/types';
import { supabase, type Json, SUPABASE_USER_PROFILES_TABLE, embedText } from '@repo/pipeline';

interface ProfileInput {
  hardConstraints?: HardConstraints;
  skillGraph?: Record<string, number>;
  seniority?: UserProfile['seniority'];
  culturePreference?: UserProfile['culture_preference'];
  techStackWeights?: Record<string, number>;
}

/**
 * Builds a natural-language text representation of a user's profile from the
 * structured input fields. Used as the source text for embedding generation.
 */
export function buildProfileText(input: ProfileInput): string {
  const parts: string[] = [];

  if (input.seniority) {
    parts.push(`${input.seniority} engineer`);
  }

  if (input.skillGraph && Object.keys(input.skillGraph).length > 0) {
    const skills = Object.entries(input.skillGraph)
      .map(([skill, level]) => `${skill} (${level})`)
      .join(', ');
    parts.push(`with ${skills}`);
  }

  if (input.techStackWeights && Object.keys(input.techStackWeights).length > 0) {
    const stack = Object.entries(input.techStackWeights)
      .map(([tech, weight]) => `${tech} (${weight})`)
      .join(', ');
    parts.push(`tech stack: ${stack}`);
  }

  if (input.culturePreference) {
    parts.push(`looking for a ${input.culturePreference}`);
  }

  if (input.hardConstraints) {
    const hc = input.hardConstraints;
    if (hc.location) parts.push(`located in ${hc.location}`);
    if (hc.salary_min !== undefined || hc.salary_max !== undefined) {
      const salaryParts: string[] = [];
      if (hc.salary_min !== undefined) salaryParts.push(`${hc.salary_min}k`);
      if (hc.salary_max !== undefined) salaryParts.push(`${hc.salary_max}k`);
      parts.push(`salary ${salaryParts.join('–')}`);
    }
    if (hc.remote !== undefined) {
      parts.push(hc.remote ? 'remote ok' : 'on-site preferred');
    }
  }

  return parts.join(', ') + '.';
}

/**
 * Creates or updates the profile for `userId`, generating a fresh embedding from
 * the profile text. Uses upsert on `user_id` so repeated calls are idempotent.
 */
export async function createOrUpdate(userId: string, input: ProfileInput): Promise<UserProfile> {
  const rawText = buildProfileText(input);
  const embedding = await embedText(rawText);

  const { data, error } = await supabase
    .from(SUPABASE_USER_PROFILES_TABLE)
    .upsert(
      {
        user_id: userId,
        hard_constraints: (input.hardConstraints ?? null) as Json | null,
        skill_graph: (input.skillGraph ?? null) as Json | null,
        seniority: input.seniority ?? null,
        culture_preference: input.culturePreference ?? null,
        tech_stack_weights: (input.techStackWeights ?? null) as Json | null,
        raw_profile_text: rawText,
        embedding: embedding as unknown as string,
        embedded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

/**
 * Returns the profile for the given `userId`, or null if none exists.
 */
export async function getByUserId(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(SUPABASE_USER_PROFILES_TABLE)
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

/**
 * Deletes the profile row for the given `userId`. No-op if the row doesn't exist.
 */
export async function deleteByUserId(userId: string): Promise<void> {
  const { error } = await supabase
    .from(SUPABASE_USER_PROFILES_TABLE)
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
