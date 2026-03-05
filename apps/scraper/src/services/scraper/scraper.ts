import { supabase, SUPABASE_SCRAPED_JOBS_TABLE } from '@repo/pipeline';
import dotenv from 'dotenv';

import type { ScrapeCriteria } from '../../types.js';
import logger from '../../utils/logger.js';

import { scrapeLinkedIn } from './linkedin/linkedin.js';
import { closeBrowser, createBrowser } from './helpers.js';
import scrapeWelcomeToTheJungle from './wttj/wttj.js';

dotenv.config();

export default async function scrapeJobs(targets: ScrapeCriteria[]) {
  const browser = await createBrowser();

  try {
    const allJobs = [];

    for (const target of targets) {
      logger.info(`Starting job scraping for: ${target.jobTitle}`);
      const wttjJobs = await scrapeWelcomeToTheJungle(browser, target);
      const linkedInJobs = await scrapeLinkedIn(browser, target);
      allJobs.push(...wttjJobs, ...linkedInJobs);
    }

    const uniqueJobs = allJobs.filter(
      (job, index, self) => index === self.findIndex((j) => j.url === job.url)
    );

    logger.info(`✅ Successfully scraped ${uniqueJobs.length} jobs with descriptions`);

    const emptyDescriptions = uniqueJobs.filter((j) => !j.description).length;
    if (uniqueJobs.length === 0 || emptyDescriptions / uniqueJobs.length > 0.5) {
      logger.error(
        `Scraper health check failed: ${uniqueJobs.length} jobs, ${emptyDescriptions} empty descriptions`
      );
    }

    const { error: upsertError } = await supabase
      .from(SUPABASE_SCRAPED_JOBS_TABLE)
      .upsert(uniqueJobs, { onConflict: 'url' });

    if (upsertError) {
      logger.error(`Failed to upsert scraped jobs:`, upsertError);
      throw upsertError;
    }

    logger.info(`✅ Successfully update db with scraped jobs`);
  } catch (error) {
    logger.error('Error in job scraping:', error);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
}
