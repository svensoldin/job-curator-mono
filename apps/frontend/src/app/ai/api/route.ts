import { NextRequest } from 'next/server';

import { analyzeJobsWithAI, getScrapedJobs } from './utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobTitle, location, salary, skills } = body;

    if (!jobTitle || !location || !salary || !skills) {
      return new Response(
        'Missing required fields: jobTitle, location, salary, skills',
        {
          status: 400,
        }
      );
    }

    const scrapedJobs = await getScrapedJobs(body);

    if (scrapedJobs.length === 0) {
      return Response.json({
        success: false,
        error: 'No jobs found for your criteria',
        analyzedJobs: [],
      });
    }

    const analyzedJobs = await analyzeJobsWithAI(scrapedJobs, body);

    const sortedJobs = analyzedJobs.sort((a, b) => {
      const scoreA = a.aiScore || 0;
      const scoreB = b.aiScore || 0;
      return scoreB - scoreA;
    });

    return Response.json({
      success: true,
      body,
      analyzedJobs: sortedJobs,
      totalJobs: sortedJobs.length,
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return new Response('Internal server error', {
      status: 500,
    });
  }
}
