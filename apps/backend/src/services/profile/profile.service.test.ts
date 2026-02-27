import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEmbedText, mockSingle, mockMaybeSingle, mockUpsert, mockDelete, fixtureProfile } =
  vi.hoisted(() => {
    const fixtureProfile = {
      id: 'profile-1',
      user_id: 'user-123',
      plan: 'free',
      hard_constraints: { location: 'Paris', salary_min: 65, salary_max: 80, remote: true },
      skill_graph: { React: 5, 'Node.js': 3 },
      seniority: 'senior',
      culture_preference: 'startup',
      tech_stack_weights: null,
      raw_profile_text: 'Senior frontend engineer...',
      embedded_at: '2026-02-27T00:00:00.000Z',
      created_at: '2026-02-27T00:00:00.000Z',
      updated_at: '2026-02-27T00:00:00.000Z',
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: fixtureProfile, error: null });
    const mockSelectForUpsert = vi.fn().mockReturnValue({ single: mockSingle });
    const mockUpsert = vi.fn().mockReturnValue({ select: mockSelectForUpsert });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: fixtureProfile, error: null });

    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

    const mockEmbedText = vi.fn().mockResolvedValue(Array(1024).fill(0));

    return { mockEmbedText, mockSingle, mockMaybeSingle, mockUpsert, mockDelete, fixtureProfile };
  });

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      upsert: mockUpsert,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle }),
      }),
      delete: mockDelete,
    })),
  },
}));

vi.mock('../embedding/embedding.service.js', () => ({
  embedText: mockEmbedText,
}));

import { buildProfileText, createOrUpdate, getByUserId, deleteByUserId } from './profile.service.js';
import { supabase } from '../../lib/supabase.js';

describe('ProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbedText.mockResolvedValue(Array(1024).fill(0));
    mockSingle.mockResolvedValue({ data: fixtureProfile, error: null });
    mockMaybeSingle.mockResolvedValue({ data: fixtureProfile, error: null });
  });

  describe('buildProfileText', () => {
    it('includes seniority, skills, culture, and location for full input', () => {
      const result = buildProfileText({
        seniority: 'senior',
        skillGraph: { React: 5, 'Node.js': 3 },
        culturePreference: 'startup',
        hardConstraints: { location: 'Paris', salary_min: 65, salary_max: 80, remote: true },
      });

      expect(result).toContain('senior');
      expect(result).toContain('React');
      expect(result).toContain('Node.js');
      expect(result).toContain('startup');
      expect(result).toContain('Paris');
    });

    it('produces no undefined or null in output for minimal input', () => {
      const result = buildProfileText({});
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
    });
  });

  describe('createOrUpdate', () => {
    it('calls embedText with the text from buildProfileText', async () => {
      const input = { seniority: 'senior' as const, skillGraph: { React: 5 } };
      const expectedText = buildProfileText(input);

      mockUpsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fixtureProfile, error: null }),
        }),
      });

      await createOrUpdate('user-123', input);

      expect(mockEmbedText).toHaveBeenCalledWith(expectedText);
    });

    it('calls upsert with correct user_id and embedded_at set', async () => {
      mockUpsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: fixtureProfile, error: null }),
        }),
      });

      await createOrUpdate('user-123', { seniority: 'mid' });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          embedded_at: expect.any(String),
        }),
        { onConflict: 'user_id' }
      );
    });
  });

  describe('getByUserId', () => {
    it('returns a UserProfile when supabase returns a row', async () => {
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: fixtureProfile, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEq }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await getByUserId('user-123');
      expect(result).toEqual(fixtureProfile);
    });

    it('returns null when supabase returns null', async () => {
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: mockEq }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await getByUserId('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteByUserId', () => {
    it('resolves without error', async () => {
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockDeleteEq }),
      } as unknown as ReturnType<typeof supabase.from>);

      await expect(deleteByUserId('user-123')).resolves.toBeUndefined();
    });
  });
});
