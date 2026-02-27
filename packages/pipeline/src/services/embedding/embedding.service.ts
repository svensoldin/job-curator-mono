import { Mistral } from '@mistralai/mistralai';
import { supabase } from '../../lib/supabase.js';
import { SUPABASE_SCRAPED_JOBS_TABLE } from '../../constants/supabase.js';
import logger from '../../utils/logger.js';

const EMBED_CHUNK_SIZE = 20;
const EMBED_CHUNK_DELAY_MS = 1000;

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

/**
 * Embeds a single text string using the Mistral embedding model.
 * Returns a 1024-dimensional vector.
 */
export async function embedText(text: string): Promise<number[]> {
  const response = await client.embeddings.create({
    model: 'mistral-embed',
    inputs: [text],
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error('No embedding returned from Mistral');
  return embedding;
}

/**
 * Embeds multiple texts in chunks of `EMBED_CHUNK_SIZE`, with a delay between
 * chunks to respect rate limits. Returns one embedding vector per input text.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_CHUNK_SIZE) {
    const chunk = texts.slice(i, i + EMBED_CHUNK_SIZE);

    // Mistral's API takes an array of texts, and returns an array of embeddings in the same order
    // See https://docs.mistral.ai/capabilities/embeddings/text_embeddings
    const response = await client.embeddings.create({
      model: 'mistral-embed',
      inputs: chunk,
    });
    results.push(
      ...response.data.map((d) => {
        if (!d.embedding) throw new Error('Missing embedding in batch response');
        return d.embedding;
      })
    );

    if (i + EMBED_CHUNK_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, EMBED_CHUNK_DELAY_MS));
    }
  }

  return results;
}

/**
 * Fetches up to `batchSize` jobs where `embedded_at` is null, embeds all their
 * descriptions in a single batched API call, and writes the resulting vectors
 * back to the database. Per-job failures are logged and skipped so the rest of
 * the batch still completes.
 */
export async function processUnembeddedJobs(batchSize = 50): Promise<void> {
  const { data: jobs, error } = await supabase
    .from(SUPABASE_SCRAPED_JOBS_TABLE)
    .select('id, description')
    .is('embedded_at', null)
    .limit(batchSize);

  if (error) throw error;

  if (!jobs || jobs.length === 0) {
    logger.info('No unembedded jobs found');
    return;
  }

  logger.info(`Processing ${jobs.length} unembedded jobs`);

  const embeddings = await embedBatch(jobs.map((j) => j.description));

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]!;
    try {
      const { error: updateError } = await supabase
        .from(SUPABASE_SCRAPED_JOBS_TABLE)
        .update({
          // pgvector stores embeddings as strings in the Supabase JS client
          embedding: embeddings[i]! as unknown as string,
          embedded_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateError) throw updateError;
      logger.info(`Embedded job ${job.id}`);
    } catch (err) {
      logger.error(`Failed to embed job ${job.id}:`, err);
    }
  }
}
