import clsx from 'clsx';
import Image from 'next/image';

import SidebarNavigation from './SidebarNavigation';

export default function Sidebar() {
  return (
    <div
      className={clsx(
        'group fixed left-0 top-0 z-40 flex border-gray-800 bg-gray-950 h-screen w-16 flex-col border-r transition-all duration-300',
        'hover:w-64'
      )}
    >
      <div
        className={clsx(
          'flex h-16 items-center justify-center border-b px-4 border-gray-800',
          'group-hover:justify-start'
        )}
      >
        <Image src="/favicon.ico" alt="Job Curator Logo" width={32} height={32} />
        <h1 className={clsx('hidden min-w-50 text-xl font-bold', 'group-hover:block')}>
          Job Curator
        </h1>
      </div>
      <SidebarNavigation />
    </div>
  );
}
