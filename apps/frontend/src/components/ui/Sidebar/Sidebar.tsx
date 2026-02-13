import cx from 'clsx';
import Image from 'next/image';

import SidebarNavigation from './SidebarNavigation';

export default function Sidebar() {
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
        <Image src="/favicon.ico" alt="Job Curator Logo" width={32} height={32} />
        <h1 className={cx('hidden min-w-50 text-xl font-bold', 'group-hover:block')}>
          Job Curator
        </h1>
      </div>
      <SidebarNavigation />
    </div>
  );
}
