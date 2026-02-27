import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockMaybeSingle,
  mockRpc,
  mockUpsert,
  mockProfilesSelect,
  mockChatComplete,
  fixtureProfile,
  fixtureRpcJobs,
  fixtureLlmResponse,
} = vi.hoisted(() => {
  const fixtureProfile = {
    embedding: Array(1024).fill(0.1),
    hard_constraints: { location: 'Paris', salary_min: 50000 },
    skill_graph: { React: 5, 'Node.js': 3 },
    raw_profile_text: 'Senior frontend engineer with React and Node.js',
  };

  // RPC returns `id` (not `job_id`) — matches the Supabase function return type
  const fixtureRpcJobs = [
    {
      id: 1,
      title: 'Frontend Engineer',
      company: 'Acme',
      description: '',
      location: 'Paris',
      url: 'https://example.com/1',
      source: 'linkedin',
      similarity: 0.82,
      structured_summary: { stack: ['Vue', 'Python'], seniority: 'senior', culture: 'startup', responsibilities: '...', salary: '60k' },
    },
    {
      id: 2,
      title: 'React Developer',
      company: 'Beta',
      description: '',
      location: 'Paris',
      url: 'https://example.com/2',
      source: 'wttj',
      similarity: 0.76,
      structured_summary: { stack: ['React', 'Node.js'], seniority: 'mid', culture: 'scale-up', responsibilities: '...', salary: '55k' },
    },
  ];

  const fixtureLlmResponse = {
    results: [
      { job_id: 1, score: 85, reasoning: 'Good match', missing_skills: ['Python'], salary_alignment: 'ok' },
      { job_id: 2, score: 72, reasoning: 'Decent match', missing_skills: [], salary_alignment: 'low' },
    ],
  };

  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: fixtureProfile, error: null });
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });

  // Profile select chain: .select().eq().maybeSingle()
  const mockProfilesSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
    not: vi.fn().mockResolvedValue({ data: [{ user_id: 'user-1' }, { user_id: 'user-2' }], error: null }),
  });

  const mockRpc = vi.fn().mockResolvedValue({ data: fixtureRpcJobs, error: null });

  const mockChatComplete = vi.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(fixtureLlmResponse) } }],
  });

  return {
    mockMaybeSingle,
    mockRpc,
    mockUpsert,
    mockProfilesSelect,
    mockChatComplete,
    fixtureProfile,
    fixtureRpcJobs,
    fixtureLlmResponse,
  };
});

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return { select: mockProfilesSelect };
      }
      // match_cache
      return { upsert: mockUpsert };
    }),
    rpc: mockRpc,
  },
}));

vi.mock('@mistralai/mistralai', () => ({
  // Must use a regular function (not arrow) so `new Mistral()` works
  Mistral: vi.fn(function () {
    return { chat: { complete: mockChatComplete } };
  }),
}));

import { runForUser, runForAllUsers, _computeIsHiddenGem } from './matching.pipeline.js';
import { supabase } from '../../lib/supabase.js';

describe('computeIsHiddenGem', () => {
  const summary = { stack: ['Vue', 'Python'], seniority: 'senior', culture: 'startup', responsibilities: '...', salary: '60k' };
  const skillGraph = { React: 5, 'Node.js': 3, TypeScript: 4 }; // 3 keys, none in stack → 0% overlap

  it('returns false when similarity < 0.75', () => {
    expect(_computeIsHiddenGem(0.74, skillGraph, summary)).toBe(false);
  });

  it('returns true when similarity >= 0.75 and overlap is 0%', () => {
    expect(_computeIsHiddenGem(0.75, skillGraph, summary)).toBe(true);
  });

  it('returns true when similarity >= 0.75 and overlap is 29%', () => {
    // 1 of 4 keys matches → 25% overlap
    const sg = { React: 5, 'Node.js': 3, TypeScript: 4, Angular: 2 };
    const s = { ...summary, stack: ['React'] }; // 1/4 = 25%
    expect(_computeIsHiddenGem(0.80, sg, s)).toBe(true);
  });

  it('returns false when similarity >= 0.75 but overlap is exactly 30%', () => {
    // 3 of 10 keys match → 30% overlap
    const keys = Array.from({ length: 10 }, (_, i) => `Skill${i}`);
    const sg = Object.fromEntries(keys.map((k) => [k, 1]));
    const s = { ...summary, stack: ['Skill0', 'Skill1', 'Skill2'] }; // 3/10 = 30%
    expect(_computeIsHiddenGem(0.80, sg, s)).toBe(false);
  });

  it('returns false when skillGraph is null', () => {
    expect(_computeIsHiddenGem(0.80, null, summary)).toBe(false);
  });

  it('returns false when summary is null', () => {
    expect(_computeIsHiddenGem(0.80, skillGraph, null)).toBe(false);
  });
});

