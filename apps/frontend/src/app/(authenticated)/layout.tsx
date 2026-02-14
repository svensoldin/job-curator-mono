import Sidebar from '@/components/ui/Sidebar';
import { LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

export const queryClient = new QueryClient();

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = getUser();

  if (!user) {
    redirect(LOGIN);
  }

  return (
    <>
      <Sidebar />
      <div className="bg-neutral-900 transition-colors px-16">
        <div className="min-h-screen">
          <main className="container mx-auto pl-32 py-16">
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          </main>
        </div>
      </div>
    </>
  );
}
