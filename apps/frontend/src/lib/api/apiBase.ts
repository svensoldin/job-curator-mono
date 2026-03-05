const base = process.env.NEXT_PUBLIC_JOB_SCRAPER_URL;
if (!base) throw new Error('NEXT_PUBLIC_JOB_SCRAPER_URL is not set');
export const BASE = base;
