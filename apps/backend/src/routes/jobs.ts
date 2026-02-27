import express, { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { SUPABASE_SCRAPED_JOBS_TABLE } from '../constants/supabase.js';
import logger from '../utils/logger.js';

const router: Router = express.Router();

/**
 * GET /jobs — returns scraped jobs with optional filtering.
 * Query params: location?, source?, limit? (default 50), offset? (default 0)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { location, source } = req.query;
    const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    let query = supabase
      .from(SUPABASE_SCRAPED_JOBS_TABLE)
      .select('id,title,company,location,url,source,structured_summary,created_at')
      .range(offset, offset + limit - 1);

    if (typeof location === 'string' && location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (typeof source === 'string' && source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.json({ data: data ?? [] });
  } catch (err) {
    logger.error('GET /jobs failed:', err);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

export default router;
