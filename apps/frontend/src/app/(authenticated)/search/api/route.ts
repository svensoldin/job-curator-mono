import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobTitle, location, salary, skills } = body;

    if (!jobTitle || !location || !salary || !skills) {
      return new Response('Missing required fields: jobTitle, location, salary, skills', {
        status: 400,
      });
    }

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

    const baseUrl = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;
    const startResponse = await fetch(`${baseUrl}/jobs/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        jobTitle,
        location,
        skills,
        salary,
      }),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('Backend API error:', errorText);
      return new Response('Failed to start search task', {
        status: startResponse.status,
      });
    }

    const data = await startResponse.json();

    return Response.json({
      success: true,
      pending: true,
      searchId: data.searchId,
      taskId: data.taskId,
      message: 'Search task started. Check your dashboard for results.',
    });
  } catch (error) {
    console.error('Error starting search task:', error);
    return new Response('Internal server error', {
      status: 500,
    });
  }
}

export interface SearchApiResponse {
  success: boolean;
  pending: boolean;
  searchId: string;
  taskId: string;
  message: string;
}
