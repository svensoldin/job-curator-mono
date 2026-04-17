import type { Browser } from 'puppeteer';
import type { JobPosting, ScrapeCriteria } from '../../../types.js';
import logger from '../../../utils/logger.js';
import { getJobDescriptions, initializePageAndNavigate } from '../../scraper/helpers.js';
import { getJobs } from './helpers.js';
import {
  DELAY_BETWEEN_REQUESTS,
  MAX_JOBS_PER_BOARD,
  MAX_PAGES_PER_BOARD,
} from '../../../constants/scraper.js';

const BASE_URL = 'https://fr.linkedin.com/jobs/search/';
const LAST_WEEK_QUERY_PARAM = '&f_TPR=r604800';
const PARIS_QUERY_PARAM = '&geoId=101240143';

const PRIMARY_SELECTOR = '.jobs-search__results-list';

export const LINKEDIN_DESCRIPTION_SELECTORS = [
  '[data-testid="expandable-text-box"]',
  '.show-more-less-html__markup',
  '.description__text',
  '[class*="description"]',
  '.jobs-description',
  'article',
];

/**
 * Scrapes job listings from LinkedIn, iterating over multiple pages (up to MAX_PAGES_PER_BOARD)
 * using the `&start=N` offset parameter (multiples of 25) to collect enough results.
 */
export const scrapeLinkedIn = async (
  browser: Browser,
  criteria: ScrapeCriteria,
  limit: number = MAX_JOBS_PER_BOARD
): Promise<JobPosting[]> => {
  const keywords = criteria.jobTitle;
  const targetUrl =
    `${BASE_URL}?keywords=${encodeURIComponent(keywords)}` +
    PARIS_QUERY_PARAM +
    LAST_WEEK_QUERY_PARAM;

  try {
    const allJobs: JobPosting[] = [];

    for (let pageNum = 0; pageNum < MAX_PAGES_PER_BOARD; pageNum++) {
      const pagedUrl = `${targetUrl}&start=${pageNum * 25}`;
      const listingPage = await initializePageAndNavigate(browser, pagedUrl, PRIMARY_SELECTOR);
      const jobs = await getJobs(listingPage, 25);
      await listingPage.close();

      if (jobs.length === 0) break;
      allJobs.push(...jobs);
      if (allJobs.length >= limit) break;

      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }

    logger.info(`Found ${allJobs.length} LinkedIn jobs`);
    logger.info(`Fetching descriptions for ${allJobs.length} LinkedIn jobs...`);

    await getJobDescriptions(browser, allJobs, LINKEDIN_DESCRIPTION_SELECTORS);

    logger.info(`Scraped ${allJobs.length} jobs from LinkedIn`);
    return allJobs;
  } catch (error) {
    logger.error('Error scraping LinkedIn:', error);
    return [];
  }
};
