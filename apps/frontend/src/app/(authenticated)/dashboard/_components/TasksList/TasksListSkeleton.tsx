import clsx from 'clsx';

interface TasksListSkeletonProps {
  count?: number;
}

const TasksListSkeleton = ({ count = 6 }: TasksListSkeletonProps) => {
  return (
    <div className={clsx('grid gap-6 grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='animate-pulse p-4 border rounded-lg bg-slate-800 border-slate-700'>
          <div className='h-6 bg-slate-700 rounded w-3/4 mb-3' />
          <div className='h-3 bg-slate-700 rounded w-1/2 mb-4' />

          <div className='space-y-2 mb-4'>
            <div className='h-3 bg-slate-700 rounded w-full' />
            <div className='h-3 bg-slate-700 rounded w-5/6' />
          </div>

          <div className='flex items-center justify-between gap-3'>
            <div className='h-8 bg-slate-700 rounded flex-1' />
            <div className='h-8 w-10 bg-slate-700 rounded' />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TasksListSkeleton;
