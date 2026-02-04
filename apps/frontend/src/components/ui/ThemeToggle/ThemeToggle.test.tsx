import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    localStorage.clear();

    document.documentElement.removeAttribute('data-theme');

    mockMatchMedia(false);
  });

  it('renders with light theme by default when no preferences', () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('respects system dark mode preference', () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('toggles between light and dark mode', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    expect(button).toHaveAccessibleName('Switch to dark mode');
    expect(document.documentElement).not.toHaveAttribute('data-theme');

    await userEvent.click(button);
    expect(button).toHaveAccessibleName('Switch to light mode');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    await userEvent.click(button);
    expect(button).toHaveAccessibleName('Switch to dark mode');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
