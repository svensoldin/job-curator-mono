import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
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

  it('respects localStorage theme preference over system preference', () => {
    mockMatchMedia(true);
    localStorage.setItem('theme', 'light');

    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
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

  it('displays correct icon based on theme', async () => {
    render(<ThemeToggle />);

    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    expect(document.querySelector('.text-gray-700')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    expect(document.querySelector('.text-yellow-500')).toBeInTheDocument();
  });
});
