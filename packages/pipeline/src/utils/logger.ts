import { createLogger } from '@repo/logger';

const logger: ReturnType<typeof createLogger> = createLogger('pipeline');

export default logger;
