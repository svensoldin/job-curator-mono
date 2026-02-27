import express, { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as CacheService from '../services/cache/cache.service.js';
import type { GetMatchesOptions } from '../services/cache/cache.service.js';
import { runForUser } from '../services/matching/matching.pipeline.js';
import logger from '../utils/logger.js';

const router: Router = express.Router();

/** GET /matches/:userId — returns cached ranked matches for the authenticated user. */
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { limit, minScore, hiddenGemsOnly } = req.query;
    const options: GetMatchesOptions = {};
    if (limit !== undefined) options.limit = Math.max(1, Math.min(200, Number(limit) || 50));
    if (minScore !== undefined) options.minScore = Math.max(0, Math.min(100, Number(minScore) || 0));
    if (hiddenGemsOnly !== undefined) options.hiddenGemsOnly = hiddenGemsOnly === 'true';
    const matches = await CacheService.getMatchesForUser(req.params.userId, options);

    return res.json({ data: matches });
  } catch (err) {
    logger.error('GET /matches/:userId failed:', err);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

/** GET /matches/:userId/job/:jobId — returns a single match detail. */
router.get('/:userId/job/:jobId', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const match = await CacheService.getMatchDetail(
      req.params.userId,
      Number(req.params.jobId)
    );

    if (!match) return res.status(404).json({ error: 'Match not found' });
    return res.json({ data: match });
  } catch (err) {
    logger.error('GET /matches/:userId/job/:jobId failed:', err);
    return res.status(500).json({ error: 'Failed to fetch match detail' });
  }
});

/**
 * POST /matches/trigger/:userId — fire-and-forget pipeline run.
 * Returns 202 immediately; matching runs asynchronously in the background.
 */
router.post('/trigger/:userId', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    runForUser(req.params.userId).catch((err) =>
      logger.error(`Background matching failed for user ${req.params.userId}:`, err)
    );

    return res.status(202).json({ data: { message: 'Matching triggered' } });
  } catch (err) {
    logger.error('POST /matches/trigger/:userId failed:', err);
    return res.status(500).json({ error: 'Failed to trigger matching' });
  }
});

export default router;
