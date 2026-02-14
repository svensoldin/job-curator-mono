import { SUPABASE_JOB_SEARCHES_TABLE } from 'constants/supabase.js';
import { type CreateJobSearchInput, supabase } from '../lib/supabase.js';
import { searchTaskManager } from '../services/search-task-manager.js';
import logger from '../utils/logger.js';
import express, { type Router } from 'express';

const router: Router = express.Router();

/**
 * POST /jobs/start
 * Start an async search task for job offers
 * Creates a job_searches record in Supabase and returns taskId + searchId
 * Body params: userId, jobTitle, location, skills, salary
 */
router.post('/start', async (req, res) => {
  try {
    if (!req.body) return res.status(400).json('Missing request body');

    const { userId, jobTitle, location, skills, salary } = req.body;

    if (!userId || !jobTitle || !location || !skills || !salary) {
      return res.status(400).json({
        error: 'Missing required body params: userId, jobTitle, location, salary, skills',
      });
    }

    const searchInput: CreateJobSearchInput = {
      user_id: userId,
      job_title: jobTitle,
      location,
      skills,
      salary: (parseInt(salary) || 0).toString(),
    };

    const { data: search, error: dbError } = await supabase
      .from(SUPABASE_JOB_SEARCHES_TABLE)
      .insert(searchInput)
      .select()
      .single();

    if (dbError || !search) {
      logger.error('Failed to create search record in Supabase:', dbError);
      return res.status(500).json({
        error: 'Failed to create search record',
      });
    }

    logger.info(`Created Supabase search record ${search.id} for user ${userId}`);

    const taskId = searchTaskManager.createTask(
      {
        jobTitle,
        location,
        skills,
        salary,
      },
      userId,
      search.id
    );

    logger.info(
      `Created search task ${taskId} for "${jobTitle}" in "${location}" (search ID: ${search.id})`
    );

    return res.json({
      success: true,
      taskId,
      searchId: search.id,
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
