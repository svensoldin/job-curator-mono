import logger from '../../utils/logger.js';
import type { JobPosting, UserCriteria } from '../../types.js';
import { analyzeSingleJob } from './helpers.js';

/**
 * Analyze multiple jobs with AI and return top N sorted by score
 * Uses batching to avoid rate limits
 */
export async function analyzeAndRankJobs(
  jobs: JobPosting[],
  userCriteria: UserCriteria
): Promise<JobPosting[]> {
  logger.info(`Analyzing ${jobs.length} jobs with AI (Mistral)`);

  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 2000;

  const analyzedJobs: JobPosting[] = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    logger.info(
      `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        jobs.length / BATCH_SIZE
      )} (${batch.length} jobs)`
    );

    const batchResults = await Promise.all(batch.map((job) => analyzeSingleJob(job, userCriteria)));

    analyzedJobs.push(...batchResults);

    if (i + BATCH_SIZE < jobs.length) {
      logger.info(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const topJobs = analyzedJobs.sort((a, b) => (b.score || 0) - (a.score || 0));

  return topJobs;
}

export default { analyzeAndRankJobs };
