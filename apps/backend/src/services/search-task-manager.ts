import {
  SUPABASE_JOB_RESULTS_TABLE,
  SUPABASE_JOB_SEARCHES_TABLE,
  SUPABASE_SCRAPED_JOBS_TABLE,
} from 'constants/search-task-manager.js';
import { type CreateJobResultInput, supabase } from '../lib/supabase.js';

import type { JobPosting, UserCriteria } from '../types.js';
import logger from '../utils/logger.js';
import { analyzeAndRankJobs } from './ai-analyzer/ai-analyzer.js';

/**
 * Represents a search task for job offers
 */
interface SearchTask {
  id: string;
  userId: string;
  searchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  criteria: UserCriteria;
  jobOffers?: JobPosting[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Manages async search tasks for scraping and analyzing job offers
 */
class SearchTaskManager {
  private tasks = new Map<string, SearchTask>();
  private taskQueue: string[] = [];
  private isProcessing = false;

  /**
   * Create a new search task
   */
  createTask(criteria: UserCriteria, userId: string, searchId: string): string {
    const id = `search_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const task: SearchTask = {
      id,
      userId,
      searchId,
      status: 'pending',
      progress: 0,
      message: 'Search task queued',
      criteria,
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    this.taskQueue.push(id);

    logger.info(
      `Created search task ${id} for user ${userId}, search ${searchId}, "${criteria.jobTitle}"`
    );

    // Start processing if not already running
    this.processQueue();

    return id;
  }

  /**
   * Get search task by ID
   */
  getTask(id: string): SearchTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks (for debugging)
   */
  getAllTasks(): SearchTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Process tasks in the queue sequentially
   */
  private async processQueue() {
    if (this.isProcessing) {
      logger.info('Queue processor already running');
      return;
    }

    this.isProcessing = true;
    logger.info('Starting queue processor');

    while (this.taskQueue.length > 0) {
      const taskId = this.taskQueue.shift();
      if (!taskId) continue;

      const task = this.tasks.get(taskId);
      if (!task) {
        logger.warn(`Task ${taskId} not found in map`);
        continue;
      }

      await this.processTask(task);
    }

    this.isProcessing = false;
    logger.info('Queue processor finished');
  }

  /**
   * Process a single search task
   */
  private async processTask(task: SearchTask) {
    try {
      logger.info(`Processing search task ${task.id}`);

      task.status = 'processing';
      task.progress = 5;
      task.message = `Fetching job offers...`;
      const { data: scrapedJobs } = await supabase.from(SUPABASE_SCRAPED_JOBS_TABLE).select('*');
      if (!scrapedJobs) throw new Error('Error fetching scraped jobs from Supabase');
      task.progress = 50;
      task.message = 'Analyzing job offers with AI...';
      logger.info(`Task ${task.id}: Analyzing job offers with AI`);

      const rankedJobOffers = await analyzeAndRankJobs(scrapedJobs, task.criteria);

      task.progress = 90;
      task.message = 'Saving results to database...';
      logger.info(`Task ${task.id}: Saving ${rankedJobOffers.length} results to Supabase`);

      try {
        const { error: updateError } = await supabase
          .from(SUPABASE_JOB_SEARCHES_TABLE)
          .update({ total_jobs: rankedJobOffers.length })
          .eq('id', task.searchId);

        if (updateError) {
          logger.error(`Task ${task.id}: Failed to update search record:`, updateError);
          throw updateError;
        }

        if (rankedJobOffers.length > 0) {
          const jobResults: CreateJobResultInput[] = rankedJobOffers.map((job) => ({
            search_id: task.searchId,
            title: job.title,
            company: job.company,
            description: job.description || null,
            url: job.url,
            source: job.source,
            ai_score: job.score || null,
          }));

          const { error: insertError } = await supabase
            .from(SUPABASE_JOB_RESULTS_TABLE)
            .insert(jobResults);

          if (insertError) {
            logger.error(`Task ${task.id}: Failed to insert job results:`, insertError);
            throw insertError;
          }
        }

        logger.info(
          `Task ${task.id}: Successfully saved ${rankedJobOffers.length} results to Supabase`
        );
      } catch (dbError) {
        logger.error(`Task ${task.id}: Database error:`, dbError);
        // Continue with task completion even if DB save fails
        // Client can still see results via the task API
      }

      task.status = 'completed';
      task.progress = 100;
      task.message = `Found ${rankedJobOffers.length} matching job offers`;
      task.jobOffers = rankedJobOffers;
      task.completedAt = new Date();

      logger.info(`Task ${task.id} completed successfully with ${rankedJobOffers.length} results`);
    } catch (error) {
      logger.error(`Task ${task.id} failed:`, error);

      task.status = 'failed';
      task.progress = 0;
      task.message = 'Search task failed';
      task.error = error instanceof Error ? error.message : 'Unknown error occurred';
      task.completedAt = new Date();

      try {
        const { error: failUpdateError } = await supabase
          .from(SUPABASE_JOB_SEARCHES_TABLE)
          .update({ total_jobs: -1 })
          .eq('id', task.searchId);

        if (failUpdateError) {
          logger.warn(
            `Task ${task.id}: Could not mark search record as failed (-1):`,
            failUpdateError
          );
        }
      } catch (statusErr) {
        logger.warn(`Task ${task.id}: Error while writing failed marker to DB:`, statusErr);
      }
    }
  }

  /**
   * Cleanup completed tasks older than 1 hour
   */
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, task] of this.tasks.entries()) {
      if (task.completedAt && task.completedAt < oneHourAgo) {
        this.tasks.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} old search tasks`);
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      processing: tasks.filter((t) => t.status === 'processing').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
      queueLength: this.taskQueue.length,
    };
  }
}

export const searchTaskManager = new SearchTaskManager();

setInterval(
  () => {
    searchTaskManager.cleanup();
  },
  30 * 60 * 1000
);
