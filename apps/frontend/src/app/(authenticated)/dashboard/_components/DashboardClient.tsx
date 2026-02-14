'use client';

import { useallUserTasks } from '../_lib/queries';
import { type getUser } from '@/lib/supabase/server';
import TasksList from './TasksList/TasksList';

interface DashboardClientProps {
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { data, isPending, isError } = useallUserTasks(user.id);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">My Job Searches</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.email}</p>
        </header>
      </div>
      {isPending || isError ? <p>loading</p> : <TasksList tasks={data} />}
    </>
  );
}
