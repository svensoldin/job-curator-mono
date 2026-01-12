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
});
