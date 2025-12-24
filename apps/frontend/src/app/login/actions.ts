'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { CALLBACK_API, HOME, LOGIN } from '@/routes';

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

export async function loginWithGitHub(clientOrigin?: string) {
  // Need to setup whitelisted URLs in Supabase dashboard
  // Authentication -> URL configuration
  const supabase = await createClient();

  const redirectUrl = `${clientOrigin}${CALLBACK_API}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    console.log('OAuth error:', error);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(LOGIN);
}
