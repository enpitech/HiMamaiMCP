import express, { type Request, type Response, type NextFunction } from 'express';
import config from './utils/config.js';
import logger from './utils/logger.js';
import { HiMamiApiClient } from './services/himami-api.js';
import { createRouter } from './server/routes.js';
import type { Router } from 'express';

const app = express();
app.use(express.json());

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
