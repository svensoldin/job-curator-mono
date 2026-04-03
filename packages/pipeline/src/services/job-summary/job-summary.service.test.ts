import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

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
      mockChatComplete.mockResolvedValue({
        choices: [{ message: { content: 'not valid json {{{' } }],
      });
      const promise = summarizeJob({ id: 99, description: 'some job' });
      promise.catch(() => {});
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow(/Malformed JSON/);
    });

    it('throws when response is missing required fields', async () => {
      mockChatComplete.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ stack: ['React'] }) } }],
      });
      const promise = summarizeJob({ id: 99, description: 'some job' });
      promise.catch(() => {});
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow(/Invalid StructuredSummary shape/);
    });

    it('retries up to 3 times and resolves on the 3rd attempt', async () => {
      mockChatComplete
        .mockRejectedValueOnce(new Error('transient error'))
        .mockRejectedValueOnce(new Error('transient error'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(FIXTURE_SUMMARY) } }],
        });

      const promise = summarizeJob({ id: 1, description: 'A great job' });
      await vi.runAllTimersAsync();
      expect(await promise).toMatchObject(FIXTURE_SUMMARY);
      expect(mockChatComplete).toHaveBeenCalledTimes(3);
    });

    it('throws after exhausting all 3 attempts', async () => {
      mockChatComplete.mockRejectedValue(new Error('persistent error'));
      const promise = summarizeJob({ id: 1, description: 'A great job' });
      promise.catch(() => {}); // prevent unhandled rejection before we attach the real handler
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow('persistent error');
      expect(mockChatComplete).toHaveBeenCalledTimes(3);
    });
  });

  describe('processPendingSummaries', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('calls update on each pending job', async () => {
      const promise = processPendingSummaries(50);
      await vi.runAllTimersAsync();
      await promise;
      expect(mockUpdateEq).toHaveBeenCalledTimes(2);
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 1);
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 2);
    });

    it('continues processing remaining jobs on per-job error', async () => {
      mockChatComplete
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(FIXTURE_SUMMARY) } }],
        });

      const promise = processPendingSummaries(50);
      await vi.runAllTimersAsync();
      await expect(promise).resolves.toBeUndefined();
      expect(mockUpdateEq).toHaveBeenCalledTimes(1);
    });
  });
});
