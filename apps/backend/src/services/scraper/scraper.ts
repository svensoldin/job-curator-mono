import cron from 'node-cron';
import dotenv from 'dotenv';
import { supabase } from 'lib/supabase.js';

import type { ScrapeCriteria } from 'types.js';
import logger from 'utils/logger.js';

import { SCRAPE_JOB_TITLE, SCRAPE_LOCATION } from 'constants/scraper.js';
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

    const { error: upsertError } = await supabase.from('scraped_jobs').upsert(uniqueJobs);

    if (upsertError) {
      logger.error(`Failed to upsert scraped jobs:`, upsertError);
      throw upsertError;
    }
  } catch (error) {
    logger.error('Error in job scraping:', error);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
}

const SCRAPE_CRITERIA: ScrapeCriteria = {
  jobTitle: SCRAPE_JOB_TITLE,
  location: SCRAPE_LOCATION,
};

cron.schedule('0 8 * * *', () => {
  scrapeJobs(SCRAPE_CRITERIA);
});
