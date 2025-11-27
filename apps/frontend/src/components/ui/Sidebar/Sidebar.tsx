'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, BarChart3, LogOut } from 'lucide-react';
import cx from 'classnames';

import { logout } from '@/app/login/actions';
import { ANALYTICS, DASHBOARD, SEARCH } from '@/routes';
import Image from 'next/image';

const navigation = [
  { name: 'Home', href: DASHBOARD, icon: Home },
  { name: 'Search', href: SEARCH, icon: Search },
  { name: 'Analytics', href: ANALYTICS, icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div
      className={cx(
        'group fixed left-0 top-0 z-40 flex h-screen w-16 flex-col border-r border-gray-200 bg-white transition-all duration-300',
        'hover:w-64 dark:border-gray-800 dark:bg-gray-950'
      )}
    >
      <div
        className={cx(
          'flex h-16 items-center justify-center border-b border-gray-200 px-4',
          'dark:border-gray-800 group-hover:justify-start'
        )}
      >
        <Image
          src='/favicon.ico'
          alt='Job Curator Logo'
          width={32}
          height={32}
        />
        <h1
          className={cx(
            'hidden min-w-50 text-xl font-bold',
            'group-hover:block'
          )}
        >
          Job Curator
        </h1>
      </div>

      {/* Navigation */}
      <nav className='flex-1 space-y-1 px-2 py-4 group-hover:px-3'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
                }
              `}
              title={item.name}
            >
              <Icon className='h-5 w-5 shrink-0' />
              <span className='overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className='border-t border-gray-200 px-2 py-4 dark:border-gray-800 group-hover:px-3'>
        <button
          onClick={handleLogout}
          className='flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
          title='Logout'
        >
          <LogOut className='h-5 w-5 shrink-0' />
          <span className='overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
