'use client';

import { LuLogOut } from 'react-icons/lu';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LuHouse, LuSearch, LuChartBar } from 'react-icons/lu';

import { logout } from '@/app/login/actions';

const navigation = [
  { name: 'Home', href: '/dashboard', icon: LuHouse },
  { name: 'Search', href: '/search', icon: LuSearch },
  { name: 'Analytics', href: '/analytics', icon: LuChartBar },
];

export default function SidebarNavigation() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <nav className="flex-1 space-y-1 px-2 py-4 group-hover:px-3">
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
              <Icon className="h-5 w-5 shrink-0" />
              <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 px-2 py-4 dark:border-gray-800 group-hover:px-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
          title="Logout"
        >
          <LuLogOut className="h-5 w-5 shrink-0" />
          <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Logout
          </span>
        </button>
      </div>
    </>
  );
}
