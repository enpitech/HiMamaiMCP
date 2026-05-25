import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  HIMAMI_API_BASE_URL: z.string().min(1).default('https://hi-mami.com/api'),
  HIMAMI_USER_AGENT: z.string().min(1).default('HiMamiMCP/1.0'),
  // Optional: the public origin used to build the /img proxy URL. When unset we
  // derive it from Vercel's runtime env (production domain first, then the
  // per-deployment URL), falling back to localhost for local dev.
  MCP_PUBLIC_URL: z.string().optional(),
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

function resolvePublicUrl(): string {
  if (env.MCP_PUBLIC_URL) return env.MCP_PUBLIC_URL;
  // Stable production domain (set automatically by Vercel on the project).
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  // Per-deployment URL (preview/prod), also set by Vercel.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${env.PORT}`;
}

const config = {
  himamiApiBaseUrl: env.HIMAMI_API_BASE_URL,
  himamiUserAgent: env.HIMAMI_USER_AGENT,
  mcpPublicUrl: resolvePublicUrl(),
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
};

export default config;
