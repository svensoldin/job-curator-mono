import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JobResult } from '@/types/database';
import JobResultCard from '@/app/(authenticated)/dashboard/_components/JobResultCard';
import { DASHBOARD } from '@/constants/routes';

interface SearchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SearchDetailPage({ params }: SearchDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: search, error: searchError } = await supabase
    .from('job_searches')
    .select('*')
    .eq('id', id)
    .single();

  if (searchError || !search) {
    redirect(DASHBOARD);
  }

  const { data: jobResults, error: resultsError } = await supabase
    .from('job_results')
    .select('*')
    .eq('search_id', id)
    .order('ai_score', { ascending: false, nullsFirst: false });

  if (resultsError) {
    console.error('Error fetching job results:', resultsError);
  }

  const results = (jobResults || []) as JobResult[];

  const resultCount = results.length;
  const avgAiScore =
    results.length > 0
      ? results.reduce((acc, job) => acc + (job.ai_score || 0), 0) / results.length
      : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Search Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {search.job_title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Location</div>
              <div className="font-medium text-gray-900 dark:text-white">{search.location}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Skills</div>
              <div className="font-medium text-gray-900 dark:text-white">{search.skills}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Salary</div>
              <div className="font-medium text-gray-900 dark:text-white">{search.salary}k€</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Date</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(search.created_at)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-2">
                {resultCount}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Results</span>
            </div>
            {avgAiScore && (
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400 mr-2">
                  {Math.round(avgAiScore)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Score</span>
              </div>
            )}
          </div>
        </div>

        {/* Job Results */}
        {results.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">No results found for this search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((job) => (
              <JobResultCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
