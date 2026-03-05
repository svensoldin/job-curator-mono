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
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = skillName.trim();
    const parsed = parseInt(years, 10);

    if (!trimmed) {
      setError('Skill name is required.');
      return;
    }
    if (isNaN(parsed) || parsed < 0) {
      setError('Years must be a valid number ≥ 0.');
      return;
    }

    setError('');
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
              ×
            </button>
          </span>
        ))}
      </div>

      <div className='flex gap-3 items-start'>
        <Input
          label='Skill'
          placeholder='e.g. TypeScript'
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          onKeyDown={handleKeyDown}
          error={error && !years ? error : undefined}
          className='flex-1'
        />
        <Input
          label='Years'
          type='number'
          min={0}
          placeholder='0'
          value={years}
          onChange={(e) => setYears(e.target.value)}
          onKeyDown={handleKeyDown}
          error={error && years ? error : undefined}
          className='w-28'
        />
        <button
          type='button'
          onClick={handleAdd}
          className='mt-8 rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors'
        >
          Add
        </button>
      </div>
      {error && !skillName && !years && (
        <p className='text-sm text-red-500'>{error}</p>
      )}
    </div>
  );
};

export default SkillGraphInput;
