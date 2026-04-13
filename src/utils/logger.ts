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

/** Generate a short random request ID for log correlation. */
export function generateRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Detect the AI client from the User-Agent header. */
export function detectClient(userAgent?: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('claude') || ua.includes('anthropic')) return 'claude';
  if (ua.includes('chatgpt') || ua.includes('openai')) return 'chatgpt';
  if (ua.includes('cursor')) return 'cursor';
  if (ua.includes('windsurf')) return 'windsurf';
  if (ua.includes('cline')) return 'cline';
  if (ua.includes('continue')) return 'continue';
  if (ua.includes('mcp-inspector') || ua.includes('inspector')) return 'mcp-inspector';
  if (ua.includes('postman')) return 'postman';
  return 'other';
}

/** Extract MCP JSON-RPC metadata from a request body for logging. */
export function extractMcpInfo(body: unknown): {
  method?: string;
  tool?: string;
  toolArgs?: Record<string, unknown>;
  clientInfo?: Record<string, unknown>;
} {
  if (!body || typeof body !== 'object') return {};
  const msg = body as Record<string, unknown>;
  const method = msg.method as string | undefined;
  const params = msg.params as Record<string, unknown> | undefined;

  const result: {
    method?: string;
    tool?: string;
    toolArgs?: Record<string, unknown>;
    clientInfo?: Record<string, unknown>;
  } = {};
  if (method) result.method = method;

  if (method === 'tools/call' && params) {
    result.tool = params.name as string | undefined;
    const args = params.arguments as Record<string, unknown> | undefined;
    if (args) result.toolArgs = args;
  }

  if (method === 'initialize' && params?.clientInfo) {
    result.clientInfo = params.clientInfo as Record<string, unknown>;
  }

  return result;
}

