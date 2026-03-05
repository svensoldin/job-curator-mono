import clsx from 'clsx';

interface ScoreBadgeProps {
  score: number | null;
  variant: 'circle' | 'text';
}

const getColorClass = (value: number, variant: 'circle' | 'text') => {
  if (variant === 'circle') {
    return value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  }
  return value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400';
};

const ScoreBadge = ({ score, variant }: ScoreBadgeProps) => {
  const value = score ?? 0;
  const colorClass = getColorClass(value, variant);

  if (variant === 'circle') {
    return (
      <div
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
          colorClass,
        )}
      >
        {value}%
      </div>
    );
  }

  return <span className={clsx('text-5xl font-bold', colorClass)}>{value}%</span>;
};

export default ScoreBadge;
