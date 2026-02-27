import { Browser, Page } from 'puppeteer';

import type { JobPosting, ScrapeCriteria } from '../../../types.js';
import logger from '../../../utils/logger.js';
import {
  getJobDescriptions,
  initializePageAndNavigate,
} from '../helpers.js';
import {
  DELAY_BETWEEN_REQUESTS,
  MAX_JOBS_PER_BOARD,
  MAX_PAGES_PER_BOARD,
} from '../../../constants/scraper.js';

const BASE_URL = 'https://www.welcometothejungle.com/fr/jobs';
const PRIMARY_SELECTOR = '.ais-Hits-list-item';

export const getJobs = async (page: Page, limit: number): Promise<JobPosting[]> => {
  const jobs: JobPosting[] = await page.evaluate((maxJobs) => {
    const jobLinks = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
    const jobsMap = new Map();

    for (const link of jobLinks) {
      if (jobsMap.size >= maxJobs) break;

      const href = (link as HTMLAnchorElement).href;
      const linkText = link.textContent?.trim() || '';

      if (!linkText) continue;

      // Inline extractCompanyFromUrl — Node-scope functions are not accessible inside page.evaluate
      const urlMatch = href.match(/\/companies\/([^/]+)\/jobs\//);
      const companySlug = urlMatch ? urlMatch[1] : '';
      const company = companySlug
        ? companySlug
            .split('-')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Unknown Company';

      if (!jobsMap.has(href)) {
        jobsMap.set(href, {
          title: linkText,
          company: company,
          url: href,
          description: '',
          source: 'welcometothejungle',
        });
      }
    }

    return Array.from(jobsMap.values());
  }, limit);

  return jobs;
};

const WTTJ_DESCRIPTION_SELECTORS = [
  '#the-position-section',
  '[data-testid="job-description"]',
  '.sc-1g2uzm9-0',
  '[class*="description"]',
  '.job-description',
];

/**
 * Scrapes job listings from Welcome to the Jungle, iterating over multiple pages
 * (up to MAX_PAGES_PER_BOARD) using the `&page=N` query parameter to collect enough results.
 */
export default async function scrapeWelcomeToTheJungle(
  browser: Browser,
  criteria: ScrapeCriteria,
  limit: number = MAX_JOBS_PER_BOARD
): Promise<JobPosting[]> {
  const searchQuery = criteria.jobTitle;
  let baseUrl = `${BASE_URL}?query=${encodeURIComponent(searchQuery)}`;

  if (criteria.location && !criteria.location.toLowerCase().includes('remote')) {
    baseUrl += `&refinementList[offices.country_code][]=FR`;
  }

  try {
    const allJobs: JobPosting[] = [];

    for (let pageNum = 0; pageNum < MAX_PAGES_PER_BOARD; pageNum++) {
      const pagedUrl = `${baseUrl}&page=${pageNum}`;
      const listingPage = await initializePageAndNavigate(browser, pagedUrl, PRIMARY_SELECTOR);
      const jobs = await getJobs(listingPage, 50);
      await listingPage.close();

      if (jobs.length === 0) break;
      allJobs.push(...jobs);
      if (allJobs.length >= limit) break;

      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }

    const jobs = allJobs.slice(0, limit);

    logger.info(`Found ${jobs.length} Welcome to the Jungle jobs`);
    logger.info(`Fetching descriptions for ${jobs.length} Welcome to the Jungle jobs...`);

    await getJobDescriptions(browser, jobs, WTTJ_DESCRIPTION_SELECTORS);

    logger.info(`Scraped ${jobs.length} jobs from Welcome to the Jungle`);
    return jobs;
  } catch (error) {
    logger.error('Error scraping Welcome to the Jungle:', error);
    return [];
  }
}
