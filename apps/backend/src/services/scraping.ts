import { logger } from '../utils/logger.js';
import { JobPosting, ScrapeCriteria } from '../types.js';
import puppeteer, { Browser, Page } from 'puppeteer';

// import { config } from '../config.js';

// Local config for scraping
const MAX_JOBS = 50;
const DELAY_BETWEEN_REQUESTS = 1000;

/**
 * Create and initialize a browser instance
 */
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

/**
 * Close browser instance
 */
export const closeBrowser = async (browser: Browser): Promise<void> => {
  if (browser) {
    await browser.close();
    logger.info('Browser closed');
  }
};

/**
 * Scrape Welcome to the Jungle with specific criteria
 */
const scrapeWelcomeToTheJungle = async (
  browser: Browser,
  criteria: ScrapeCriteria
): Promise<JobPosting[]> => {
  const baseUrl = 'https://www.welcometothejungle.com/fr/jobs';

  // Build search query from criteria
  const searchTerms = [criteria.jobTitle];

  const searchQuery = searchTerms.join(' ');
  let url = `${baseUrl}?query=${encodeURIComponent(searchQuery)}`;

  // Add location filter if specified
  if (
    criteria.location &&
    !criteria.location.toLowerCase().includes('remote')
  ) {
    url += `&refinementList[offices.country_code][]=FR`;
  }

  try {
    const page: Page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for job listings to load
    try {
      await page.waitForSelector('.ais-Hits-list-item', { timeout: 15000 });
    } catch (selectorError) {
      logger.warn('Welcome to the Jungle: Primary selectors not found');
      await page.waitForSelector('body', { timeout: 5000 });
    }

    const jobs: JobPosting[] = await page.evaluate(() => {
      const jobLinks = Array.from(
        document.querySelectorAll('a[href*="/jobs/"]')
      );
      const jobsMap = new Map();

      for (const link of jobLinks) {
        const href = (link as HTMLAnchorElement).href;
        const linkText = link.textContent?.trim() || '';

        if (!linkText) continue;

        // Extract company name from URL
        const urlMatch = href.match(/\/companies\/([^/]+)\/jobs\//);
        const companySlug = urlMatch ? urlMatch[1] : '';

        const company = companySlug
          ? companySlug
              .split('-')
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(' ')
          : 'Unknown Company';

        if (!jobsMap.has(href)) {
          jobsMap.set(href, {
            title: linkText,
            company: company,
            url: href,
            source: 'welcometothejungle',
          });
        }
      }

      return Array.from(jobsMap.values());
    });

    await page.close();
    logger.info(`Scraped ${jobs.length} jobs from Welcome to the Jungle`);
    return jobs.slice(0, MAX_JOBS); // Limit to max jobs
  } catch (error) {
    logger.error('Error scraping Welcome to the Jungle:', error);
    return [];
  }
};

/**
 * Scrape LinkedIn with specific criteria
 */
export const scrapeLinkedIn = async (
  browser: Browser,
  criteria: ScrapeCriteria
): Promise<JobPosting[]> => {
  const keywords = criteria.jobTitle;
  const location = criteria.location || '';
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
    keywords
  )}&location=${encodeURIComponent(location)}`;

  try {
    const page: Page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for job listings to load
    try {
      await page.waitForSelector('.jobs-search__results-list', {
        timeout: 10000,
      });
    } catch (selectorError) {
      logger.warn('LinkedIn: Primary selectors not found');
      await page.waitForSelector('body', { timeout: 5000 });
    }

    // Extract job data from the search results
    const jobs: JobPosting[] = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('.job-search-card');
      return Array.from(jobElements).map((element) => {
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
          company: companyElement
            ? companyElement.textContent?.trim() || ''
            : '',
          location: locationElement
            ? locationElement.textContent?.trim() || ''
            : '',
          url: linkElement ? (linkElement as HTMLAnchorElement).href : '',
          description: '',
          source: 'linkedin',
        };
      });
    });

    await page.close();

    logger.info(`Found ${jobs.length} LinkedIn jobs`);

    // Limit to MAX_JOBS to avoid too many requests (or 5 for testing)
    const testLimit = process.env.TEST_MODE === 'true' ? 5 : MAX_JOBS;
    const limitedJobs = jobs.slice(0, Math.min(testLimit, jobs.length));

    // Fetch descriptions by visiting each job URL
    logger.info(
      `Fetching descriptions for ${limitedJobs.length} LinkedIn jobs...`
    );

    for (let i = 0; i < limitedJobs.length; i++) {
      const job = limitedJobs[i];
      if (!job || !job.url) continue;

      try {
        logger.info(
          `📖 Fetching description ${i + 1}/${limitedJobs.length}: ${job.title}`
        );

        const descPage = await browser.newPage();
        await descPage.setUserAgent(
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await descPage.goto(job.url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Try multiple selectors for LinkedIn job description
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
            // Try next selector
          }
        }

        job.description = description;

        if (!description || description.length < 100) {
          logger.warn(`⚠️ No description found for: ${job.title}`);
        }

        await descPage.close();

        // Delay between requests to be respectful
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
        );
      } catch (error) {
        logger.error(`❌ Error fetching description for ${job.title}:`, error);
      }
    }

    logger.info(`Scraped ${limitedJobs.length} jobs from LinkedIn`);
    return limitedJobs;
  } catch (error) {
    logger.error('Error scraping LinkedIn:', error);
    return [];
  }
};

/**
 * Get detailed job description from a job URL
 */
const getJobDescription = async (
  browser: Browser,
  jobUrl: string
): Promise<string> => {
  try {
    const page: Page = await browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    let description = '';

    if (jobUrl.includes('linkedin.com')) {
      try {
        // Wait for LinkedIn job description to load
        await page.waitForSelector('.show-more-less-html__markup', {
          timeout: 15000,
        });
        const descriptionElement = await page.$('.show-more-less-html__markup');

        if (descriptionElement) {
          description = await page.evaluate(
            (el) => el.textContent?.trim() || '',
            descriptionElement
          );
        }
      } catch (selectorError) {
        logger.warn(
          'LinkedIn: Primary description selector not found, trying fallbacks'
        );

        // Fallback selectors for LinkedIn
        const fallbackSelectors = [
          '.description__text',
          '[class*="description"]',
          '.job-view-layout',
          '[data-job-details]',
          'article',
        ];

        for (const selector of fallbackSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              description = await page.evaluate(
                (el) => el.textContent?.trim() || '',
                element
              );
              if (description && description.length > 50) {
                logger.info(
                  `LinkedIn: Found description with fallback selector: ${selector}`
                );
                break;
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }
    } else if (jobUrl.includes('welcometothejungle.com')) {
      try {
        await page.waitForSelector('#the-position-section', { timeout: 15000 });
        const descriptionElement = await page.$('#the-position-section');

        if (descriptionElement) {
          description = await page.evaluate(
            (el) => el.textContent?.trim() || '',
            descriptionElement
          );
        }
      } catch (selectorError) {
        // Fallback selectors
        const fallbackSelectors = [
          '[data-testid="job-description"]',
          '.sc-1g2uzm9-0',
          '[class*="description"]',
          '.job-description',
        ];

        for (const selector of fallbackSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              description = await page.evaluate(
                (el) => el.textContent?.trim() || '',
                element
              );
              if (description && description.length > 50) break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }
    }

    await page.close();

    if (description && description.length > 50) {
      logger.info(
        `✅ Successfully fetched description (${
          description.length
        } chars) from ${jobUrl.includes('linkedin') ? 'LinkedIn' : 'WTTJ'}`
      );
    } else {
      logger.warn(
        `❌ Failed to fetch description from ${jobUrl} (${description.length} chars)`
      );
    }

    return description;
  } catch (error) {
    logger.warn(`Could not fetch job description from ${jobUrl}:`, error);
    return '';
  }
};

/**
 * Scrape jobs for analysis based on user criteria
 */
export const scrapeJobsForAnalysis = async (
  criteria: ScrapeCriteria
): Promise<JobPosting[]> => {
  const browser = await createBrowser();

  try {
    logger.info(`🕷️ Starting job scraping for: ${criteria.jobTitle}`);

    // Scrape from both sources
    const [welcomeToTheJungleJobs, linkedInJobs] = await Promise.all([
      scrapeWelcomeToTheJungle(browser, criteria),
      scrapeLinkedIn(browser, criteria),
    ]);

    const allJobs = [...welcomeToTheJungleJobs, ...linkedInJobs];

    // Remove duplicates based on URL
    const uniqueJobs = allJobs.filter(
      (job, index, self) => index === self.findIndex((j) => j.url === job.url)
    );

    logger.info(`📊 Found ${uniqueJobs.length} unique jobs`);

    if (uniqueJobs.length === 0) {
      return [];
    }

    // Limit to max jobs configured
    const limitedJobs = uniqueJobs.slice(0, MAX_JOBS);

    // Fetch descriptions for jobs
    logger.info(`📄 Fetching descriptions for ${limitedJobs.length} jobs...`);
    for (let i = 0; i < limitedJobs.length; i++) {
      const job = limitedJobs[i];
      if (!job) continue;
      logger.info(
        `📖 Fetching description ${i + 1}/${limitedJobs.length}: ${job.title}`
      );
      const description = await getJobDescription(browser, job.url);
      job.description = description || job.title; // Fallback to title if description fails
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      );
    }

    // Return jobs directly, stateless
    return limitedJobs;
  } catch (error) {
    logger.error('Error in job scraping:', error);
    throw error;
  } finally {
    await closeBrowser(browser);
  }
};

export default {
  createBrowser,
  closeBrowser,
  scrapeJobsForAnalysis,
};
