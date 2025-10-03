import JobList from '@/app/components/JobList';
import { getAllJobs } from '@/lib/db';

export default async function Home() {
  const jobs = (await getAllJobs()).sort((a, b) => b.score - a.score);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 transition-colors'>
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Welcome Sven, here are the top listings of the week:
          </h1>
        </div>

        <JobList jobs={jobs} />

        <div className='mt-8 flex justify-center'>
          <p className='text-gray-600 dark:text-gray-400'>
            Displayed {jobs.length} job postings
          </p>
        </div>
      </div>
    </div>
  );
}
