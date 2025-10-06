import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DASHBOARD, LOGIN } from '@/routes';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(DASHBOARD);
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-colors'>
      {/* Hero Section */}
      <div className='container mx-auto px-4 py-16 md:py-24'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Logo/Brand */}
          <div className='mb-8'>
            <h1 className='text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4'>
              Job Curator
            </h1>
            <div className='flex justify-center items-center gap-2 text-lg text-gray-600 dark:text-gray-400'>
              <span className='inline-flex items-center'>
                <svg
                  className='w-5 h-5 mr-1'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                </svg>
                AI-Powered
              </span>
              <span className='text-gray-400 dark:text-gray-600'>•</span>
              <span>Intelligent Job Search</span>
            </div>
          </div>

          {/* Headline */}
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6'>
            Stop Scrolling Through
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400'>
              {' '}
              Hundreds of Jobs
            </span>
          </h2>

          <p className='text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed'>
            Let AI do the heavy lifting. We scrape top job boards, analyze every
            listing, and rank them based on your exact criteria—all while you
            focus on what matters.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'>
            <Link
              href={LOGIN}
              className='w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200'
            >
              Get Started Free
            </Link>
            <a
              href='#how-it-works'
              className='w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200'
            >
              See How It Works
            </a>
          </div>

          {/* Social Proof */}
          <div className='text-sm text-gray-500 dark:text-gray-400'>
            <p>
              Powered by{' '}
              <span className='font-semibold text-gray-700 dark:text-gray-300'>
                Mistral AI
              </span>{' '}
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id='how-it-works'
        className='bg-white dark:bg-gray-800 py-20 border-t border-gray-200 dark:border-gray-700'
      >
        <div className='container mx-auto px-4'>
          <div className='max-w-5xl mx-auto'>
            <h3 className='text-3xl font-bold text-center text-gray-900 dark:text-white mb-4'>
              How It Works
            </h3>
            <p className='text-center text-gray-600 dark:text-gray-300 mb-16 max-w-2xl mx-auto'>
              Four simple steps to find your perfect job match
            </p>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
              {/* Step 1 */}
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full mb-4 shadow-lg'>
                  <span className='text-2xl font-bold text-white'>1</span>
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  Define Criteria
                </h4>
                <p className='text-gray-600 dark:text-gray-400 text-sm'>
                  Tell us your job title, location, skills, and salary
                  expectations
                </p>
              </div>

              {/* Step 2 */}
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-full mb-4 shadow-lg'>
                  <span className='text-2xl font-bold text-white'>2</span>
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  AI Scrapes
                </h4>
                <p className='text-gray-600 dark:text-gray-400 text-sm'>
                  Our system scans job boards in real-time
                </p>
              </div>

              {/* Step 3 */}
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 rounded-full mb-4 shadow-lg'>
                  <span className='text-2xl font-bold text-white'>3</span>
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  Smart Analysis
                </h4>
                <p className='text-gray-600 dark:text-gray-400 text-sm'>
                  Our AI analyzes and scores each job against your profile
                </p>
              </div>

              {/* Step 4 */}
              <div className='text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-full mb-4 shadow-lg'>
                  <span className='text-2xl font-bold text-white'>4</span>
                </div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                  Get Results
                </h4>
                <p className='text-gray-600 dark:text-gray-400 text-sm'>
                  Review ranked matches on your dashboard and apply with
                  confidence
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-5xl mx-auto'>
            <h3 className='text-3xl font-bold text-center text-gray-900 dark:text-white mb-4'>
              Why Job Curator?
            </h3>
            <p className='text-center text-gray-600 dark:text-gray-300 mb-16 max-w-2xl mx-auto'>
              Save time and find better matches with intelligent automation
            </p>

            <div className='grid md:grid-cols-3 gap-8'>
              <div className='bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow'>
                <div className='w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4'>
                  <svg
                    className='w-6 h-6 text-green-600 dark:text-green-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <h4 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Save Hours Daily
                </h4>
                <p className='text-gray-600 dark:text-gray-400'>
                  No more endless scrolling. Our AI processes hundreds of
                  listings in minutes while you relax.
                </p>
              </div>

              <div className='bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow'>
                <div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4'>
                  <svg
                    className='w-6 h-6 text-blue-600 dark:text-blue-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <h4 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Better Matches
                </h4>
                <p className='text-gray-600 dark:text-gray-400'>
                  AI scoring ensures you see jobs that truly fit your skills,
                  experience, and goals.
                </p>
              </div>

              <div className='bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow'>
                <div className='w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4'>
                  <svg
                    className='w-6 h-6 text-purple-600 dark:text-purple-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 10V3L4 14h7v7l9-11h-7z'
                    />
                  </svg>
                </div>
                <h4 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                  Real-Time Results
                </h4>
                <p className='text-gray-600 dark:text-gray-400'>
                  Asynchronous processing means fresh results without the wait.
                  Track progress live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 py-16'>
        <div className='container mx-auto px-4 text-center'>
          <h3 className='text-3xl font-bold text-white mb-4'>
            Ready to Find Your Dream Job?
          </h3>
          <p className='text-blue-100 dark:text-blue-200 mb-8 text-lg max-w-2xl mx-auto'>
            Join job seekers who've discovered smarter way to search. Start your
            first AI-powered job search in under 2 minutes.
          </p>
          <Link
            href='/login'
            className='inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200'
          >
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className='bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8'>
        <div className='container mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm'>
          <p className='mb-3'>© 2025 Job Curator. Built by Sven Soldin.</p>
          <a
            href='https://github.com/svensoldin/job-searcher-client'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
                clipRule='evenodd'
              />
            </svg>
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
