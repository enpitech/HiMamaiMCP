# HiMami MCP Server — Action Items

## Phase 1: Project Scaffolding ✅

- [x] **1.1** Create GitHub repo `himami-mcp`
- [x] **1.2** Initialize `package.json` with dependencies
- [x] **1.3** Create `tsconfig.json` (ES2022, NodeNext, strict mode)
- [x] **1.4** Create `vercel.json` (same pattern as Localink)
- [x] **1.5** Create `.env.example`
- [x] **1.6** Create `.gitignore`
- [x] **1.7** Create `eslint.config.js` + `vitest.config.ts`
- [x] **1.8** Create `CLAUDE.md` with project rules & code conventions
- [x] **1.9** Create `.claude/settings.json` with permissions

## Phase 2: Core Services ✅

- [x] **2.1** Create `src/types/index.ts` — All HiMami API response types (30+ interfaces)
- [x] **2.2** Create `src/utils/config.ts` — Zod-validated env config
- [x] **2.3** Create `src/utils/logger.ts` — Pino logger
- [x] **2.4** Create `src/services/himami-api.ts` — Full API client with error handling, timeouts, logging

## Phase 3: MCP Server ✅

- [x] **3.1** Create `src/index.ts` — Express app + Vercel export
- [x] **3.2** Create `src/server/routes.ts` — Express router with CORS, health, MCP, SSE endpoints
- [x] **3.3** Create `src/server/mcp.ts` — 9 tools registered (7 main + 2 ChatGPT compat)

## Phase 4: MCP UI Cards ✅

- [x] **4.1** Create `src/ui/theme.ts` — CSS variables, base styles, RTL support
- [x] **4.2** Create `src/ui/search-card.ts` — Search result compact list (grouped by type)
- [x] **4.3** Create `src/ui/campaign-card.ts` — Full campaign detail card with CTA rendering
- [x] **4.4** Create `src/ui/product-card.ts` — Product detail card with price breakdown
- [x] **4.5** Create `src/ui/brand-card.ts` — Brand page card with deals list
- [x] **4.6** Create `src/ui/category-card.ts` — Category listing card
- [x] **4.7** Create `src/ui/home-card.ts` — Home page highlights + sections
- [x] **4.8** Create `src/ui/templates.ts` — Main entry point routing to specific card renderers

## Phase 5: Testing & Deployment ✅

- [x] **5.1** Write unit tests for `himami-api.ts` (mock fetch, test error handling)
- [x] **5.2** Write unit tests for UI card rendering (snapshot tests)
- [x] **5.3** Write MCP tool registration tests
- [x] **5.4** Test against `https://dev.hi-mami.com/api` (integration)
- [x] **5.5** Deploy to Vercel
- [x] **5.6** Configure Vercel env vars (`HIMAMI_API_BASE_URL`, `HIMAMI_USER_AGENT`)
- [x] **5.7** Test deployed MCP endpoint with Claude Desktop / MCP Inspector
- [x] **5.8** Write `README.md` with setup instructions, MCP config examples

## Estimated Complexity

| Phase | Tasks | Complexity |
|-------|-------|-----------|
| Phase 1 | 9 | Low — mostly boilerplate, copy patterns from Localink |
| Phase 2 | 4 | Medium — type definitions from API docs + API client |
| Phase 3 | 3 | Medium — adapt Localink patterns, simpler (no labels) |
| Phase 4 | 8 | High — most creative work: HTML/CSS card design with RTL |
| Phase 5 | 8 | Medium — testing + deployment |

**Total:** 32 tasks across 5 phases
