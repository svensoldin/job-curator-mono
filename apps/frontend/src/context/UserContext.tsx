'use client';

import { HOME } from '@/constants/routes';
import { type getUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createContext, type ReactNode, useContext, useState } from 'react';

type User = Awaited<ReturnType<typeof getUser>> | null;

const UserContext = createContext<User | undefined>(undefined);

interface UserContextProviderProps {
  children?: ReactNode;
  initialUser: User;
}

export const UserContextProvider = ({ children, initialUser }: UserContextProviderProps) => {
  const [user] = useState<User>(initialUser ?? null);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  if (context === null) return redirect(HOME);
  return context;
};
