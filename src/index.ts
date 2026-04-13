import express, { type Request, type Response, type NextFunction } from 'express';
import config from './utils/config.js';
import logger, { generateRequestId, detectClient, extractMcpInfo } from './utils/logger.js';
import { HiMamiApiClient } from './services/himami-api.js';
import { createRouter } from './server/routes.js';
import type { Router } from 'express';

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Request logging middleware — logs every HTTP request with timing + client info
// ---------------------------------------------------------------------------

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const client = detectClient(req.headers['user-agent']);
  const mcpInfo = extractMcpInfo(req.body);

  res.setHeader('X-Request-Id', requestId);

  logger.info({
    event: 'http.request.start',
    requestId,
    method: req.method,
    path: req.path,
    client,
    userAgent: req.headers['user-agent'],
    ip: req.ip ?? req.headers['x-forwarded-for'],
    ...(mcpInfo.method ? { mcpMethod: mcpInfo.method } : {}),
    ...(mcpInfo.tool ? { mcpTool: mcpInfo.tool } : {}),
    ...(mcpInfo.toolArgs ? { mcpToolArgs: mcpInfo.toolArgs } : {}),
    ...(mcpInfo.clientInfo ? { mcpClientInfo: mcpInfo.clientInfo } : {}),
  }, `-> ${req.method} ${req.path}${mcpInfo.tool ? ` [${mcpInfo.tool}]` : ''}`);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logData = {
      event: 'http.request.end',
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
      client,
      contentLength: res.getHeader('content-length'),
      ...(mcpInfo.method ? { mcpMethod: mcpInfo.method } : {}),
      ...(mcpInfo.tool ? { mcpTool: mcpInfo.tool } : {}),
    };
    if (res.statusCode >= 500) {
      logger.error(logData, `<- ${req.method} ${req.path} ${res.statusCode} (${durationMs}ms)`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `<- ${req.method} ${req.path} ${res.statusCode} (${durationMs}ms)`);
    } else {
      logger.info(logData, `<- ${req.method} ${req.path} ${res.statusCode} (${durationMs}ms)`);
    }
  });

  next();
});

// Initialise services once — shared across all requests.
const routerPromise: Promise<Router> = (async () => {
  const apiClient = new HiMamiApiClient(config.himamiApiBaseUrl, config.himamiUserAgent);
  logger.info({ baseUrl: config.himamiApiBaseUrl }, 'HiMami API client initialized');
  return createRouter(apiClient);
})();

// All requests wait for init, then are handled by the router.
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const router = await routerPromise;
    router(req, res, next);
  } catch (err) {
    logger.error({ err }, 'Startup error — could not initialise services');
    res.status(503).json({ error: 'Service unavailable — startup failed' });
  }
});

// Export for Vercel (and any other serverless runtime)
export default app;

// Start listening when running directly (local dev without Vercel CLI)
if (!process.env.VERCEL && config.nodeEnv !== 'test') {
  routerPromise
    .then(() => {
      app.listen(config.port, () => {
        logger.info({ port: config.port }, `HiMami MCP server running on port ${config.port}`);
        console.log(`\n  🚀 HiMami MCP server ready at:\n\n     Local:   http://localhost:${config.port}\n     MCP:     http://localhost:${config.port}/mcp\n     Health:  http://localhost:${config.port}/health\n`);
      });
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Fatal startup error');
      process.exit(1);
    });
}
