'use client';

import Link from 'next/link';

import { DASHBOARD } from '@/constants/routes';
import ScoreBadge from '@/components/ui/ScoreBadge';
import { useMatchDetail } from '../_lib/queries';

interface MatchDetailClientProps {
  userId: string;
  jobId: string;
}

const MatchDetailClient = ({ userId, jobId }: MatchDetailClientProps) => {
  const { data: match, isPending, isError, error } = useMatchDetail(userId, jobId);

  if (isError) throw new Error(error.message);
  if (isPending) {
    return (
      <div className='w-full animate-pulse space-y-4'>
        <div className='h-8 bg-slate-700 rounded w-1/2' />
        <div className='h-4 bg-slate-700 rounded w-1/3' />
        <div className='h-32 bg-slate-700 rounded' />
      </div>
    );
  }

  const { job, score, reasoning, missing_skills, salary_alignment, is_hidden_gem } = match;
  const summary = job.structured_summary;

  return (
    <div className='w-full max-w-6xl'>
      <Link href={DASHBOARD} className='inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors'>
        ← Back to matches
      </Link>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Left: main content (2/3) */}
        <div className='flex-1 lg:basis-2/3 space-y-4'>
          {/* Title card */}
          <div className='p-6 rounded-lg border bg-slate-800 border-slate-700'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold text-white mb-1'>{job.title}</h1>
                <p className='text-gray-300'>{job.company}</p>
                {job.location && <p className='text-gray-500 text-sm mt-0.5'>{job.location}</p>}
                {is_hidden_gem && (
                  <span className='inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300 border border-purple-700'>
                    Hidden Gem
                  </span>
                )}
              </div>
              <ScoreBadge score={score} variant='text' />
            </div>
            <a
              href={job.url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors'
            >
              View job posting ↗
            </a>
          </div>

          {/* Why this match */}
          {reasoning && (
            <div className='p-6 rounded-lg border bg-slate-800 border-slate-700'>
              <h2 className='text-lg font-semibold text-white mb-3'>Why this match?</h2>
              <p className='text-gray-300 leading-relaxed'>{reasoning}</p>
            </div>
          )}

          {/* Skills to develop */}
          {missing_skills && missing_skills.length > 0 && (
            <div className='p-6 rounded-lg border bg-slate-800 border-slate-700'>
              <h2 className='text-lg font-semibold text-white mb-3'>Skills to develop</h2>
              <div className='flex flex-wrap gap-2'>
                {missing_skills.map((skill) => (
                  <span key={skill} className='px-3 py-1 rounded-full text-sm bg-slate-700 text-gray-300'>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Salary alignment */}
          {salary_alignment && (
            <div className='p-6 rounded-lg border bg-slate-800 border-slate-700'>
              <h2 className='text-lg font-semibold text-white mb-3'>Salary alignment</h2>
              <p className='text-gray-300'>{salary_alignment}</p>
            </div>
          )}
        </div>

        {/* Right: sidebar (1/3) */}
        <aside className='lg:basis-1/3 space-y-4'>
          {summary && (
            <div className='p-6 rounded-lg border bg-slate-800 border-slate-700'>
              <h2 className='text-lg font-semibold text-white mb-4'>Job Summary</h2>

              {summary.seniority && (
                <div className='mb-3'>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Seniority</p>
                  <p className='text-gray-300 text-sm'>{summary.seniority}</p>
                </div>
              )}

              {summary.salary && (
                <div className='mb-3'>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Salary</p>
                  <p className='text-gray-300 text-sm'>{summary.salary}</p>
                </div>
              )}

              {summary.culture && (
                <div className='mb-3'>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Culture</p>
                  <p className='text-gray-300 text-sm'>{summary.culture}</p>
                </div>
              )}

              {summary.stack && summary.stack.length > 0 && (
                <div className='mb-3'>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-2'>Tech Stack</p>
                  <div className='flex flex-wrap gap-1.5'>
                    {summary.stack.map((tech) => (
                      <span key={tech} className='px-2 py-0.5 rounded text-xs bg-slate-700 text-gray-300'>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {summary.responsibilities && (
                <div>
                  <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Responsibilities</p>
                  <p className='text-gray-300 text-sm leading-relaxed'>{summary.responsibilities}</p>
                </div>
              )}
            </div>
          )}

          <div className='p-4 rounded-lg border bg-slate-800 border-slate-700'>
            <p className='text-xs text-gray-500 uppercase tracking-wide mb-1'>Source</p>
            <p className='text-gray-400 text-sm'>{job.source}</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MatchDetailClient;
