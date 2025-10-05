import { UserCriteria } from '../../../types/user-criteria';
import { Mistral } from '@mistralai/mistralai';
import * as dotenv from 'dotenv';
import { createClient } from '@/lib/supabase/server';
import { CreateJobResultInput } from '@/types/database';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

export interface JobPosting {
  source: string;
  title: string;
  company: string;
  description: string;
  url: string;
  score?: number;
  aiScore?: number | null;
}

/**
 * Start an async search task and return the taskId immediately
 * The processing continues in the background
 */
export async function startSearchTask(
  userCriteria: UserCriteria,
  searchId: string,
  userId: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;

  // Step 1: Create the search task
  const startResponse = await fetch(`${baseUrl}/jobs/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userCriteria),
  });

  if (!startResponse.ok) {
    throw new Error(
      `Failed to start search task: ${startResponse.status} ${startResponse.statusText}`
    );
  }

  const { taskId } = await startResponse.json();
  console.log(`Search task created with ID: ${taskId}`);

  // Step 2: Start background processing (don't await)
  processTaskInBackground(taskId, searchId, userId, userCriteria).catch(
    (error) => {
      console.error('Background task processing failed:', error);
    }
  );

  return taskId;
}

/**
 * Process the task in the background and update the database when complete
 */
async function processTaskInBackground(
  taskId: string,
  searchId: string,
  userId: string,
  userCriteria: UserCriteria
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;
  const maxAttempts = 120; // 10 minutes maximum
  const pollInterval = 10_000; // Poll every 10 seconds

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Check task status
      const statusResponse = await fetch(`${baseUrl}/jobs/status/${taskId}`);

      if (!statusResponse.ok) {
        throw new Error(`Failed to get task status: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      console.log(
        `Task ${taskId}: ${status.status} - ${status.message} (${status.progress}%)`
      );

      if (status.status === 'completed') {
        // Get the results
        const resultsResponse = await fetch(
          `${baseUrl}/jobs/results/${taskId}`
        );

        if (!resultsResponse.ok) {
          throw new Error(`Failed to get results: ${resultsResponse.status}`);
        }

        const data = await resultsResponse.json();
        const scrapedJobs: JobPosting[] = data.jobs || [];

        // Analyze jobs with AI
        const analyzedJobs = await analyzeJobsWithAI(scrapedJobs, userCriteria);

        // Sort and save to database
        const sortedJobs = analyzedJobs.sort((a, b) => {
          const scoreA = a.aiScore || 0;
          const scoreB = b.aiScore || 0;
          return scoreB - scoreA;
        });

        // Update the search record
        const supabase = await createClient();
        await supabase
          .from('job_searches')
          .update({ total_jobs: sortedJobs.length })
          .eq('id', searchId);

        // Save job results
        if (sortedJobs.length > 0) {
          const jobResults: CreateJobResultInput[] = sortedJobs.map((job) => ({
            search_id: searchId,
            title: job.title,
            company: job.company,
            description: job.description || null,
            url: job.url,
            source: job.source,
            ai_score: job.aiScore || null,
          }));

          await supabase.from('job_results').insert(jobResults);
        }

        console.log(`Task ${taskId} completed and saved to database`);
        return;
      } else if (status.status === 'failed') {
        throw new Error(
          `Search task failed: ${status.error || 'Unknown error'}`
        );
      }
    }

    throw new Error('Search task timed out after 10 minutes');
  } catch (error) {
    console.error('Error processing task in background:', error);
    // Optionally: Update the search record with an error status
  }
}

export async function getScrapedJobs(
  userCriteria: UserCriteria
): Promise<JobPosting[]> {
  const baseUrl = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;

  try {
    console.log('Starting async job search task...');

    // Step 1: Create the search task
    const startResponse = await fetch(`${baseUrl}/jobs/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCriteria),
    });

    if (!startResponse.ok) {
      throw new Error(
        `Failed to start search task: ${startResponse.status} ${startResponse.statusText}`
      );
    }

    const { taskId } = await startResponse.json();
    console.log(`Search task created with ID: ${taskId}`);

    // Step 2: Poll for task completion
    const maxAttempts = 120; // 10 minutes maximum (5 second intervals)
    const pollInterval = 10_000; // Poll every 10 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Wait before polling
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Check task status
      const statusResponse = await fetch(`${baseUrl}/jobs/status/${taskId}`);

      if (!statusResponse.ok) {
        throw new Error(`Failed to get task status: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      console.log(
        `Task ${taskId}: ${status.status} - ${status.message} (${status.progress}%)`
      );

      if (status.status === 'completed') {
        const resultsResponse = await fetch(
          `${baseUrl}/jobs/results/${taskId}`
        );

        if (!resultsResponse.ok) {
          throw new Error(`Failed to get results: ${resultsResponse.status}`);
        }

        const data = await resultsResponse.json();
        console.log(`Task completed with ${data.total_jobs} job offers`);
        return data.jobs || [];
      } else if (status.status === 'failed') {
        throw new Error(
          `Search task failed: ${status.error || 'Unknown error'}`
        );
      }

      // Task is still processing, continue polling
    }

    // If we get here, the task timed out
    throw new Error(
      'Search task timed out after 10 minutes. Please try again with narrower search criteria.'
    );
  } catch (error) {
    console.error('Error in async job search:', error);
    throw error; // Re-throw to be handled by caller
  }
}

function buildAIPrompt(userCriteria: UserCriteria, jobDescription: string) {
  const skillsText = userCriteria.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .join(', ');
  return `Rate job match (0-100, be strict):

Candidate: ${userCriteria.jobTitle}, skills: ${skillsText}, location: ${
    userCriteria.location
  }, salary: ${userCriteria.salary}k€

Job: ${jobDescription.substring(0, 1000)}

**Strict Scoring:**
- 90-100: Perfect match - exact role, all skills, right level
- 70-89: Good match - similar role, most skills match, right level  
- 50-69: Decent match - some overlap but missing key elements
- 30-49: Poor match - wrong level (intern vs senior) or major skill gaps
- 0-29: No match - completely different role or requirements

Be very strict about experience level mismatches (internship (stage in French job offers) vs experienced roles).

Score only:`;
}

export async function analyzeJobsWithAI(
  jobs: JobPosting[],
  userCriteria: UserCriteria
) {
  const model = 'mistral-small-latest';
  return await Promise.all(
    jobs.map(async (job) => {
      try {
        const prompt = buildAIPrompt(userCriteria, job.description);

        const chatResponse = await client.chat.complete({
          model,
          messages: [{ role: 'user', content: prompt }],
        });

        let scoreText: string | null = null;
        const content = chatResponse.choices?.[0]?.message?.content;

        if (typeof content === 'string') {
          scoreText = content.trim();
        } else if (Array.isArray(content)) {
          scoreText = content
            .map((chunk) => (typeof chunk === 'string' ? chunk : ''))
            .join('')
            .trim();
        }

        const aiScore = scoreText ? parseInt(scoreText, 10) : null;

        return { ...job, aiScore };
      } catch (error) {
        console.error('Error analyzing job:', error);
        return { ...job, aiScore: null };
      }
    })
  );
}
