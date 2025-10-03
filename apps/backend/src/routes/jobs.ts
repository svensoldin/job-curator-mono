import { scrapeJobsForAnalysis } from '../services/scraping.js';
import { analyzeAndRankJobs } from '../services/rule-based-analyzer.js';
import { ScrapeCriteria } from '../types.js';
import { logger } from '../utils/logger.js';
import express from 'express';

const router = express.Router();

/**
 * POST /jobs
 * Scrape jobs from LinkedIn and Welcome to the Jungle based on user criteria
 * Body params: jobTitle, location, skills, salary, limit (optional, defaults to 50)
 */
router.post('/', async (req, res) => {
  try {
    const { jobTitle, location, skills, salary, limit = 50 } = req.body;

    if (!jobTitle || !location) {
      res
        .status(400)
        .json({ error: 'Missing required parameters: title, location' });
      return;
    }

    // Build user criteria for rule-based analysis
    const userCriteria = {
      jobTitle,
      location,
      skills: skills || '',
      salary: salary || '',
    };

    logger.info(`Scraping jobs for title="${jobTitle}" location="${location}"`);
    const jobs = await scrapeJobsForAnalysis({ jobTitle, location });

    if (jobs.length === 0) {
      res.json({
        total_jobs: 0,
        jobs: [],
      });
      return;
    }

    // Apply rule-based analysis to get top N jobs (based on limit)
    logger.info(`Applying rule-based analysis to ${jobs.length} jobs`);
    const topJobs = analyzeAndRankJobs(jobs, userCriteria, limit);

    res.json({
      total_jobs: topJobs.length,
      jobs: topJobs.map((job) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        description: job.description,
        source: job.source,
        score: job.score,
      })),
    });
  } catch (error) {
    logger.error('Error scraping jobs:', error);
    res.status(500).json({ error: 'Failed to scrape jobs' });
    return;
  }
});

export default router;
