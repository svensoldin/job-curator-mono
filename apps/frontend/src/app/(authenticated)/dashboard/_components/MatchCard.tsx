import type { MatchWithJob } from '@repo/types';
import Link from 'next/link';

import ScoreBadge from '@/components/ui/ScoreBadge';

interface MatchCardProps {
  match: MatchWithJob;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const { job, score, reasoning, missing_skills, is_hidden_gem } = match;
  const visibleSkills = missing_skills?.slice(0, 5) ?? [];
  const extraSkills = (missing_skills?.length ?? 0) - visibleSkills.length;

  return (
    <Link
      href={`/matches/${job.id}`}
      className='block p-5 rounded-lg border bg-slate-800 border-slate-700 hover:-translate-y-1 transition-transform duration-200'
    >
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='min-w-0'>
          <h3 className='font-semibold text-white truncate'>{job.title}</h3>
          <p className='text-sm text-gray-400 truncate'>{job.company}</p>
          {job.location && <p className='text-xs text-gray-500 truncate'>{job.location}</p>}
        </div>
        <ScoreBadge score={score} variant='circle' />
      </div>

      {is_hidden_gem && (
        <span className='inline-block mb-3 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300 border border-purple-700'>
          Hidden Gem
        </span>
      )}

      {reasoning && <p className='text-sm text-gray-400 line-clamp-2 mb-3'>{reasoning}</p>}

      {visibleSkills.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {visibleSkills.map((skill) => (
            <span key={skill} className='px-2 py-0.5 rounded text-xs bg-slate-700 text-gray-300'>
              {skill}
            </span>
          ))}
          {extraSkills > 0 && (
            <span className='px-2 py-0.5 rounded text-xs bg-slate-700 text-gray-400'>+{extraSkills} more</span>
          )}
        </div>
      )}
    </Link>
  );
};

export default MatchCard;
