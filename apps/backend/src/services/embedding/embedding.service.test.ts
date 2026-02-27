import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEmbeddingsCreate, mockUpdateEq, mockFrom } = vi.hoisted(() => {
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
  const mockEmbeddingsCreate = vi.fn().mockResolvedValue({
    data: [{ embedding: Array(1024).fill(0.1) }],
  });
  return { mockEmbeddingsCreate, mockUpdateEq, mockFrom };
});

vi.mock('@mistralai/mistralai', () => ({
  Mistral: vi.fn().mockImplementation(function () {
    return { embeddings: { create: mockEmbeddingsCreate } };
  }),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { embedText, processUnembeddedJobs } from './embedding.service.js';

describe('EmbeddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: Array(1024).fill(0.1) }],
    });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  describe('embedText', () => {
    it('returns a number[] of length 1024', async () => {
      const result = await embedText('some job description');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1024);
      expect(typeof result[0]).toBe('number');
    });

    it('calls Mistral embeddings API with the input text', async () => {
      await embedText('my text');
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
        model: 'mistral-embed',
        inputs: ['my text'],
      });
    });
  });

  describe('processUnembeddedJobs', () => {
    it('calls update on each unembedded job', async () => {
      await processUnembeddedJobs(50);
      expect(mockUpdateEq).toHaveBeenCalledTimes(2);
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 1);
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 2);
    });

    it('queries scraped_jobs where embedded_at is null', async () => {
      await processUnembeddedJobs(10);
      expect(mockFrom).toHaveBeenCalledWith('scraped_jobs');
    });

    it('continues processing remaining jobs on per-job error', async () => {
      mockUpdateEq
        .mockResolvedValueOnce({ error: new Error('DB error') })
        .mockResolvedValueOnce({ error: null });

      await expect(processUnembeddedJobs(50)).resolves.toBeUndefined();
      expect(mockUpdateEq).toHaveBeenCalledTimes(2);
    });
  });
});
