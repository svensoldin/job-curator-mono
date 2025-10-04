import { searchTaskManager } from '../services/search-task-manager.js';
import { logger } from '../utils/logger.js';
import express from 'express';

const router = express.Router();

/**
 * POST /jobs/start
 * Start an async search task for job offers
 * Returns immediately with a task ID that can be polled for status
 * Body params: jobTitle, location, skills, salary
 */
router.post('/start', async (req, res) => {
  try {
    const { jobTitle, location, skills, salary } = req.body;

    if (!jobTitle || !location) {
      return res.status(400).json({
        error: 'Missing required parameters: jobTitle, location',
      });
    }

    // Build user criteria
    const userCriteria = {
      jobTitle,
      location,
      skills: skills || '',
      salary: salary || '',
    };

    // Create async search task
    const taskId = searchTaskManager.createTask(userCriteria);

    logger.info(
      `Created search task ${taskId} for "${jobTitle}" in "${location}"`
    );

    return res.json({
      success: true,
      taskId,
      message: 'Search task created successfully',
      statusUrl: `/jobs/status/${taskId}`,
      resultsUrl: `/jobs/results/${taskId}`,
    });
  } catch (error) {
    logger.error('Error creating search task:', error);
    return res.status(500).json({ error: 'Failed to create search task' });
  }
});

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
      taskId: task.id,
      status: task.status,
      progress: task.progress,
      message: task.message,
      error: task.error,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    });
  } catch (error) {
    logger.error('Error getting task status:', error);
    return res.status(500).json({ error: 'Failed to get task status' });
  }
});

/**
 * GET /jobs/results/:taskId
 * Get the results of a completed search task
 */
router.get('/results/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = searchTaskManager.getTask(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Search task not found' });
    }

    if (task.status === 'pending' || task.status === 'processing') {
      return res.status(400).json({
        error: 'Search task not completed yet',
        status: task.status,
        progress: task.progress,
        message: task.message,
      });
    }

    if (task.status === 'failed') {
      return res.status(500).json({
        error: 'Search task failed',
        message: task.error || 'Unknown error',
      });
    }

    // Task is completed - return job offers
    return res.json({
      success: true,
      total_jobs: task.jobOffers?.length || 0,
      jobs: task.jobOffers || [],
    });
  } catch (error) {
    logger.error('Error getting task results:', error);
    return res.status(500).json({ error: 'Failed to get task results' });
  }
});

/**
 * GET /jobs/stats
 * Get queue statistics (for monitoring/debugging)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = searchTaskManager.getStats();
    return res.json(stats);
  } catch (error) {
    logger.error('Error getting stats:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
