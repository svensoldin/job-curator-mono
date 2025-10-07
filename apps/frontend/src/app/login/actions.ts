'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { CALLBACK_API, HOME } from '@/routes';

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.log(error);
    return { error: error.message };
  }

  revalidatePath(HOME, 'layout');
  redirect(HOME);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: signUpData, error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  // Check if email confirmation is required
  if (signUpData?.user && !signUpData.session) {
    return {
      success: true,
      message:
        'Please check your email to confirm your account before signing in.',
      requiresEmailConfirmation: true,
    };
  }

  revalidatePath(HOME, 'layout');
  redirect(HOME);
}

export async function loginWithGitHub() {
  const supabase = await createClient();

  // Get the url from headers
  const headersList = await headers();
  const origin = headersList.get('origin');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}${CALLBACK_API}`,
    },
  });

  if (error) {
    console.log(error);
  }

  if (data.url) {
    redirect(data.url);
  }
}
