import JobResultCard from '@/app/(authenticated)/search/[id]/_components/JobResultCard';
import SearchSummary from '@/app/(authenticated)/search/[id]/_components/SearchSummary';

import { fetchAllSearchTasks, fetchSearchResultsById, fetchSingleSearchById } from './_lib/queries';

interface SearchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SearchDetailPage({ params }: SearchDetailPageProps) {
  const searchId = (await params).id;
  const results = await fetchSearchResultsById(searchId);
  const searchTask = await fetchSingleSearchById(searchId);
  return (
    <div className='container mx-auto px-4 py-8'>
      <SearchSummary
        title={searchTask.job_title}
        location={searchTask.location}
        skills={searchTask.skills}
        salary={searchTask.salary}
        createdAt={searchTask.created_at}
        resultCount={results.length}
      />

      {results.length === 0 ? (
        <div className='text-center py-12 bg-gray-800 rounded-lg border border-gray-700'>
          <p className='text-gray-400'>No results found for this search</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {results.map((job) => (
            <JobResultCard
              key={job.id}
              id={job.id}
              title={job.title}
              company={job.company}
              source={job.source}
              aiScore={job.ai_score}
              description={job.description}
              url={job.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  const searchTasks = await fetchAllSearchTasks();

  return searchTasks.map((task) => ({
    id: task.id,
  }));
}
