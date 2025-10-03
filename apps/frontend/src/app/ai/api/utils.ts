import { UserCriteria } from '../../../types/user-criteria';
import { Mistral } from '@mistralai/mistralai';
import * as dotenv from 'dotenv';

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
}

export async function getScrapedJobs(
  userCriteria: UserCriteria
): Promise<JobPosting[]> {
  const baseUrl = process.env.JOB_SCRAPER_URL;

  try {
    const response = await fetch(`${baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userCriteria,
        limit: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch jobs: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return data.jobs;
  } catch (error) {
    console.error('Error fetching scraped jobs:', error);
    return [];
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

Be strict about experience level mismatches (intern vs experienced roles).

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
