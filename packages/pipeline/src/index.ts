export {
  embedText,
  embedBatch,
  processUnembeddedJobs,
} from './services/embedding/embedding.service.js';
export { processPendingSummaries } from './services/job-summary/job-summary.service.js';
export { runForUser, runForAllUsers } from './services/matching/matching.pipeline.js';
export { supabase } from './lib/supabase.js';
export {
  SUPABASE_SCRAPED_JOBS_TABLE,
  SUPABASE_USER_PROFILES_TABLE,
  SUPABASE_MATCH_CACHE_TABLE,
  SUPABASE_JOB_RESULTS_TABLE,
  SUPABASE_JOB_SEARCHES_TABLE,
} from './constants/supabase.js';
export type { Json } from './lib/supabase.types.js';
import logger from './utils/logger.js';
export { logger };
