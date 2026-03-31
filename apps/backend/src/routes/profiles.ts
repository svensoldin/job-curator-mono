import express, { Router } from 'express';
import * as ProfileService from '../services/profile/profile.service.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router: Router = express.Router();

router.use(requireAuth);

// GET /profiles/:userId
router.get('/:userId', async (req, res) => {
  if (req.params.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const profile = await ProfileService.getByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json({ data: profile });
  } catch (error) {
    logger.error('Failed to get profile:', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
});

// POST /profiles
router.post('/', async (req, res) => {
  try {
    const { hardConstraints, skillGraph, seniority, culturePreference, techStackWeights } =
      req.body;
    const profile = await ProfileService.createOrUpdate(req.user.id, {
      hardConstraints,
      skillGraph,
      seniority,
      culturePreference,
      techStackWeights,
    });
    return res.json({ data: profile });
  } catch (error) {
    logger.error('Failed to create or update profile:', error);
    return res.status(500).json({ error: 'Failed to create or update profile' });
  }
});

// DELETE /profiles/:userId
router.delete('/:userId', async (req, res) => {
  if (req.params.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await ProfileService.deleteByUserId(req.user.id);
    return res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete profile:', error);
    return res.status(500).json({ error: 'Failed to delete profile' });
  }
});

export default router;
