// utils/logger.ts
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} \n[${level.toUpperCase()}]: ${message} \n${JSON.stringify(meta)}\n`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: './logs/app.log' }),
  ],
});

export { logger };
