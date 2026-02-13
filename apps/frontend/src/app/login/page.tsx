'use client';

import { type SubmitEvent, useState } from 'react';
import Link from 'next/link';
import { login, signup, loginWithGitHub } from './actions';
import { AuthHeader, SocialLoginButton } from '@/components/forms';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import { LuGithub } from 'react-icons/lu';
import clsx from 'clsx';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
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
          setSuccessMessage(result.message || 'Please check your email to confirm your account.');
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
    try {
      await loginWithGitHub(window.location.origin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub login failed');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-gray-400">
            {isSignUp ? 'Sign up to start your job search' : 'Sign in to continue your job search'}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <Input type="email" name="email" placeholder="dom.cobb@dreams-inc.com" label="Email" />
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            label="Password"
            className="mt-4"
          />
          <Button type="submit" onClick={() => handleSubmit} className="mt-4 w-full">
            Sign {isSignUp ? 'Up' : 'In'}
          </Button>
          <hr className="my-4 border-t border-gray-600" aria-hidden />
        </form>
        <Button
          onClick={handleGithubLogin}
          disabled={isLoading}
          variant="secondary"
          className="w-full"
        >
          <LuGithub className="mr-2" size="20px" />
          Continue with GitHub
        </Button>
        <hr className="my-4 border-t border-gray-600" aria-hidden />
        <p>
          {isSignUp ? 'Already' : "Don't"} have an account?{' '}
          <button
            onClick={() => setIsSignUp((prev) => !prev)}
            className="text-blue-500 cursor-pointer"
          >
            Sign {isSignUp ? 'in' : 'up'}
          </button>
        </p>
      </div>
    </main>
  );
}
