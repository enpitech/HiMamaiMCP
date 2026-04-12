import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  HIMAMI_API_BASE_URL: z.string().min(1).default('https://hi-mami.com/api'),
  HIMAMI_USER_AGENT: z.string().min(1).default('HiMamiMCP/1.0'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.string().default('info'),
});

const result = configSchema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${missing}`);
}

const env = result.data;

const config = {
  himamiApiBaseUrl: env.HIMAMI_API_BASE_URL,
  himamiUserAgent: env.HIMAMI_USER_AGENT,
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
};

export default config;
