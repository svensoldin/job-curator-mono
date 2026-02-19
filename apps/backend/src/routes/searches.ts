import { SUPABASE_JOB_SEARCHES_TABLE } from 'constants/supabase.js';
import express, { type Router } from 'express';
import { type CreateJobSearchInput, supabase } from 'lib/supabase.js';
import { searchTaskManager } from 'services/search-task-manager.js';
import logger from 'utils/logger.js';

const router: Router = express.Router();

/**
 * POST /searches
 * Get all the user's searches
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
 * GET /searches
 * Get all the searches from db
 */
router.get('/', async (req, res) => {
  try {
    const { data } = await supabase.from(SUPABASE_JOB_SEARCHES_TABLE).select('*');

    return res.status(200).json({
      data,
    });
  } catch (error) {
    logger.error('Error getting task results:', error);
    return res.status(500).json({ error: 'Failed to get task results' });
  }
});

/**
 * POST /searches/create
 * Start an async search task for job offers
 * Creates a job_searches record in Supabase and returns taskId + searchId
 * Body params: userId, jobTitle, location, skills, salary
 */
router.post('/create', async (req, res) => {
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
      statusUrl: `/tasks/status/${taskId}`,
      resultsUrl: `/tasks/${taskId}`,
    });
  } catch (error) {
    logger.error('Error creating search task:', error);
    return res.status(500).json({ error: 'Failed to create search task' });
  }
});

/**
 * GET /searches/:searchId
 * Get a single search by id
 */
router.get('/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    // const task = searchTaskManager.getTask(taskId);

    // if (!task) {
    //   return res.status(404).json({ error: 'Search task not found' });
    // }

    // if (task.status === 'pending' || task.status === 'processing') {
    //   // Stream response
    //   res.setHeader('Content-Type', 'text/event-stream');
    //   res.setHeader('Cache-Control', 'no-cache');
    //   res.setHeader('Connection', 'keep-alive');
    //   res.flushHeaders();

    //   //@ts-expect-error Not all code paths return by design
    //   const intervalId = setInterval(() => {
    //     if (task.status === 'completed')
    //       return res.json({
    //         success: true,
    //         jobs: task.jobOffers || [],
    //       });
    //     res.write(`Task still in progress: ${task.progress}% done\n\n`);
    //   }, 20_000);

    //   req.on('close', () => {
    //     clearInterval(intervalId);
    //     res.end();
    //     console.log('Client disconnected');
    //   });
    // }

    // if (task.status === 'failed') {
    //   return res.status(500).json({
    //     error: 'Search task failed',
    //     message: task.error || 'Unknown error',
    //   });
    // }

    const { data } = await supabase.from(SUPABASE_JOB_SEARCHES_TABLE).select().eq('id', searchId);

    return res.status(200).json({
      data,
    });
  } catch (error) {
    logger.error('Error getting task results:', error);
    return res.status(500).json({ error: 'Failed to get task results' });
  }
});

export default router;
