import { redirect } from 'next/navigation';

import styles from './page.module.css';

import { DASHBOARD, LOGIN } from '@/constants/routes';
import { getUser } from '@/lib/supabase/server';
import Button from '@/components/ui/Button/Button';

const Home = async () => {
  const user = await getUser();

  if (user) {
    redirect(DASHBOARD);
  }

  return (
    <main className='min-h-screen relative flex items-center justify-center overflow-hidden'>
      <div className={styles.spotlightAnim} />
      <div className='max-w-6xl w-full py-12 md:py-24 z-10 relative'>
        <div className='flex flex-col gap-12 text-center items-center'>
          <h1 className='text-6xl leading-short font-extrabold'>
            The Job Hunting App for Software Engineers
          </h1>

          <p className='text-xl max-w-3xl'>
            Stop wasting hours scanning job posts. Leverage LLMs to surface offers that match your
            skills and preferences.
          </p>

          <div className='flex gap-4 justify-center'>
            <Button size='lg' href={LOGIN}>
              Get Started
            </Button>
            <Button
              variant='secondary'
              size='lg'
              href='https://github.com/svensoldin/job-curator-mono'
            >
              See GitHub
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
