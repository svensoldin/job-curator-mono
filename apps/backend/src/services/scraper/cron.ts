import scrapeJobs, { SCRAPE_CRITERIA } from '../scraper/scraper.js';
import cron from 'node-cron';

cron.schedule('0 8 * * *', () => {
  scrapeJobs(SCRAPE_CRITERIA);
});
