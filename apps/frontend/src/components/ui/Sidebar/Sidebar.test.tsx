import { logout } from '@/app/login/actions';
import { ANALYTICS, DASHBOARD, SEARCH } from '@/routes';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Sidebar from './Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue(DASHBOARD),
}));

vi.mock('@/app/login/actions', () => ({
  logout: vi.fn(),
}));

describe('Sidebar', () => {
  it('renders logo with correct text', () => {
    render(<Sidebar />);
    // Note: "Job Curator" is hidden by default and only shown on hover
    expect(screen.getByText('Job Curator')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<Sidebar />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    const searchLink = screen.getByRole('link', { name: /search/i });
    const analyticsLink = screen.getByRole('link', { name: /analytics/i });

    expect(homeLink).toHaveAttribute('href', DASHBOARD);
    expect(searchLink).toHaveAttribute('href', SEARCH);
    expect(analyticsLink).toHaveAttribute('href', ANALYTICS);
  });

  it('highlights active link based on current pathname', () => {
    render(<Sidebar />);

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveClass('bg-gray-100');
  });

  it('renders logout button', async () => {
    render(<Sidebar />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();

    await userEvent.click(logoutButton);
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('provides title attributes for navigation items and logout button', () => {
    render(<Sidebar />);

    expect(screen.getByTitle('Home')).toBeInTheDocument();
    expect(screen.getByTitle('Search')).toBeInTheDocument();
    expect(screen.getByTitle('Analytics')).toBeInTheDocument();
    expect(screen.getByTitle('Logout')).toBeInTheDocument();
  });
});
