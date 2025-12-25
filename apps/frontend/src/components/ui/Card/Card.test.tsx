import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from '.';

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div>Test Content</div>
      </Card>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default padding class', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('p-6'); // default 'md' padding
  });

  it('applies different padding classes correctly', () => {
    const { rerender } = render(<Card padding='none'>Content</Card>);
    const getCard = () => screen.getByText('Content').parentElement;

    expect(getCard()).not.toHaveClass('p-4', 'p-6', 'p-8');

    rerender(<Card padding='sm'>Content</Card>);
    expect(getCard()).toHaveClass('p-4');

    rerender(<Card padding='md'>Content</Card>);
    expect(getCard()).toHaveClass('p-6');

    rerender(<Card padding='lg'>Content</Card>);
    expect(getCard()).toHaveClass('p-8');
  });

  it('applies additional className correctly', () => {
    render(<Card className='custom-class'>Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  it('renders with default styles', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass(
      'bg-white',
      'dark:bg-gray-800',
      'rounded-lg',
      'shadow-lg',
      'border',
      'border-gray-200',
      'dark:border-gray-700'
    );
  });
});
