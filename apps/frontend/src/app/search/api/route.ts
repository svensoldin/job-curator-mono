import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateJobSearchInput, CreateJobResultInput } from '@/types/database';

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

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response('Unauthorized', {
        status: 401,
      });
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

    // Save search to Supabase
    const searchInput: CreateJobSearchInput = {
      user_id: user.id,
      job_title: jobTitle,
      location,
      skills,
      salary,
      total_jobs: sortedJobs.length,
    };

    const { data: search, error: searchError } = await supabase
      .from('job_searches')
      .insert(searchInput)
      .select()
      .single();

    if (searchError) {
      console.error('Error saving search:', searchError);
      // Continue even if save fails - user still gets results
    }

    // Save job results to Supabase
    if (search) {
      const jobResults: CreateJobResultInput[] = sortedJobs.map((job) => ({
        search_id: search.id,
        title: job.title,
        company: job.company,
        description: job.description || null,
        url: job.url,
        source: job.source,
        ai_score: job.aiScore || null,
      }));

      const { error: resultsError } = await supabase
        .from('job_results')
        .insert(jobResults);

      if (resultsError) {
        console.error('Error saving job results:', resultsError);
        // Continue even if save fails - user still gets results
      }
    }

    return Response.json({
      success: true,
      body,
      analyzedJobs: sortedJobs,
      totalJobs: sortedJobs.length,
      searchId: search?.id, // Return search ID so we can navigate to it
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return new Response('Internal server error', {
      status: 500,
    });
  }
}
