'use client';

import { useState, useEffect } from 'react';

import type { getUser } from '@/lib/supabase/server';
import { useMatchesByUser } from '../_lib/queries';
import { useTriggerMatching } from '../_lib/mutations';
import TasksListSkeleton from './TasksList/TasksListSkeleton';
import MatchCard from './MatchCard';

interface MatchListProps {
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
}

const PENDING_TTL = 15 * 60 * 1000;
const pendingKey = (userId: string) => `matching_pending_${userId}`;

const MatchList = ({ user }: MatchListProps) => {
  const [isMatchingPending, setIsMatchingPending] = useState(() => {
    const ts = localStorage.getItem(pendingKey(user.id));
    return !!ts && Date.now() - Number(ts) < PENDING_TTL;
  });

  const {
    data: matches,
    isPending,
    isError: isMatchError,
    error: matchError,
  } = useMatchesByUser(user.id, isMatchingPending ? 30_000 : false);
  const { mutate, isPending: isTriggerPending } = useTriggerMatching();

  useEffect(() => {
    if (matches && matches.length > 0 && isMatchingPending) {
      localStorage.removeItem(pendingKey(user.id));
      setIsMatchingPending(false);
    }
  }, [matches, isMatchingPending, user.id]);

  const handleTriggerMatching = () => {
    mutate(user.id, {
      onSuccess: () => {
        localStorage.setItem(pendingKey(user.id), Date.now().toString());
        setIsMatchingPending(true);
      },
    });
  };

  if (isMatchError) throw new Error(matchError.message);
  if (isPending) return <TasksListSkeleton />;

  if (matches.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <p className='text-gray-400 mb-6 text-lg'>
          No matches yet. Run the matcher to find your best job fits.
        </p>
        {isMatchingPending ? (
          <p className='text-green-400 font-medium'>
            Matching started — check back in a few minutes.
          </p>
        ) : (
          <button
            onClick={handleTriggerMatching}
            disabled={isTriggerPending}
            className='px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors'
          >
            {isTriggerPending ? 'Starting…' : 'Run now'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <p className='text-gray-400 text-sm'>
          {matches.length} match{matches.length !== 1 ? 'es' : ''} found
        </p>
        <button
          onClick={handleTriggerMatching}
          disabled={isTriggerPending}
          className='px-4 py-2 rounded-lg border border-slate-700 text-sm text-gray-300 hover:bg-slate-800 disabled:opacity-50 transition-colors'
        >
          {isTriggerPending ? 'Running…' : 'Refresh matches'}
        </button>
      </div>
      <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
};

export default MatchList;
