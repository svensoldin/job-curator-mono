import { formatDate } from '@/helpers';
import { useSearchTaskById } from '../_lib/queries';

interface SearchSummaryProps {
  id: string;
}

const SearchSummary = ({ id }: SearchSummaryProps) => {
  const { data, isPending, isError, error } = useSearchTaskById(id);
  if (isError) throw new Error(error.message);
  if (isPending) return <h1>Loading</h1>;

  const {
    job_title: title,
    location,
    skills,
    salary,
    created_at: createdAt,
    total_jobs: resultCount,
  } = data;
  return (
    <div className='bg-gray-950 rounded-lg shadow-lg border border-gray-700 p-6 mb-6'>
      <h1 className='text-2xl font-bold text-white mb-4'>{title}</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
        <div>
          <div className='text-sm text-gray-400'>Location</div>
          <div className='font-medium text-white'>{location}</div>
        </div>
        <div>
          <div className='text-sm text-gray-400'>Skills</div>
          <div className='font-medium text-white'>{skills}</div>
        </div>
        <div>
          <div className='text-sm text-gray-400'>Salary</div>
          <div className='font-medium text-white'>{salary}k€</div>
        </div>
        {createdAt ? (
          <div>
            <div className='text-sm text-gray-400'>Date</div>
            <div className='font-medium text-white'>{formatDate(createdAt)}</div>
          </div>
        ) : null}
      </div>

      <div className='flex items-center space-x-4 pt-4 border-t border-gray-700'>
        <div className='flex items-center'>
          <span className='text-2xl font-bold text-blue-400 mr-2'>{resultCount}</span>
          <span className='text-sm text-gray-400'>Results</span>
        </div>
      </div>
    </div>
  );
};

export default SearchSummary;
