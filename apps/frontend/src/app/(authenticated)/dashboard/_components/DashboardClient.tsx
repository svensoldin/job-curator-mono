'use client';

import PendingTasksSection from './PendingTasksSection';

import { useallUserTasks } from '../_lib/queries';
import { getUser } from '@/lib/supabase/server';
import type { SearchTask } from '@repo/types';
import TasksList from './TasksList/TasksList';

interface DashboardClientProps {
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
}

const getPendingTasks = (tasks?: SearchTask[]) =>
  !tasks ? [] : tasks.filter((task) => task.total_jobs === 0);

export default function DashboardClient({ user }: DashboardClientProps) {
  const { data: tasks, isPending } = useallUserTasks(user.id);

  const pendingTasks = getPendingTasks(tasks);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <header>
          <h1 className="text-3xl font-bold text-white mb-2">My Job Searches</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.email}</p>
        </header>
      </div>

      {isPending ? (
        <>loading</>
      ) : (
        <>
          <PendingTasksSection tasks={pendingTasks} />

          <TasksList tasks={tasks} />
        </>
      )}
    </>
  );
}
