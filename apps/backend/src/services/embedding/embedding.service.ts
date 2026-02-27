import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import { supabase } from '../../lib/supabase.js';
import { SUPABASE_SCRAPED_JOBS_TABLE } from '../../constants/supabase.js';
import logger from '../../utils/logger.js';

dotenv.config();

const EMBED_CHUNK_SIZE = 20;
const EMBED_CHUNK_DELAY_MS = 1000;

export async function embedText(text: string): Promise<number[]> {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  const response = await client.embeddings.create({
    model: 'mistral-embed',
    inputs: [text],
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error('No embedding returned from Mistral');
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBED_CHUNK_SIZE) {
    const chunk = texts.slice(i, i + EMBED_CHUNK_SIZE);
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

  for (const job of jobs) {
    try {
      const embedding = await embedText(job.description);
      const { error: updateError } = await supabase
        .from(SUPABASE_SCRAPED_JOBS_TABLE)
        .update({
          embedding: embedding as unknown as string,
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
