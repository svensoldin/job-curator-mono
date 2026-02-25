'use client';

import { useSearchResultsById } from '../_lib/queries';
import JobResultCard from './JobResultCard';
import Text from '@/components/ui/Text/Text';
import SearchSummary from './SearchSummary';

interface Props {
  searchId: string;
}

const SearchDetailsClient = ({ searchId }: Props) => {
  const { data: results, isPending, isError, error } = useSearchResultsById(searchId);

  if (isError) throw new Error(error.message);

  if (isPending) {
    return (
      <div className='text-center py-12 bg-gray-800 rounded-lg border border-gray-700'>
        <Text>Loading results…</Text>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className='text-center py-12 bg-gray-800 rounded-lg border border-gray-700'>
        <Text>No results found for this search</Text>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <SearchSummary id={searchId} />
      <div className='space-y-4'>
        {results.map((job) => (
          <JobResultCard {...job} key={job.id} id={job.id} aiScore={job.ai_score} />
        ))}
      </div>
    </div>
  );
};

export default SearchDetailsClient;
