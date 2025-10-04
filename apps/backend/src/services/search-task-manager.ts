import { JobPosting, ScrapeCriteria, UserCriteria } from '../types.js';
import { logger } from '../utils/logger.js';
import { analyzeAndRankJobs } from './rule-based-analyzer.js';
import { scrapeJobsForAnalysis } from './scraping.js';

/**
 * Represents a search task for job offers
 */
interface SearchTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  criteria: UserCriteria;
  jobOffers?: JobPosting[]; // Use 'jobOffers' to be clear these are job postings
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
  createTask(criteria: UserCriteria): string {
    const id = `search_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const task: SearchTask = {
      id,
      status: 'pending',
      progress: 0,
      message: 'Search task queued',
      criteria,
      createdAt: new Date(),
    };

    this.tasks.set(id, task);
    this.taskQueue.push(id);

    logger.info(`Created search task ${id} for "${criteria.jobTitle}"`);

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
    // Prevent multiple queue processors
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

      // Update status to processing
      task.status = 'processing';
      task.progress = 5;
      task.message = 'Starting job offer search...';

      // Build scrape criteria from user criteria
      const scrapeCriteria: ScrapeCriteria = {
        jobTitle: task.criteria.jobTitle,
        location: task.criteria.location,
      };

      // Scrape job offers from job boards
      task.progress = 10;
      task.message = 'Scraping job boards (LinkedIn, Welcome to the Jungle)...';
      logger.info(`Task ${task.id}: Starting to scrape job boards`);

      const scrapedJobOffers = await scrapeJobsForAnalysis(scrapeCriteria);

      // Update progress after scraping completes
      task.progress = 70;
      task.message = `Scraped ${scrapedJobOffers.length} job offers`;

      // Check if any job offers were found
      if (scrapedJobOffers.length === 0) {
        task.status = 'completed';
        task.progress = 100;
        task.message = 'No job offers found matching your criteria';
        task.jobOffers = [];
        task.completedAt = new Date();
        logger.info(`Task ${task.id} completed with no results`);
        return;
      }

      // Analyze and rank job offers
      task.progress = 75;
      task.message = `Analyzing ${scrapedJobOffers.length} job offers...`;
      logger.info(
        `Task ${task.id}: Analyzing ${scrapedJobOffers.length} job offers`
      );

      const rankedJobOffers = analyzeAndRankJobs(
        scrapedJobOffers,
        task.criteria,
        10
      );

      // Task completed successfully
      task.status = 'completed';
      task.progress = 100;
      task.message = `Found ${rankedJobOffers.length} matching job offers`;
      task.jobOffers = rankedJobOffers;
      task.completedAt = new Date();

      logger.info(
        `Task ${task.id} completed successfully with ${rankedJobOffers.length} results`
      );
    } catch (error) {
      logger.error(`Task ${task.id} failed:`, error);

      task.status = 'failed';
      task.progress = 0;
      task.message = 'Search task failed';
      task.error =
        error instanceof Error ? error.message : 'Unknown error occurred';
      task.completedAt = new Date();
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

// Singleton instance
export const searchTaskManager = new SearchTaskManager();

// Cleanup old tasks every 30 minutes
setInterval(() => {
  searchTaskManager.cleanup();
}, 30 * 60 * 1000);
