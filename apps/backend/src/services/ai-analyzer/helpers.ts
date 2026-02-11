import { Mistral } from '@mistralai/mistralai';
import { MODEL } from 'constants/ai-analyzer.js';
import dotenv from 'dotenv';

import type { UserCriteria, JobPosting } from 'types.js';
import logger from 'utils/logger.js';

dotenv.config();

const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) throw new Error('Missing MISTRAL_API_KEY env var');

const client = new Mistral({
  apiKey,
});

/**
 * Build AI prompt for job matching
 */
function buildAIPrompt(
  { skills, jobTitle, location, salary }: UserCriteria,
  jobDescription: string
): string {
  const skillsText = skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .join(', ');

  return `
Evaluate how well this job posting fits the user’s profile and give a score from 0–100.
User:

Title: ${jobTitle}

Skills: ${skillsText}

Location: ${location}

Desired salary: ${salary}
Job posting: ${jobDescription}
Consider:

Match between user’s title and the role.

Alignment of required and preferred skills.

Location or remote compatibility.

Salary fit (even if not specified, infer from context).

Overall relevance to the user’s background and experience level.

Output:
Score: X/100
`;
}

/**
 * Analyze a single job with AI
 */
export async function analyzeSingleJob(
  job: JobPosting,
  userCriteria: UserCriteria
): Promise<JobPosting> {
  try {
    logger.info(`🤖 Analyzing job: ${job.title} at ${job.company}`);

    const prompt = buildAIPrompt(userCriteria, job.description);

    const chatResponse = await client.chat.complete({
      model: MODEL,
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

    logger.info(`📊 Raw AI response for "${job.title}": ${scoreText}`);

    let aiScore: number | null = null;
    if (scoreText) {
      // Try to extract number from various formats
      const scoreMatch = scoreText.match(/(\d+)(?:\/100)?/);
      if (scoreMatch && scoreMatch[1]) {
        aiScore = parseInt(scoreMatch[1], 10);
      }
    }

    logger.info(`✅ Final score for "${job.title}": ${aiScore}`);

    return { ...job, score: aiScore || 0 };
  } catch (error) {
    logger.error(`❌ Error analyzing job "${job.title}":`, error);
    return { ...job, score: 0 };
  }
}
