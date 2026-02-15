import { searchTaskManager } from '../services/search-task-manager.js';
import logger from '../utils/logger.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

/**
 * GET /jobs/status/:taskId
 * Get the status and progress of a search task
 */
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = searchTaskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Search task not found' });
    }

    return res.json({
      ...task,
      taskId: task.id,
      id: undefined,
    });
  } catch (error) {
    logger.error('Error getting task status:', error);
    return res.status(500).json({ error: 'Failed to get task status' });
  }
});

export default router;
