'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@repo/types';

import Input from '@/components/ui/Input/Input';
import { DASHBOARD } from '@/constants/routes';

import { useProfile } from '../_lib/queries';
import { useUpsertProfile } from '../_lib/mutations';
import { SENIORITY_OPTIONS, CULTURE_OPTIONS, CULTURE_LABELS } from '../_lib/constants';
import SkillGraphInput from './SkillGraphInput';
import ProfileView from './ProfileView';

interface ProfileFormData {
  location: string;
  remote: boolean;
  salary_min: string;
  salary_max: string;
  skill_graph: Record<string, number>;
  seniority: UserProfile['seniority'];
  culture_preference: UserProfile['culture_preference'];
}

const initFormData = (profile?: UserProfile): ProfileFormData => ({
  location: profile?.hard_constraints?.location ?? '',
  remote: profile?.hard_constraints?.remote ?? false,
  salary_min: profile?.hard_constraints?.salary_min?.toString() ?? '',
  salary_max: profile?.hard_constraints?.salary_max?.toString() ?? '',
  skill_graph: profile?.skill_graph ?? {},
  seniority: profile?.seniority ?? null,
  culture_preference: profile?.culture_preference ?? null,
});

const STEPS = ['Hard Constraints', 'Skills', 'Seniority', 'Culture', 'Review'] as const;

interface ProfileFormProps {
  user: User;
}

const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const { data: profile } = useProfile(user.id);
  const { mutate, isPending } = useUpsertProfile();

  const hasProfile = !!profile;
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>(() => initFormData(profile));

  useEffect(() => {
    if (profile) setFormData(initFormData(profile));
  }, [profile]);

  const isNextEnabled = () => {
    if (step === 2) return formData.seniority !== null;
    if (step === 3) return formData.culture_preference !== null;
    return true;
  };

  const handleSubmit = () => {
    mutate(
      {
        userId: user.id,
        hardConstraints: {
          location: formData.location || undefined,
          remote: formData.remote || undefined,
          salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
          salary_max: formData.salary_max ? Number(formData.salary_max) : undefined,
        },
        skillGraph: Object.keys(formData.skill_graph).length ? formData.skill_graph : undefined,
        seniority: formData.seniority ?? undefined,
        culturePreference: formData.culture_preference ?? undefined,
      },
      {
        onSuccess: () => {
          if (hasProfile) {
            setIsEditing(false);
          } else {
            router.push(DASHBOARD);
          }
        },
      }
    );
  };

  if (hasProfile && !isEditing) {
    return <ProfileView profile={profile} onEdit={() => setIsEditing(true)} />;
  }

  return (
    <div className='w-full max-w-3xl px-4 py-10'>
      <header className='mb-8'>
        <h1 className='text-2xl font-semibold text-white'>Your profile</h1>
        <p className='mt-1 text-sm text-gray-400'>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
        <div className='mt-4 flex gap-1'>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-white' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </header>

      <div className='space-y-6'>
        {step === 0 && (
          <fieldset className='space-y-4'>
            <legend className='sr-only'>Hard constraints</legend>
            <Input
              label='Location'
              placeholder='e.g. Paris, France'
              value={formData.location}
              onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
            />
            <label className='flex items-center gap-3 cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={formData.remote}
                  onChange={(e) => setFormData((f) => ({ ...f, remote: e.target.checked }))}
                />
                <div className='w-10 h-6 rounded-full bg-gray-700 peer-checked:bg-white transition-colors' />
                <div className='absolute top-1 left-1 w-4 h-4 rounded-full bg-gray-900 transition-transform peer-checked:translate-x-4' />
              </div>
              <span className='text-sm font-medium text-gray-100'>Remote only</span>
            </label>
            <div className='flex gap-4'>
              <Input
                label='Min salary (k€)'
                type='number'
                min={0}
                placeholder='e.g. 50'
                value={formData.salary_min}
                onChange={(e) => setFormData((form) => ({ ...form, salary_min: e.target.value }))}
              />
              <Input
                label='Max salary (k€)'
                type='number'
                min={0}
                placeholder='e.g. 80'
                value={formData.salary_max}
                onChange={(e) => setFormData((form) => ({ ...form, salary_max: e.target.value }))}
              />
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className='space-y-3'>
            <h2 className='text-base font-medium text-gray-100'>
              Add your skills and years of experience
            </h2>
            <SkillGraphInput
              value={formData.skill_graph}
              onChange={(skill_graph) => setFormData((f) => ({ ...f, skill_graph }))}
            />
          </div>
        )}

        {step === 2 && (
          <fieldset className='space-y-3'>
            <legend className='text-base font-medium text-gray-100'>Seniority level</legend>
            <div className='grid grid-cols-2 gap-3'>
              {SENIORITY_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border p-4 text-sm font-medium capitalize transition-colors ${
                    formData.seniority === option
                      ? 'border-white bg-gray-800 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  <input
                    type='radio'
                    name='seniority'
                    value={option}
                    className='sr-only'
                    checked={formData.seniority === option}
                    onChange={() => setFormData((f) => ({ ...f, seniority: option }))}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className='space-y-3'>
            <legend className='text-base font-medium text-gray-100'>Culture preference</legend>
            <div className='grid grid-cols-3 gap-3'>
              {CULTURE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border p-4 text-sm font-medium transition-colors ${
                    formData.culture_preference === option
                      ? 'border-white bg-gray-800 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  <input
                    type='radio'
                    name='culture_preference'
                    value={option}
                    className='sr-only'
                    checked={formData.culture_preference === option}
                    onChange={() => setFormData((f) => ({ ...f, culture_preference: option }))}
                  />
                  {CULTURE_LABELS[option]}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <div className='space-y-4'>
            <h2 className='text-base font-medium text-gray-100'>Review your profile</h2>
            <dl className='space-y-3 rounded-lg border border-gray-800 p-4 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-gray-400'>Location</dt>
                <dd className='text-gray-100'>{formData.location || '—'}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-gray-400'>Remote</dt>
                <dd className='text-gray-100'>{formData.remote ? 'Yes' : 'No'}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-gray-400'>Salary range (k€)</dt>
                <dd className='text-gray-100'>
                  {formData.salary_min || '—'} – {formData.salary_max || '—'}
                </dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-gray-400'>Skills</dt>
                <dd className='text-gray-100 text-right'>
                  {Object.keys(formData.skill_graph).length
                    ? Object.entries(formData.skill_graph)
                        .map(([s, n]) => `${s} (${n}y)`)
                        .join(', ')
                    : '—'}
                </dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-gray-400'>Seniority</dt>
                <dd className='text-gray-100 capitalize'>{formData.seniority ?? '—'}</dd>
              </div>
              <div className='flex justify-between'>
                <dt className='text-gray-400'>Culture</dt>
                <dd className='text-gray-100'>
                  {formData.culture_preference ? CULTURE_LABELS[formData.culture_preference] : '—'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <nav className='mt-10 flex justify-between'>
        {step > 0 ? (
          <button
            type='button'
            onClick={() => setStep((s) => s - 1)}
            className='rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors'
          >
            Back
          </button>
        ) : (
          <span />
        )}

        {step < STEPS.length - 1 ? (
          <button
            type='button'
            onClick={() => setStep((s) => s + 1)}
            disabled={!isNextEnabled()}
            className='rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            Next
          </button>
        ) : (
          <button
            type='button'
            onClick={handleSubmit}
            disabled={isPending}
            className='rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            {isPending ? 'Saving…' : 'Save profile'}
          </button>
        )}
      </nav>
    </div>
  );
};

export default ProfileForm;
