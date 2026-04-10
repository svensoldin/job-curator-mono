import { supabase, SUPABASE_MATCH_CACHE_TABLE, SUPABASE_SCRAPED_JOBS_TABLE } from '@repo/pipeline';
import logger from './logger';

export async function emptyJobsTables() {
  try {
    const { status } = await supabase.from(SUPABASE_SCRAPED_JOBS_TABLE).delete().neq('id', -1);
    if (status !== 204) logger.error('Failed to empty scraped jobs table, status:', status);

    const { status: matchStatus } = await supabase
      .from(SUPABASE_MATCH_CACHE_TABLE)
      .delete()
      .neq('id', '1');
    if (matchStatus !== 204)
      logger.error('Failed to empty match cache table, status:', matchStatus);
  } catch (err) {
    logger.error('An error occurred while trying to empty jobs table', err);
  }
}
