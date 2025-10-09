'use client';

import React from 'react';

interface AuthHeaderProps {
  isSignUp: boolean;
}

export function AuthHeader({ isSignUp }: AuthHeaderProps) {
  return (
    <div className='text-center mb-8'>
      <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className='text-gray-600 dark:text-gray-400'>
        {isSignUp
          ? 'Sign up to start your job search'
          : 'Sign in to continue your job search'}
      </p>
    </div>
  );
}
