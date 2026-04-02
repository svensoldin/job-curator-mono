import puppeteer, { Browser, Page } from 'puppeteer';

import type { JobPosting } from '../../types.js';
import logger from '../../utils/logger.js';
import { DELAY_BETWEEN_REQUESTS, USER_AGENT } from '../../constants/scraper.js';

export const createBrowser = async (): Promise<Browser> => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    logger.info('Browser initialized successfully');
    return browser;
  } catch (error) {
    logger.error('Failed to initialize browser:', error);
    throw error;
  }
};

export const closeBrowser = async (browser: Browser): Promise<void> => {
  if (browser) {
    await browser.close();
    logger.info('Browser closed');
  }
};

export const initializePageAndNavigate = async (
  browser: Browser,
  url: string,
  primarySelector: string
): Promise<Page> => {
  const page: Page = await browser.newPage();

  await page.setUserAgent(USER_AGENT);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 15_000 });

  try {
    await page.waitForSelector(primarySelector, {
      timeout: 15_000,
    });
  } catch (selectorError) {
    logger.warn('Primary selectors not found', selectorError);
    await page.waitForSelector('body', { timeout: 5000 });
  }

  return page;
};

const cleanDescription = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
};

export const parseJobDescription = async (
  page: Page,
  selectors: string[],
  minLength: number = 100
): Promise<string> => {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      const description = await page.$eval(selector, (el) => (el as HTMLElement).innerText || '');
      if (description) {
        if (description.length < minLength)
          logger.warn(`Description is shorter than minimum length for ${page.url()}`);
        return cleanDescription(description);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      continue;
    }
  }

  return '';
};

/**
 * Fetches the description for a single job posting by navigating to its URL and parsing the page.
 * Uses try/finally to ensure the page is always closed even if navigation or parsing fails.
 */
export const getJobDescription = async (browser: Browser, job: JobPosting, selectors: string[]) => {
  if (!job || !job.url) return;

  const descPage = await browser.newPage();
  try {
    await descPage.setUserAgent(USER_AGENT);

    await descPage.goto(job.url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const description = await parseJobDescription(descPage, selectors);
    job.description = description;
  } catch (error) {
    logger.error(`❌ Error fetching description for ${job.title}:`, error);
  } finally {
    await descPage.close();
  }
};

/**
 * Fetches descriptions for a list of job postings using a concurrency pool of 3.
 * A 1-second delay is applied between each chunk to avoid rate limits.
 */
export const getJobDescriptions = async (
  browser: Browser,
  jobs: JobPosting[],
  selectors: string[]
): Promise<void> => {
  const CHUNK_SIZE = 3;
  for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
    const chunk = jobs.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map((job) => getJobDescription(browser, job, selectors)));
    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  }
};
