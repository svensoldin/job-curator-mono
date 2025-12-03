import puppeteer, { Browser, Page } from 'puppeteer';
import logger from 'utils/logger.js';

export const MAX_JOBS_PER_BOARD = 15;
export const MAX_JOBS = 50;
export const DELAY_BETWEEN_REQUESTS = 1000;
export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  try {
    await page.waitForSelector(primarySelector, {
      timeout: 10000,
    });
  } catch (selectorError) {
    logger.warn('Primary selectors not found', selectorError);
    await page.waitForSelector('body', { timeout: 5000 });
  }

  return page;
};
