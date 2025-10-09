import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { LOGIN } from '@/routes';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN);
  }

  return (
    <>
      <Sidebar />
      <div className='pl-16'>{children}</div>
    </>
  );
}
