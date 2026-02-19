import type { UserCriteria } from '@repo/types';
import { useMutation } from '@tanstack/react-query';

export const MutationKeys = {
  createNewTask: 'createNewTask',
};

const CREATE_TASK_URL = `${process.env.NEXT_PUBLIC_JOB_SCRAPER_URL}/searches/create`;

const createNewTask = async (criteria: UserCriteria) => {
  const res = await fetch(CREATE_TASK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(criteria),
  });

  if (!res.ok) {
    throw new Error('Failed to create task');
  }

  const json = await res.json();

  return { taskId: json.taskId };
};

export const useCreateNewTask = () =>
  useMutation({
    mutationKey: [MutationKeys.createNewTask],
    mutationFn: (criteria: UserCriteria) => createNewTask(criteria),
  });
