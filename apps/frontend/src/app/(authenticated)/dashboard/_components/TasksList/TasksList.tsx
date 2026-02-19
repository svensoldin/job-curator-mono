import clsx from 'clsx';
import Link from 'next/link';
import type { SearchTask } from '@repo/types';

import { SEARCH } from '@/constants/routes';

import EmptyState from './EmptyState';
import SearchCard from './SearchCard';

interface TasksListProps {
  tasks: SearchTask[];
}

const TasksList = ({ tasks }: TasksListProps) => {
  if (!tasks.length) return <EmptyState />;

  const sortedTasks = [...tasks].sort((a, b) => {
    const at = new Date(a.created_at).getTime();
    const bt = new Date(b.created_at).getTime();
    return bt - at;
  });

  return (
    <div className={clsx('grid gap-6 grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')}>
      {sortedTasks.map(({ job_title, location, salary, id, created_at }) => (
        <Link href={`${SEARCH}/${id}`}>
          <SearchCard
            key={id}
            location={location}
            title={job_title}
            salary={salary}
            createdAt={created_at}
          />
        </Link>
      ))}
    </div>
  );
};

export default TasksList;
