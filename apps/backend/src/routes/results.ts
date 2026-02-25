import { SUPABASE_JOB_RESULTS_TABLE } from 'constants/supabase.js';
import express, { type Router } from 'express';
import { supabase } from 'lib/supabase.js';
import logger from 'utils/logger.js';

const router: Router = express.Router();

/**
 * GET /results/:taskId
 * Get the results of a search task by id
 */
router.get('/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId) return res.status(400).json('Missing search task info');

    const { data } = await supabase
      .from(SUPABASE_JOB_RESULTS_TABLE)
      .select()
      .eq('search_id', taskId);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    logger.error('Error getting task results:', error);
    return res.status(500).json({ error: 'Failed to get task results' });
  }
});

export default router;
