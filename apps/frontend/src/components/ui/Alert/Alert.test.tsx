import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Alert from './Alert';

describe('Alert', () => {
  it('renders error alert with title and message', () => {
    render(
      <Alert type='error' title='Error Title' message='Something went wrong' />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders success alert without title', () => {
    render(<Alert type='success' message='Operation successful' />);

    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders info alert as default type', () => {
    render(<Alert message='Information message' />);

    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50');
    expect(screen.getByText('Information message')).toBeInTheDocument();
  });
});
