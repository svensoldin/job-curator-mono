import type { UserProfile } from '@repo/types';

export const SENIORITY_OPTIONS: Array<NonNullable<UserProfile['seniority']>> = [
  'junior',
  'mid',
  'senior',
  'lead',
];

export const CULTURE_OPTIONS: Array<NonNullable<UserProfile['culture_preference']>> = [
  'startup',
  'scale-up',
  'big_corp',
];

export const CULTURE_LABELS: Record<NonNullable<UserProfile['culture_preference']>, string> = {
  startup: 'Startup',
  'scale-up': 'Scale-up',
  big_corp: 'Big Corp',
};
