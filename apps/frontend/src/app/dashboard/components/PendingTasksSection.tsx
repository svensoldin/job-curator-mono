'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PendingTask {
  searchId: string;
  taskId: string;
  status: string;
  progress: number;
  message: string;
  jobTitle: string;
}

interface PendingTasksSectionProps {
  searchIds: string[];
  onTasksUpdate?: (tasks: PendingTask[]) => void;
}

export default function PendingTasksSection({
  searchIds,
  onTasksUpdate,
}: PendingTasksSectionProps) {
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);

  useEffect(() => {
    const checkPendingTasks = async () => {
      if (searchIds.length === 0) {
        setPendingTasks([]);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;
      if (!baseUrl) return;

      const tasks: PendingTask[] = [];

      for (const searchId of searchIds) {
        const taskId = localStorage.getItem(`task_${searchId}`);
        if (taskId) {
          try {
            const response = await fetch(`${baseUrl}/jobs/status/${taskId}`);
            if (response.ok) {
              const status = await response.json();

              // Get job title from localStorage (stored when task was created)
              const jobTitle =
                localStorage.getItem(`task_title_${searchId}`) || 'Job Search';

              tasks.push({
                searchId,
                taskId,
                status: status.status,
                progress: status.progress || 0,
                message: status.message || '',
                jobTitle,
              });
            }
          } catch (error) {
            console.error('Error checking task status:', error);
          }
        }
      }

      setPendingTasks(tasks);
      onTasksUpdate?.(tasks);

      // If any task is completed, refresh the page and clean up
      if (tasks.some((t) => t.status === 'completed')) {
        setTimeout(() => {
          router.refresh();
          tasks
            .filter((t) => t.status === 'completed')
            .forEach((t) => {
              localStorage.removeItem(`task_${t.searchId}`);
              localStorage.removeItem(`task_title_${t.searchId}`);
            });
        }, 2000);
      }
    };

    checkPendingTasks();

    // Poll every 10 seconds if there are pending tasks
    const interval = setInterval(() => {
      if (searchIds.length > 0 || pendingTasks.length > 0) {
        checkPendingTasks();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [searchIds, router, onTasksUpdate]);

  if (pendingTasks.length === 0) {
    return null;
  }

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>
        Processing Searches 🔄
      </h2>
      <div className='space-y-4'>
        {pendingTasks.map((task) => (
          <PendingTaskCard key={task.taskId} task={task} />
        ))}
      </div>
    </div>
  );
}

function PendingTaskCard({ task }: { task: PendingTask }) {
  return (
    <div className='bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6'>
      <div className='flex items-start justify-between mb-3'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            {task.jobTitle}
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Task ID: {task.taskId}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          {task.status === 'completed' ? (
            <span className='px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium'>
              ✓ Completed
            </span>
          ) : task.status === 'failed' ? (
            <span className='px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium'>
              ✗ Failed
            </span>
          ) : (
            <span className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium'>
              ⏳ {task.status}
            </span>
          )}
        </div>
      </div>

      {task.status !== 'completed' && task.status !== 'failed' && (
        <>
          <div className='mb-2'>
            <div className='flex items-center justify-between text-sm mb-1'>
              <span className='text-gray-600 dark:text-gray-400'>
                {task.message}
              </span>
              <span className='text-gray-900 dark:text-white font-medium'>
                {task.progress}%
              </span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-500'
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
            This usually takes 5-10 minutes. The page will auto-refresh when
            complete.
          </p>
        </>
      )}

      {task.status === 'completed' && (
        <p className='text-sm text-green-600 dark:text-green-400'>
          Results are ready! Page will refresh in a moment...
        </p>
      )}
    </div>
  );
}
