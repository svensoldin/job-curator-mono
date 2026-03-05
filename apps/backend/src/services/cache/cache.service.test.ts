import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery, fixtureRow } = vi.hoisted(() => {
  const fixtureRow = {
    id: 'match-1',
    user_id: 'user-1',
    job_id: 42,
    score: 88,
    reasoning: 'Great fit',
    missing_skills: ['Python'],
    salary_alignment: 'ok',
    is_hidden_gem: true,
    cached_at: '2026-02-27T00:00:00.000Z',
    scraped_jobs: {
      id: 42,
      title: 'Frontend Engineer',
      company: 'Acme',
      location: 'Paris',
      url: 'https://example.com/job/42',
      source: 'linkedin',
      structured_summary: null,
    },
  };

  // All non-terminal chain methods return mockQuery; terminals resolve
  const mockQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(), // terminal for getMatchesForUser
    gte: vi.fn(),
    maybeSingle: vi.fn(), // terminal for getMatchDetail
  };

  mockQuery.select.mockReturnValue(mockQuery);
  mockQuery.eq.mockReturnValue(mockQuery);
  mockQuery.order.mockReturnValue(mockQuery);
  mockQuery.gte.mockReturnValue(mockQuery);
  mockQuery.limit.mockResolvedValue({ data: [fixtureRow], error: null });
  mockQuery.maybeSingle.mockResolvedValue({ data: fixtureRow, error: null });

  return { mockQuery, fixtureRow };
});

vi.mock('@repo/pipeline', () => ({
  supabase: {
    from: vi.fn().mockReturnValue(mockQuery),
  },
  SUPABASE_MATCH_CACHE_TABLE: 'match_cache',
}));

import { getMatchesForUser, getMatchDetail } from './cache.service.js';
import { supabase } from '@repo/pipeline';

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.gte.mockReturnValue(mockQuery);
    mockQuery.limit.mockResolvedValue({ data: [fixtureRow], error: null });
    mockQuery.maybeSingle.mockResolvedValue({ data: fixtureRow, error: null });

    vi.mocked(supabase.from).mockReturnValue(
      mockQuery as unknown as ReturnType<typeof supabase.from>
    );
  });

  describe('getMatchesForUser', () => {
    it('applies default limit of 50 and does not apply gte or is_hidden_gem filters', async () => {
      await getMatchesForUser('user-1');

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
      expect(mockQuery.gte).not.toHaveBeenCalled();
      // eq is only called for user_id filter
      const eqCalls = mockQuery.eq.mock.calls;
      expect(eqCalls.every((c: unknown[]) => c[0] === 'user_id')).toBe(true);
    });

    it('applies .gte("score", minScore) when minScore is provided', async () => {
      mockQuery.gte.mockReturnValue(mockQuery);
      mockQuery.limit.mockResolvedValue({ data: [fixtureRow], error: null });

      await getMatchesForUser('user-1', { minScore: 70 });

      expect(mockQuery.gte).toHaveBeenCalledWith('score', 70);
    });

    it('applies .eq("is_hidden_gem", true) when hiddenGemsOnly is true', async () => {
      await getMatchesForUser('user-1', { hiddenGemsOnly: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_hidden_gem', true);
    });

    it('maps scraped_jobs nested object to job key', async () => {
      const results = await getMatchesForUser('user-1');

      expect(results[0]).toMatchObject({
        id: 'match-1',
        job: {
          id: 42,
          title: 'Frontend Engineer',
          company: 'Acme',
        },
      });
      expect((results[0] as Record<string, unknown>).scraped_jobs).toBeUndefined();
    });
  });

  describe('getMatchDetail', () => {
    it('returns a MatchWithJob when supabase returns a row', async () => {
      const result = await getMatchDetail('user-1', 42);

      expect(result).toMatchObject({ id: 'match-1', job_id: 42 });
      expect(result?.job.title).toBe('Frontend Engineer');
    });

    it('returns null when supabase returns null', async () => {
      mockQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getMatchDetail('user-1', 999);
      expect(result).toBeNull();
    });
  });
});
