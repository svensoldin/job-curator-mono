import { UserCriteria } from '../../types/user-criteria';

export type StepKey = keyof UserCriteria | 'complete';

const content = [
  {
    key: 'jobTitle' as const,
    title: 'What job title are you looking for?',
    placeholder:
      'e.g., Fullstack Developer, Data Scientist, Product Manager...',
    tip: 'Be specific about your role: "Senior React Developer" works better than just "Developer"',
  },
  {
    key: 'location' as const,
    title: 'Where would you like to work?',
    placeholder: 'e.g., Paris, Remote, London, Berlin...',
    tip: 'You can specify multiple locations or "Remote" for remote work opportunities',
  },
  {
    key: 'skills' as const,
    title: 'What are your key skills?',
    placeholder: 'e.g., React, TypeScript, Node.js, Python, AWS...',
    tip: 'List your most relevant technical skills separated by commas',
  },
  {
    key: 'salary' as const,
    title: 'What is your salary expectation?',
    placeholder: 'e.g., 45, 60, 80...',
    tip: 'Consider your experience level and market rates for your location and role',
    helper: 'Amount in thousands of euros (k€)',
  },
  {
    key: 'complete' as const,
    title: 'Perfect! Here are your preferences:',
    placeholder: '',
    tip: '',
    helper: '',
  },
] as const;

export default content;
