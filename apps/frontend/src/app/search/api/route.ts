import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateJobSearchInput } from '@/types/database';

import { startSearchTask } from './utils';

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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response('Unauthorized', {
        status: 401,
      });
    }

    // Create a pending search record in the database
    const searchInput: CreateJobSearchInput = {
      user_id: user.id,
      job_title: jobTitle,
      location,
      skills,
      salary,
      total_jobs: 0, // Will be updated when task completes
    };

    const { data: search, error: searchError } = await supabase
      .from('job_searches')
      .insert(searchInput)
      .select()
      .single();

    if (searchError) {
      console.error('Error saving search:', searchError);
      return new Response('Failed to create search', {
        status: 500,
      });
    }

    // Start the async task and return immediately
    const taskId = await startSearchTask(body, search.id, user.id);

    return Response.json({
      success: true,
      pending: true,
      searchId: search.id,
      taskId,
      message: 'Search task started. Check your dashboard for results.',
    });
  } catch (error) {
    console.error('Error starting search task:', error);
    return new Response('Internal server error', {
      status: 500,
    });
  }
}
