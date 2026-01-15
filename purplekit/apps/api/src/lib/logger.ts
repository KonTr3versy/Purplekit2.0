import pino from 'pino';
import { config } from '../config';

const transport = config.logging.format === 'pretty' && config.isDev
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const logger = pino({
  level: config.logging.level,
  transport,
  base: {
    env: config.env,
    version: config.version,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export type Logger = typeof logger;
