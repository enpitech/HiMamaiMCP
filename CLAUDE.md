# HiMami MCP Server

MCP server for the Hi Mami deals & benefits platform. No database — pure API proxy to Hi Mami's public REST API.

## Architecture
- See @PLAN.md for full architecture and data model
- See @ACTION_ITEMS.md for task breakdown

## Stack
TypeScript, Node.js 20+, Express 5, MCP SDK v1.x (Streamable HTTP), Zod, Pino

## Commands
```
npm run dev       # Start dev server (tsx watch)
npm run build     # TypeScript compile
npm run test      # Vitest
npm run lint      # ESLint
```

## Code Rules
- **TypeScript strict mode** — no `any` types unless absolutely unavoidable
- **ES modules** — `import/export`, NOT `require/module.exports`
- **Zod** for all runtime validation (MCP tool inputs, config, API responses)
- **Async/await** — no raw promises or callbacks
- **Stateless MCP** — create fresh McpServer per HTTP request. NEVER reuse across requests
- **Inline CSS** — all MCP UI cards must include CSS inline. No external stylesheet references
- **RTL support** — all HTML cards use `dir="rtl"` for Hebrew content
- **Error handling** — wrap all tool handlers in try/catch. Return user-friendly error messages, log full errors
- **No database** — all data comes from HiMami API in real-time via `src/services/himami-api.ts`

## File Structure
```
src/
  index.ts                    # Entry point: Express + Vercel export
  server/mcp.ts               # MCP tool registration (7 tools + 2 ChatGPT compat)
  server/routes.ts            # Express routes
  services/himami-api.ts      # HiMami REST API client
  ui/                         # HTML card templates
    templates.ts              # Main entry point
    search-card.ts            # Search result list
    campaign-card.ts          # Campaign detail card
    product-card.ts           # Product detail card
    brand-card.ts             # Brand page card
    category-card.ts          # Category listing
    home-card.ts              # Home page highlights
    theme.ts                  # CSS generation + RTL base styles
  types/index.ts              # All TypeScript interfaces
  utils/config.ts             # Env config with Zod validation
  utils/logger.ts             # Pino logger
```

## MCP Server Pattern (IMPORTANT)
```typescript
// CORRECT: fresh server per request, stateless
app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'himami', version: '1.0.0' });
  registerTools(server, apiClient);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,  // stateless
    enableJsonResponse: true
  });
  transport.onerror = (err) => logger.error(err);
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

## HiMami API
- Base URL: `https://hi-mami.com/api` (prod) or `https://dev.hi-mami.com/api` (dev)
- All endpoints require `User-Agent` header
- No auth needed for read-only endpoints we use
- See @api-docs.md for full API documentation

## Testing
- Use `vitest` for all tests
- Mock `fetch` for API client tests
- Snapshot test HTML card output
- Integration tests against dev API (opt-in)

## Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- One feature per PR
