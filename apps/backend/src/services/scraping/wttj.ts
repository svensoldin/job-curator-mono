import { Browser, Page } from 'puppeteer';

import type { JobPosting, ScrapeCriteria } from 'types.js';
import { logger } from 'utils/logger.js';
import {
  DELAY_BETWEEN_REQUESTS,
  initializePageAndNavigate,
  MAX_JOBS_PER_BOARD,
  USER_AGENT,
} from './utils.js';

const BASE_URL = 'https://www.welcometothejungle.com/fr/jobs';
const PRIMARY_SELECTOR = '.ais-Hits-list-item';

const extractCompanyFromUrl = (href: string): string => {
  const urlMatch = href.match(/\/companies\/([^/]+)\/jobs\//);
  const companySlug = urlMatch ? urlMatch[1] : '';

  return companySlug
    ? companySlug
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown Company';
};

export const getJobs = async (
  page: Page,
  limit: number
): Promise<JobPosting[]> => {
  const jobs: JobPosting[] = await page.evaluate((maxJobs) => {
    const jobLinks = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
    const jobsMap = new Map();

    for (const link of jobLinks) {
      if (jobsMap.size >= maxJobs) break;

      const href = (link as HTMLAnchorElement).href;
      const linkText = link.textContent?.trim() || '';

      if (!linkText) continue;

      const company = extractCompanyFromUrl(href);

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

export const getJobDescriptions = async (
  browser: Browser,
  jobs: JobPosting[]
): Promise<void> => {
  logger.info(
    `Fetching descriptions for ${jobs.length} Welcome to the Jungle jobs...`
  );

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job || !job.url) continue;

    try {
      logger.info(
        `📖 Fetching WTTJ description ${i + 1}/${jobs.length}: ${job.title}`
      );

      const descPage = await browser.newPage();
      await descPage.setUserAgent(USER_AGENT);

      await descPage.goto(job.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      let description = '';
      const selectors = [
        '#the-position-section',
        '[data-testid="job-description"]',
        '.sc-1g2uzm9-0',
        '[class*="description"]',
        '.job-description',
      ];

      for (const selector of selectors) {
        try {
          await descPage.waitForSelector(selector, { timeout: 3000 });
          description = await descPage.$eval(
            selector,
            (el) => el.textContent?.trim() || ''
          );
          if (description && description.length > 100) {
            logger.info(
              `✅ Found description with selector: ${selector} (${description.length} chars)`
            );
            break;
          }
        } catch (e) {
          continue;
        }
      }

      job.description = description;

      if (!description || description.length < 100) {
        logger.warn(`⚠️ No description found for: ${job.title}`);
      }

      await descPage.close();

      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      );
    } catch (error) {
      logger.error(`❌ Error fetching description for ${job.title}:`, error);
    }
  }
};

export default async function scrapeWelcomeToTheJungle(
  browser: Browser,
  criteria: ScrapeCriteria,
  limit: number = MAX_JOBS_PER_BOARD
): Promise<JobPosting[]> {
  const searchTerms = [criteria.jobTitle];

  const searchQuery = searchTerms.join(' ');
  let url = `${BASE_URL}?query=${encodeURIComponent(searchQuery)}`;

  if (
    criteria.location &&
    !criteria.location.toLowerCase().includes('remote')
  ) {
    url += `&refinementList[offices.country_code][]=FR`;
  }

  try {
    const page = await initializePageAndNavigate(
      browser,
      url,
      PRIMARY_SELECTOR
    );

    const jobs = await getJobs(page, limit);

    await page.close();

    logger.info(`Found ${jobs.length} Welcome to the Jungle jobs`);

    await getJobDescriptions(browser, jobs);

    logger.info(`Scraped ${jobs.length} jobs from Welcome to the Jungle`);
    return jobs;
  } catch (error) {
    logger.error('Error scraping Welcome to the Jungle:', error);
    return [];
  }
}
