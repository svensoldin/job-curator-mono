import clsx from 'clsx';
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
      {sortedTasks.map((task) => (
        <SearchCard key={task.id} task={task} href={`${SEARCH}/${task.id}`} />
      ))}
    </div>
  );
};

export default TasksList;
