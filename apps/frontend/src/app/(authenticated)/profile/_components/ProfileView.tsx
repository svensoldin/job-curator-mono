'use client';

import type { UserProfile } from '@repo/types';

import { CULTURE_LABELS } from '../_lib/constants';

interface ProfileViewProps {
  profile: UserProfile;
  onEdit: () => void;
}

const ProfileView = ({ profile, onEdit }: ProfileViewProps) => {
  const { hard_constraints, skill_graph, seniority, culture_preference } = profile;

  const skillList = skill_graph ? Object.entries(skill_graph) : [];

  return (
    <div className='w-full max-w-3xl px-4 py-10'>
      <header className='mb-8 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-white'>Your profile</h1>
        <button
          type='button'
          onClick={onEdit}
          className='rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors'
        >
          Edit profile
        </button>
      </header>

      <dl className='space-y-6'>
        <section className='rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
            Constraints
          </h2>
          <div className='flex justify-between text-sm'>
            <dt className='text-gray-400'>Location</dt>
            <dd className='text-gray-100'>{hard_constraints?.location || '—'}</dd>
          </div>
          <div className='flex justify-between text-sm'>
            <dt className='text-gray-400'>Remote only</dt>
            <dd className='text-gray-100'>{hard_constraints?.remote ? 'Yes' : 'No'}</dd>
          </div>
          <div className='flex justify-between text-sm'>
            <dt className='text-gray-400'>Salary range (k€)</dt>
            <dd className='text-gray-100'>
              {hard_constraints?.salary_min ?? '—'} – {hard_constraints?.salary_max ?? '—'}
            </dd>
          </div>
        </section>

        <section className='rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-gray-500'>Skills</h2>
          {skillList.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {skillList.map(([skill, years]) => (
                <span
                  key={skill}
                  className='rounded-full border border-gray-700 px-3 py-1 text-xs font-medium text-gray-200'
                >
                  {skill} ({years}y)
                </span>
              ))}
            </div>
          ) : (
            <p className='text-sm text-gray-500'>No skills added</p>
          )}
        </section>

        <section className='rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4'>
          <h2 className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
            Preferences
          </h2>
          <div className='flex justify-between text-sm'>
            <dt className='text-gray-400'>Seniority</dt>
            <dd className='text-gray-100 capitalize'>{seniority ?? '—'}</dd>
          </div>
          <div className='flex justify-between text-sm'>
            <dt className='text-gray-400'>Culture</dt>
            <dd className='text-gray-100'>
              {culture_preference ? CULTURE_LABELS[culture_preference] : '—'}
            </dd>
          </div>
        </section>
      </dl>
    </div>
  );
};

export default ProfileView;
