import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type { Database } from './supabase.types.js';

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
