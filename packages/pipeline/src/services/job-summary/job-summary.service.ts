import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import type { StructuredSummary } from '@repo/types';
import { supabase } from '../../lib/supabase.js';
import { SUPABASE_SCRAPED_JOBS_TABLE } from '../../constants/supabase.js';
import logger from '../../utils/logger.js';

dotenv.config();

const SYSTEM_PROMPT = `You are a job analyst. Extract key information from the job description and return a JSON object with exactly these fields:
- stack: array of strings (technologies/tools required)
- seniority: string (e.g. "junior", "mid", "senior", "lead")
- culture: string (e.g. "startup", "scale-up", "big_corp")
- responsibilities: string (brief summary of main responsibilities)
- salary: string (salary information if present, otherwise "not specified")

Return only the JSON object, no additional text.`;

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

/**
 * Calls the Mistral chat API to extract a structured summary from a job description.
 * Parses and validates the JSON response, throwing if the shape is incorrect.
 */
export async function summarizeJob(job: {
  id: number;
  description: string;
}): Promise<StructuredSummary> {
  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    responseFormat: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: job.description },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Malformed JSON response for job ${job.id}: ${text}`);
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)['stack']) ||
    typeof (parsed as Record<string, unknown>)['seniority'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['culture'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['responsibilities'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['salary'] !== 'string'
  ) {
    throw new Error(`Invalid StructuredSummary shape for job ${job.id}`);
  }

  return parsed as StructuredSummary;
}

/**
 * Fetches up to `batchSize` jobs where `summarized_at` is null, calls `summarizeJob`
 * for each, and writes the structured summary back to the database. Per-job failures
 * are logged and skipped so the rest of the batch still completes.
 */
export async function processPendingSummaries(batchSize = 50): Promise<void> {
  const { data: jobs, error } = await supabase
    .from(SUPABASE_SCRAPED_JOBS_TABLE)
    .select('id, description')
    .is('summarized_at', null)
    .limit(batchSize);

  if (error) throw error;

  if (!jobs || jobs.length === 0) {
    logger.info('No pending summaries found');
    return;
  }

  logger.info(`Processing ${jobs.length} pending job summaries`);

  for (const job of jobs) {
    try {
      const structured_summary = await summarizeJob(job);
      const { error: updateError } = await supabase
        .from(SUPABASE_SCRAPED_JOBS_TABLE)
        .update({
          structured_summary: structured_summary as unknown as string,
          summarized_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateError) throw updateError;
      logger.info(`Summarized job ${job.id}`);
    } catch (err) {
      logger.error(`Failed to summarize job ${job.id}:`, err);
    }
  }
}
