# HiMami MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with access to deals, discounts, and offers from the [Hi Mami](https://hi-mami.com) platform — Israel's popular deals and benefits site.

## Features

- **9 MCP Tools** — search deals, browse brands/campaigns/products/categories, view home page
- **Rich HTML Cards** — visual MCP UI cards with RTL Hebrew support, discount badges, CTA buttons
- **ChatGPT Connectors** — SSE transport compatibility for ChatGPT integration
- **Vercel Deployment** — serverless deployment with zero cold-start overhead

## Tools

| Tool | Description |
|------|-------------|
| `search_deals` | Search for deals across brands, campaigns, products, categories |
| `get_suggestions` | Autocomplete suggestions for search queries |
| `get_brand` | Get a brand page with logo, description, and active deals |
| `get_campaign` | Get full campaign details with discount codes, links, expiration |
| `get_product` | Get product details with pricing breakdown |
| `browse_categories` | Browse deal categories (nested paths supported) |
| `get_home_page` | Get featured deals, hot offers, and highlights |
| `search` | ChatGPT-compatible search tool |
| `fetch` | ChatGPT-compatible entity fetch tool |

## Setup

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `HIMAMI_API_BASE_URL` | `https://hi-mami.com/api` | Hi Mami API base URL |
| `HIMAMI_USER_AGENT` | `HiMamiMCP/1.0` | User-Agent header for API requests |
| `PORT` | `3000` | Local dev server port |
| `NODE_ENV` | `development` | Environment |
| `LOG_LEVEL` | `info` | Pino log level |

### Run Locally

```bash
npm run dev
```

Server starts at `http://localhost:3000`. Health check: `GET /health`.

### Build

```bash
npm run build
```

## MCP Client Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "himami": {
      "url": "https://your-deployment.vercel.app/mcp"
    }
  }
}
```

### Cursor / Windsurf

Add to `.cursor/mcp.json` or equivalent:

```json
{
  "mcpServers": {
    "himami": {
      "url": "https://your-deployment.vercel.app/mcp",
      "transport": "streamable-http"
    }
  }
}
```

## Deployment

### Vercel

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `HIMAMI_API_BASE_URL`
- `HIMAMI_USER_AGENT`
- `NODE_ENV=production`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/mcp` | MCP Streamable HTTP (primary) |
| `GET` | `/mcp` | SSE session initiation |
| `GET` | `/mcp/sse` | ChatGPT SSE stream |
| `POST` | `/mcp/sse` | ChatGPT message endpoint |

## Project Structure

```
src/
├── index.ts              # Express app entry point
├── server/
│   ├── routes.ts         # Express routes (health, MCP, SSE)
│   └── mcp.ts            # MCP tool registration
├── services/
│   └── himami-api.ts     # Hi Mami API client
├── ui/
│   ├── theme.ts          # CSS variables & base styles
│   ├── templates.ts      # Re-exports all card renderers
│   ├── search-card.ts    # Search results card
│   ├── campaign-card.ts  # Campaign detail card
│   ├── product-card.ts   # Product detail card
│   ├── brand-card.ts     # Brand page card
│   ├── category-card.ts  # Category listing card
│   └── home-card.ts      # Home page card
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    ├── config.ts         # Zod-validated env config
    └── logger.ts         # Pino logger
```

## License

MIT
