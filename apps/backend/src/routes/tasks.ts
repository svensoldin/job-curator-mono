import { SUPABASE_JOB_RESULTS_TABLE, SUPABASE_JOB_SEARCHES_TABLE } from 'constants/supabase.js';
import express, { type Router } from 'express';
import { supabase } from 'lib/supabase.js';
import { searchTaskManager } from 'services/search-task-manager.js';
import logger from 'utils/logger.js';

const router: Router = express.Router();

/**
 * POST /tasks
 * Get all the user's search tasks
 */
router.post('/', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json('Missing user information');

    const { data } = await supabase
      .from(SUPABASE_JOB_SEARCHES_TABLE)
      .select()
      .eq('user_id', userId);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    logger.error('Error getting task results:', error);
    return res.status(500).json({ error: 'Failed to get task results' });
  }
});

/**
 * GET /tasks/:taskId
 * Get one task by id
 */
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = searchTaskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Search task not found' });
    }

    if (task.status === 'pending' || task.status === 'processing') {
      // Stream response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      //@ts-expect-error Not all code paths return by design
      const intervalId = setInterval(() => {
        if (task.status === 'completed')
          return res.json({
            success: true,
            jobs: task.jobOffers || [],
          });
        res.write(`Task still in progress: ${task.progress}% done\n\n`);
      }, 20_000);

      req.on('close', () => {
        clearInterval(intervalId);
        res.end();
        console.log('Client disconnected');
      });
    }

    if (task.status === 'failed') {
      return res.status(500).json({
        error: 'Search task failed',
        message: task.error || 'Unknown error',
      });
    }

    const { data: jobOffers } = await supabase.from(SUPABASE_JOB_RESULTS_TABLE).select(taskId);

    return res.json({
      success: true,
      jobs: jobOffers || [],
    });
  } catch (error) {
    logger.error('Error getting task results:', error);
    return res.status(500).json({ error: 'Failed to get task results' });
  }
});
