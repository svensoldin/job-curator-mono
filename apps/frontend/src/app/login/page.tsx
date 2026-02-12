'use client';

import { type SubmitEvent, useState } from 'react';
import Link from 'next/link';
import { login, signup, loginWithGitHub } from './actions';
import { AuthHeader, SocialLoginButton } from '@/components/forms';
import { Box, Button, Container, Field, Fieldset, Input, Stack } from '@chakra-ui/react';
import { LuGithub } from 'react-icons/lu';

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
    <Container
      alignItems="center"
      justifyContent="center"
      minH="100vh"
      flexDirection="column"
      display="flex"
    >
      <form onSubmit={handleSubmit} className="w-1/2">
        <Fieldset.Root>
          <Fieldset.Content>
            <Stack>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input type="email" name="email" placeholder="dom.cobb@dreams-inc.com" />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input type="password" name="password" placeholder="••••••••" />
              </Field.Root>
              <Button>Sign In</Button>
              <Button onClick={handleGithubLogin} disabled={isLoading} variant="ghost">
                <LuGithub />
                Or continue with GitHub
              </Button>
            </Stack>
          </Fieldset.Content>
        </Fieldset.Root>
      </form>
    </Container>
  );
}
