import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StructuredSummary } from '@repo/types';

const FIXTURE_SUMMARY: StructuredSummary = {
  stack: ['TypeScript', 'React', 'Node.js'],
  seniority: 'senior',
  culture: 'scale-up',
  responsibilities: 'Build and maintain web applications',
  salary: '80k-100k EUR',
};

const { mockChatComplete, mockUpdateEq, mockFrom } = vi.hoisted(() => {
  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
  const mockLimit = vi.fn().mockResolvedValue({
    data: [
      { id: 1, description: 'First job description' },
      { id: 2, description: 'Second job description' },
    ],
    error: null,
  });
  const mockIs = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockSelect = vi.fn().mockReturnValue({ is: mockIs });
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });
  const mockChatComplete = vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            stack: ['TypeScript', 'React', 'Node.js'],
            seniority: 'senior',
            culture: 'scale-up',
            responsibilities: 'Build and maintain web applications',
            salary: '80k-100k EUR',
          }),
        },
      },
    ],
  });
  return { mockChatComplete, mockUpdateEq, mockFrom };
});

vi.mock('@mistralai/mistralai', () => ({
  Mistral: vi.fn().mockImplementation(function () {
    return { chat: { complete: mockChatComplete } };
  }),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { summarizeJob, processPendingSummaries } from './job-summary.service.js';

describe('JobSummaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatComplete.mockResolvedValue({
      choices: [
        {
          message: { content: JSON.stringify(FIXTURE_SUMMARY) },
        },
      ],
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  describe('summarizeJob', () => {
    it('returns a valid StructuredSummary shape', async () => {
      const result = await summarizeJob({ id: 1, description: 'A great job' });
      expect(result).toMatchObject<StructuredSummary>({
        stack: expect.any(Array) as string[],
        seniority: expect.any(String) as string,
        culture: expect.any(String) as string,
        responsibilities: expect.any(String) as string,
        salary: expect.any(String) as string,
      });
      expect(result.stack).toEqual(['TypeScript', 'React', 'Node.js']);
      expect(result.seniority).toBe('senior');
    });

    it('throws on malformed JSON response', async () => {
      mockChatComplete.mockResolvedValueOnce({
        choices: [{ message: { content: 'not valid json {{{' } }],
      });
      await expect(summarizeJob({ id: 99, description: 'some job' })).rejects.toThrow(
        /Malformed JSON/
      );
    });

    it('throws when response is missing required fields', async () => {
      mockChatComplete.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ stack: ['React'] }) } }],
      });
      await expect(summarizeJob({ id: 99, description: 'some job' })).rejects.toThrow(
        /Invalid StructuredSummary shape/
      );
    });
  });

  describe('processPendingSummaries', () => {
    it('calls update on each pending job', async () => {
      await processPendingSummaries(50);
      expect(mockUpdateEq).toHaveBeenCalledTimes(2);
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 1);
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 2);
    });

    it('continues processing remaining jobs on per-job error', async () => {
      mockChatComplete
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(FIXTURE_SUMMARY) } }],
        });

      await expect(processPendingSummaries(50)).resolves.toBeUndefined();
      expect(mockUpdateEq).toHaveBeenCalledTimes(1);
    });
  });
});
