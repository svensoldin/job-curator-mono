'use client';

import { type getUser } from '@/lib/supabase/server';
import MatchList from './MatchList';

interface DashboardClientProps {
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
}

const Dashboard = ({ user }: DashboardClientProps) => {
  return (
    <div className='w-full flex flex-col self-start'>
      <div className='flex items-center justify-between mb-8 shrink-0'>
        <header>
          <h1 className='text-3xl font-bold text-white mb-2'>My Matches</h1>
          <p className='text-gray-400'>Welcome back, {user.email}</p>
        </header>
      </div>
      <div className='flex-1'>
        <MatchList user={user} />
      </div>
    </div>
  );
};

export default Dashboard;
