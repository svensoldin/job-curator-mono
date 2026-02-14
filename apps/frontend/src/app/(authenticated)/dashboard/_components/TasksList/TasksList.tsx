import { SearchTask } from '@repo/types';
import EmptyState from './EmptyState';
import { SEARCH } from '@/constants/routes';
import SearchCard from './SearchCard';
import clsx from 'clsx';

interface TasksListProps {
  tasks: SearchTask[];
}

const TasksList = ({ tasks }: TasksListProps) => {
  if (!tasks.length) return <EmptyState />;
  return (
    <div className={clsx('grid gap-6 grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')}>
      {tasks.map((task) => (
        <SearchCard key={task.id} task={task} href={`${SEARCH}/${task.id}`} />
      ))}
    </div>
  );
};

export default TasksList;
