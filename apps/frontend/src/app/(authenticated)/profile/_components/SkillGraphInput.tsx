'use client';

import { useState } from 'react';

import Input from '@/components/ui/Input/Input';

interface SkillGraphInputProps {
  value: Record<string, number>;
  onChange: (value: Record<string, number>) => void;
}

const SkillGraphInput = ({ value, onChange }: SkillGraphInputProps) => {
  const [skillName, setSkillName] = useState('');
  const [years, setYears] = useState('');
  const [skillError, setSkillError] = useState('');
  const [yearsError, setYearsError] = useState('');

  const handleAdd = () => {
    const trimmed = skillName.trim();
    const parsed = parseInt(years, 10);

    let hasError = false;
    if (!trimmed) {
      setSkillError('Skill name is required.');
      hasError = true;
    } else if (trimmed in value) {
      setSkillError(`"${trimmed}" is already added. Remove it first to update.`);
      hasError = true;
    } else {
      setSkillError('');
    }
    if (isNaN(parsed) || parsed < 0) {
      setYearsError('Must be a number ≥ 0.');
      hasError = true;
    } else {
      setYearsError('');
    }
    if (hasError) return;

    onChange({ ...value, [trimmed]: parsed });
    setSkillName('');
    setYears('');
  };

  const handleRemove = (skill: string) => {
    const next = { ...value };
    delete next[skill];
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        {Object.entries(value).map(([skill, n]) => (
          <span
            key={skill}
            className='inline-flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-200'
          >
            {skill} · {n}y
            <button
              type='button'
              onClick={() => handleRemove(skill)}
              className='ml-1 text-gray-400 hover:text-white transition-colors'
              aria-label={`Remove ${skill}`}
            >
              <svg xmlns='http://www.w3.org/2000/svg' width={12} height={12} viewBox='0 0 12 12' aria-hidden='true'>
                <path stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' d='M2 2l8 8M10 2l-8 8' />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className='flex gap-3 items-end'>
        <Input
          label='Skill'
          placeholder='e.g. TypeScript'
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          onKeyDown={handleKeyDown}
          error={skillError || undefined}
        />
        <Input
          label='Years'
          type='number'
          min={0}
          step={1}
          placeholder='0'
          value={years}
          onChange={(e) => setYears(e.target.value)}
          onKeyDown={handleKeyDown}
          error={yearsError || undefined}
        />
        <button
          type='button'
          onClick={handleAdd}
          className='rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors'
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default SkillGraphInput;
