import pino from 'pino';
import config from './config.js';

const isDevelopment = config.nodeEnv === 'development';
const isStdio = process.argv.includes('--stdio');

// In stdio mode, MCP SDK uses stdout for JSON-RPC. Logger MUST go to stderr.
const destination = isStdio ? pino.destination(2) : undefined;

const logger = pino(
  isDevelopment && !isStdio
    ? {
        level: config.logLevel,
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : {
        level: config.logLevel,
      },
  destination,
);

export default logger;
