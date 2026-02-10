import cron from 'node-cron';
import scrapeJobs, { SCRAPE_CRITERIA } from 'services/scraper/scraper.js';

cron.schedule('0 8 * * *', () => {
  scrapeJobs(SCRAPE_CRITERIA);
});
