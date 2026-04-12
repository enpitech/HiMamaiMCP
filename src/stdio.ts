#!/usr/bin/env node
/**
 * Stdio entry point for Claude Desktop and other stdio-based MCP hosts.
 * Usage: node dist/stdio.js
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import config from './utils/config.js';
import { HiMamiApiClient } from './services/himami-api.js';
import { createMcpServer } from './server/mcp.js';

const apiClient = new HiMamiApiClient(config.himamiApiBaseUrl, config.himamiUserAgent);
const server = createMcpServer(apiClient);
const transport = new StdioServerTransport();
await server.connect(transport);
