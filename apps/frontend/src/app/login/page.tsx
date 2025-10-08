'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login, signup, loginWithGitHub } from './actions';
import { Input, Button, Alert, Card } from '@/components/ui';
import { AuthHeader, SocialLoginButton } from '@/components/forms';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      if (isSignUp) {
        const result = await signup(formData);
        if (result?.error) {
          setError(result.error);
          setIsLoading(false);
        } else if (result?.requiresEmailConfirmation) {
          setSuccessMessage(
            result.message || 'Please check your email to confirm your account.'
          );
          setIsLoading(false);
        }
      } else {
        const result = await login(formData);
        if (result?.error) {
          setError(result.error);
          setIsLoading(false);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'NEXT_REDIRECT') {
        setError(err.message);
        setIsLoading(false);
      }
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    const origin = window.location.origin;
    console.log('[Client] Calling loginWithGitHub with origin:', origin);
    
    try {
      const result = await loginWithGitHub(origin);
      
      if (result?.error) {
        console.error('[Client] Server action returned error:', result.error);
        setError(result.error);
        setIsLoading(false);
      }
      // If successful, redirect happens server-side
    } catch (err) {
      console.error('[Client] Exception during GitHub login:', err);
      setError(err instanceof Error ? err.message : 'GitHub login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <AuthHeader isSignUp={isSignUp} />

        <Card padding='lg'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <Input
              id='email'
              name='email'
              type='email'
              label='Email address'
              autoComplete='email'
              placeholder='you@example.com'
              required
              disabled={isLoading}
            />

            <Input
              id='password'
              name='password'
              type='password'
              label='Password'
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder='••••••••'
              required
              disabled={isLoading}
            />

            {error && <Alert type='error' message={error} />}

            {successMessage && (
              <Alert
                type='success'
                title='Account created successfully!'
                message={successMessage}
              />
            )}

            <Button
              type='submit'
              variant='primary'
              size='lg'
              isLoading={isLoading}
              disabled={isLoading}
              className='w-full'
            >
              {isSignUp ? 'Sign up' : 'Sign in'}
            </Button>
          </form>

          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200 dark:border-gray-700'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
                Or continue with
              </span>
            </div>
          </div>

          <SocialLoginButton
            provider='github'
            isLoading={isLoading}
            onClick={handleGithubLogin}
          />

          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              disabled={isLoading}
              className='w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <span className='font-medium text-blue-600 dark:text-blue-400'>
                    Sign in
                  </span>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <span className='font-medium text-blue-600 dark:text-blue-400'>
                    Sign up
                  </span>
                </>
              )}
            </button>
          </div>
        </Card>

        <div className='text-center mt-6'>
          <Link
            href='/'
            className='text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center'
          >
            <svg
              className='w-4 h-4 mr-1'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
              />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
