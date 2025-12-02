import type { Browser, Page } from 'puppeteer';

import type { JobPosting, ScrapeCriteria } from 'types.js';
import logger from 'utils/logger.js';
import {
  DELAY_BETWEEN_REQUESTS,
  initializePageAndNavigate,
  MAX_JOBS_PER_BOARD,
  USER_AGENT,
} from './utils.js';

const BASE_URL = 'https://www.linkedin.com/jobs/search/';
const PRIMARY_SELECTOR = '.jobs-search__results-list';

const getJobs = async (page: Page, limit: number) => {
  const jobs: JobPosting[] = await page.evaluate((maxJobs) => {
    const jobElements = document.querySelectorAll('.job-search-card');
    const limitedElements = Array.from(jobElements).slice(0, maxJobs);
    return limitedElements.map((element) => {
      const titleElement = element.querySelector('.base-search-card__title');
      const companyElement = element.querySelector(
        '.base-search-card__subtitle'
      );
      const locationElement = element.querySelector(
        '.job-search-card__location'
      );
      const linkElement = element.querySelector(
        'a[data-tracking-control-name="public_jobs_jserp-result_search-card"]'
      );

      return {
        title: titleElement ? titleElement.textContent?.trim() || '' : '',
        company: companyElement ? companyElement.textContent?.trim() || '' : '',
        location: locationElement
          ? locationElement.textContent?.trim() || ''
          : '',
        url: linkElement ? (linkElement as HTMLAnchorElement).href : '',
        description: '',
        source: 'linkedin',
      };
    });
  }, limit);

  return jobs;
};

const getJobDescriptions = async (
  browser: Browser,
  jobs: JobPosting[]
): Promise<void> => {
  logger.info(`Fetching descriptions for ${jobs.length} LinkedIn jobs...`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job || !job.url) continue;

    try {
      logger.info(
        `📖 Fetching description ${i + 1}/${jobs.length}: ${job.title}`
      );

      const descPage = await browser.newPage();
      await descPage.setUserAgent(USER_AGENT);

      await descPage.goto(job.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      let description = '';
      const selectors = [
        '.show-more-less-html__markup',
        '.description__text',
        '[class*="description"]',
        '.jobs-description',
        'article',
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

export const scrapeLinkedIn = async (
  browser: Browser,
  criteria: ScrapeCriteria,
  limit: number = MAX_JOBS_PER_BOARD
): Promise<JobPosting[]> => {
  const keywords = criteria.jobTitle;
  const location = criteria.location || '';
  const url = `${BASE_URL}?keywords=${encodeURIComponent(
    keywords
  )}&location=${encodeURIComponent(location)}`;

  try {
    const page = await initializePageAndNavigate(
      browser,
      url,
      PRIMARY_SELECTOR
    );

    const jobs: JobPosting[] = await getJobs(page, limit);

    await page.close();

    logger.info(`Found ${jobs.length} LinkedIn jobs`);

    logger.info(`Fetching descriptions for ${jobs.length} LinkedIn jobs...`);

    await getJobDescriptions(browser, jobs);

    logger.info(`Scraped ${jobs.length} jobs from LinkedIn`);
    return jobs;
  } catch (error) {
    logger.error('Error scraping LinkedIn:', error);
    return [];
  }
};
