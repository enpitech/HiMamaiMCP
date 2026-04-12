import { Router, type Request, type Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { HiMamiApiClient } from '../services/himami-api.js';
import { registerTools } from './mcp.js';
import { getDemoPageHtml, handleDemoApi } from './demo.js';
import logger from '../utils/logger.js';

// In-memory session store for SSE transports (one per live connection)
const sseTransports = new Map<string, SSEServerTransport>();

// ---------------------------------------------------------------------------
// CORS middleware helper
// ---------------------------------------------------------------------------

function setCorsHeaders(res: Response): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

// ---------------------------------------------------------------------------
// MCP handler — shared between GET and POST
// ---------------------------------------------------------------------------

async function handleMcpRequest(
  req: Request,
  res: Response,
  apiClient: HiMamiApiClient,
): Promise<void> {
  const server = new McpServer({ name: 'himami', version: '1.0.0' });
  registerTools(server, apiClient);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  transport.onerror = (err) => logger.error({ err }, 'MCP transport error');
  res.on('close', () => { void transport.close(); });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createRouter(apiClient: HiMamiApiClient): Router {
  const router = Router();

  // Apply CORS to all routes
  router.use((_req, res, next) => {
    setCorsHeaders(res);
    next();
  });

  // OPTIONS preflight
  router.options('/{*path}', (_req, res) => {
    res.sendStatus(204);
  });

  // Health check
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'himami-mcp',
      timestamp: new Date().toISOString(),
    });
  });

  // SSE endpoint — GET (ChatGPT Connectors: establishes SSE stream)
  router.get('/mcp/sse', (req, res) => {
    const server = new McpServer({ name: 'himami', version: '1.0.0' });
    registerTools(server, apiClient);

    const transport = new SSEServerTransport('/mcp/sse', res);
    sseTransports.set(transport.sessionId, transport);

    transport.onerror = (err) => logger.error({ err }, 'SSE transport error');
    res.on('close', () => {
      sseTransports.delete(transport.sessionId);
      void transport.close();
    });

    server.connect(transport).catch((err: unknown) => {
      logger.error({ err }, 'SSE server.connect error');
    });
  });

  // SSE endpoint — POST (ChatGPT Connectors: receives client messages)
  router.post('/mcp/sse', (req, res) => {
    const sessionId = (req.query['sessionId'] as string | undefined) ?? '';
    const transport = sseTransports.get(sessionId);

    if (transport) {
      transport.handlePostMessage(req, res, req.body).catch((err: unknown) => {
        logger.error({ err }, 'SSE handlePostMessage error');
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    } else {
      // Different process instance (serverless) — handle stateless
      handleMcpRequest(req, res, apiClient).catch((err: unknown) => {
        logger.error({ err }, 'SSE fallback handleMcpRequest error');
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    }
  });

  // MCP endpoint — POST (primary Streamable HTTP transport)
  router.post('/mcp', (req, res) => {
    handleMcpRequest(req, res, apiClient).catch((err: unknown) => {
      logger.error({ err }, 'Unhandled error in POST /mcp');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  // MCP endpoint — GET (SSE compatibility)
  router.get('/mcp', (req, res) => {
    handleMcpRequest(req, res, apiClient).catch((err: unknown) => {
      logger.error({ err }, 'Unhandled error in GET /mcp');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  // MCP endpoint — DELETE (session cleanup stub)
  router.delete('/mcp', (_req, res) => {
    res.sendStatus(200);
  });

  // Demo page — interactive UI card viewer
  router.get('/demo', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(getDemoPageHtml());
  });

  // Demo API — renders HTML cards for the demo page
  router.get('/demo/api/{*path}', (req, res) => {
    const path = '/' + (req.params.path ?? '');
    const query = req.query as Record<string, string>;
    handleDemoApi(path, query, apiClient)
      .then((result) => res.json(result))
      .catch((err: unknown) => {
        logger.error({ err }, 'Demo API error');
        res.status(500).json({ error: 'Internal server error' });
      });
  });

  return router;
}
