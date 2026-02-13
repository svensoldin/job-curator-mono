import {} from '@mono/types';

/**
 * POST request to fetch all of the user's searches
 * @param id the user's id in database
 */
export const getAllSearches = async (id: string) => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_JOB_SCRAPER_URL}/jobs/results`, {
    method: 'POST',
    body: JSON.stringify({
      userId: id,
    }),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  const json = await res.json();

  return json;
};
