import express, { Router, type Request, type Response, type NextFunction } from 'express';
import scrapeJobs, { SCRAPE_CRITERIA } from '../services/scraper/scraper.js';
import { processPendingSummaries } from '../services/job-summary/job-summary.service.js';
import { processUnembeddedJobs } from '../services/embedding/embedding.service.js';
import { runForAllUsers } from '../services/matching/matching.pipeline.js';
import logger from '../utils/logger.js';

const router: Router = express.Router();

/**
 * Validates the `x-cron-secret` header against the `CRON_SECRET` env var.
 * Returns 401 if the header is missing or does not match.
 */
function cronAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

/** POST /cron/scrape — runs the job scraper. */
router.post('/scrape', cronAuthMiddleware, async (_req, res) => {
  try {
    await scrapeJobs(SCRAPE_CRITERIA);
    return res.json({ data: { message: 'ok' } });
  } catch (err) {
    logger.error('POST /cron/scrape failed:', err);
    return res.status(500).json({ error: 'Scrape failed' });
  }
});

/** POST /cron/process-jobs — summarizes then embeds pending jobs (up to 50 each). */
router.post('/process-jobs', cronAuthMiddleware, async (_req, res) => {
  try {
    await processPendingSummaries(50);
    await processUnembeddedJobs(50);
    return res.json({ data: { message: 'ok' } });
  } catch (err) {
    logger.error('POST /cron/process-jobs failed:', err);
    return res.status(500).json({ error: 'Job processing failed' });
  }
});

/** POST /cron/run-matching — runs the matching pipeline for all users. */
router.post('/run-matching', cronAuthMiddleware, async (_req, res) => {
  try {
    await runForAllUsers();
    return res.json({ data: { message: 'ok' } });
  } catch (err) {
    logger.error('POST /cron/run-matching failed:', err);
    return res.status(500).json({ error: 'Matching failed' });
  }
});

export default router;
