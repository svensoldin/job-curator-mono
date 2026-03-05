import fs from 'fs';
import path from 'path';
import winston from 'winston';

export function createLogger(service: string): winston.Logger {
  const logsDir: string = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL?.toLowerCase() || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true })
    ),
    defaultMeta: { service },
    transports: [
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: winston.format.json(),
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: winston.format.json(),
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf((info) => `${info['timestamp']} [${info.level}]: ${info.message}`)
        ),
      }),
    ],
  });
}
