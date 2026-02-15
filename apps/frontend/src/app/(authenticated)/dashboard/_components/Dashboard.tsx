'use client';

import { useallUserTasks } from '../_lib/queries';
import { type getUser } from '@/lib/supabase/server';
import TasksList from './TasksList/TasksList';
import TasksListSkeleton from './TasksList/TasksListSkeleton';

interface DashboardClientProps {
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
}

export default function Dashboard({ user }: DashboardClientProps) {
  const { data, isPending, isError, error } = useallUserTasks(user.id);

  if (isError) throw new Error(error.message);

  return (
    <>
      <div className='flex items-center justify-between mb-8'>
        <header>
          <h1 className='text-3xl font-bold text-white mb-2'>My Job Searches</h1>
          <p className='text-gray-400'>Welcome back, {user.email}</p>
        </header>
      </div>
      {isPending ? <TasksListSkeleton /> : <TasksList tasks={data} />}
    </>
  );
}
