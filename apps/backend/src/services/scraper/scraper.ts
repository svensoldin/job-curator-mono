import { supabase } from '../../lib/supabase.js';
import dotenv from 'dotenv';

import type { ScrapeCriteria } from 'types.js';
import logger from '../../utils/logger.js';

import { SCRAPE_JOB_TITLE, SCRAPE_LOCATION } from '../../constants/scraper.js';
import { SUPABASE_SCRAPED_JOBS_TABLE } from '../../constants/search-task-manager.js';
import { scrapeLinkedIn } from './linkedin/linkedin.js';
import { closeBrowser, createBrowser } from './helpers.js';
import scrapeWelcomeToTheJungle from './wttj/wttj.js';

dotenv.config();

if (!SCRAPE_JOB_TITLE || !SCRAPE_LOCATION)
  throw new Error('Missing SCRAPE_CRITERIA_JOB_TITLE or SCRAPE_CRITERIA_LOCATION env vars');

export default async function scrapeJobs(criteria: ScrapeCriteria) {
  const browser = await createBrowser();

  try {
    logger.info(`Starting job scraping for: ${criteria.jobTitle}`);

    const welcomeToTheJungleJobs = await scrapeWelcomeToTheJungle(browser, criteria);

    const linkedInJobs = await scrapeLinkedIn(browser, criteria);

    const allJobs = [...welcomeToTheJungleJobs, ...linkedInJobs];

    const uniqueJobs = allJobs.filter(
      (job, index, self) => index === self.findIndex((j) => j.url === job.url)
    );

    logger.info(`✅ Successfully scraped ${uniqueJobs.length} jobs with descriptions`);

    const { error: upsertError } = await supabase
      .from(SUPABASE_SCRAPED_JOBS_TABLE)
      .upsert(uniqueJobs);

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

export const SCRAPE_CRITERIA: ScrapeCriteria = {
  jobTitle: SCRAPE_JOB_TITLE,
  location: SCRAPE_LOCATION,
};

scrapeJobs(SCRAPE_CRITERIA);