describe('runForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle.mockResolvedValue({ data: fixtureProfile, error: null });
    mockRpc.mockResolvedValue({ data: fixtureRpcJobs, error: null });
    mockChatComplete.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(fixtureLlmResponse) } }],
    });
    mockUpsert.mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return { select: mockProfilesSelect } as unknown as ReturnType<typeof supabase.from>;
      }
      return { upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>;
    });
  });

  it('calls RPC with the profile embedding and hard_constraints filters', async () => {
    await runForUser('user-1');

    expect(mockRpc).toHaveBeenCalledWith('match_jobs_for_user', {
      query_embedding: fixtureProfile.embedding,
      location_filter: 'Paris',
      salary_min: 50000,
      match_count: 30,
    });
  });

  it('upserts match_cache rows with correct user_id, job_id, and score', async () => {
    await runForUser('user-1');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: 'user-1', job_id: 1, score: 85 }),
        expect.objectContaining({ user_id: 'user-1', job_id: 2, score: 72 }),
      ]),
      { onConflict: 'user_id,job_id' }
    );
  });

  it('sets is_hidden_gem=true for job 1 (high similarity, low overlap) and false for job 2 (React in stack)', async () => {
    await runForUser('user-1');

    const upsertArg: Array<{ job_id: number; is_hidden_gem: boolean }> = mockUpsert.mock.calls[0][0];
    const job1 = upsertArg.find((r) => r.job_id === 1);
    const job2 = upsertArg.find((r) => r.job_id === 2);

    // job1: similarity=0.82, stack=['Vue','Python'], skillGraph keys: React/Node.js → 0% overlap → hidden gem
    expect(job1?.is_hidden_gem).toBe(true);
    // job2: similarity=0.76, stack=['React','Node.js'] → 2/2 keys match = 100% overlap → not hidden gem
    expect(job2?.is_hidden_gem).toBe(false);
  });

  it('throws when profile embedding is null', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { ...fixtureProfile, embedding: null },
      error: null,
    });

    await expect(runForUser('user-1')).rejects.toThrow('embedding is null');
  });
});

describe('runForAllUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls runForUser for each profile and continues on per-user error', async () => {
    const profiles = [{ user_id: 'user-1' }, { user_id: 'user-2' }];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: profiles, error: null }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({ data: fixtureProfile, error: null })
                .mockResolvedValueOnce({ data: fixtureProfile, error: null }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return { upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>;
    });

    mockRpc.mockResolvedValue({ data: [], error: null });

    // Should resolve even though user-1 and user-2 both return empty jobs (no upsert needed)
    await expect(runForAllUsers()).resolves.toBeUndefined();
  });

  it('continues processing remaining users when one user throws', async () => {
    const profiles = [{ user_id: 'user-1' }, { user_id: 'user-2' }];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: profiles, error: null }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn()
                // user-1: missing embedding → runForUser will throw
                .mockResolvedValueOnce({ data: { ...fixtureProfile, embedding: null }, error: null })
                // user-2: valid profile → should still be processed
                .mockResolvedValueOnce({ data: fixtureProfile, error: null }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return { upsert: mockUpsert } as unknown as ReturnType<typeof supabase.from>;
    });

    mockRpc.mockResolvedValue({ data: [], error: null });

    // runForAllUsers must resolve (not re-throw) even though user-1 fails
    await expect(runForAllUsers()).resolves.toBeUndefined();
  });
});
