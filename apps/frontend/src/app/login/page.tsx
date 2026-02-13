'use client';

import { type SubmitEvent, useState } from 'react';
import Link from 'next/link';
import { login, signup, loginWithGitHub } from './actions';
import { AuthHeader, SocialLoginButton } from '@/components/forms';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';

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
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-1/2">
        <div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input type="email" name="email" placeholder="dom.cobb@dreams-inc.com" />
          </div>

          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Input type="password" name="password" placeholder="••••••••" />
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit">Sign In</Button>
            <Button onClick={handleGithubLogin} disabled={isLoading} variant="ghost">
              Or continue with GitHub
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
