import dotenv from 'dotenv';
dotenv.config();

import logger from './utils/logger.js';
import scrapeJobs from './services/scraper/scraper.js';
import { SCRAPE_TARGETS } from './constants/scraper.js';
import { processPendingSummaries, processUnembeddedJobs, runForAllUsers } from '@repo/pipeline';

async function main() {
  logger.info('🚀 Starting scraper pipeline...');

  logger.info('📡 Step 1: Scraping jobs...');
  await scrapeJobs(SCRAPE_TARGETS);

  logger.info('📝 Step 2: Processing pending summaries...');
  await processPendingSummaries();

  logger.info('🔢 Step 3: Processing unembedded jobs...');
  await processUnembeddedJobs();

  logger.info('🎯 Step 4: Running matching for all users...');
  await runForAllUsers();

  logger.info('✅ Pipeline complete!');
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
