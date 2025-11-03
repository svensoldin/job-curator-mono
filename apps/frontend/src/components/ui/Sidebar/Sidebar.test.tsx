import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { ANALYTICS, DASHBOARD, SEARCH } from '@/routes';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue(DASHBOARD),
}));

// Mock the logout action
jest.mock('@/app/login/actions', () => ({
  logout: jest.fn(),
}));

describe('Sidebar', () => {
  it('renders logo with correct text', () => {
    render(<Sidebar />);
    expect(screen.getByText('JC')).toBeInTheDocument();
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
    const { logout } = require('@/app/login/actions');
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
