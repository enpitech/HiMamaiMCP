# HiMami MCP Server — Project Plan

## What Is This?

An MCP (Model Context Protocol) server that connects AI agents (Claude, ChatGPT, etc.) to the **Hi Mami** (מאמי) deals & benefits platform. When a user asks an AI agent something like _"find me deals on baby products"_ or _"what discounts does Nike have on Mami?"_, the agent calls our MCP tools, which query the HiMami public API and return rich, interactive HTML cards with live deal information.

## What Is Hi Mami?

**Hi Mami** (hi-mami.com) is an Israeli consumer deals & benefits platform primarily targeting families and parents. Key features:

- **Brands** — Hundreds of partner brands (Nike, Super-Pharm, Pampers, Pizza Hut, etc.)
- **Campaigns** — Time-limited deals with discount codes, vouchers, leading links, and personal codes
- **Products** — Individual product offers with original/discounted pricing
- **Categories** — Beauty, Home & Kitchen, Kids & Babies, Fashion, Electronics, Insurance, Tourism, Food & Grocery
- **Mami Plus** — Premium subscription tier with exclusive deals, gifts, and higher discounts
- **Search** — Full-text search across all brands, campaigns, products, and categories

## Why Build This?

When users ask AI agents about deals, discounts, or product offers in Israel, agents have no structured access to this data. Hi Mami has a comprehensive public API that we can bridge into the MCP ecosystem, giving AI agents real-time access to hundreds of live deals with rich visual presentation.

## Core Architecture

```
┌─────────────────────────────────────────────────┐
│           AI Agent (Claude, ChatGPT, etc.)        │
│  User: "find me deals on baby products"           │
└──────────────┬────────────────────────────────────┘
               │ MCP Streamable HTTP
               ▼
┌─────────────────────────────────────────────────┐
│           HiMami MCP Server                      │
│  Express + @modelcontextprotocol/sdk v1.x        │
│  Streamable HTTP Transport (stateless)           │
│                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  MCP     │  │  HiMami   │  │  MCP UI      │  │
│  │  Tools   │  │  API      │  │  HTML Cards  │  │
│  │  (7)     │  │  Client   │  │  (inline)    │  │
│  └──────────┘  └───────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│         Hi Mami Public API                       │
│         https://hi-mami.com/api                  │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20+ / TypeScript | MCP SDK is TypeScript-first |
| MCP SDK | `@modelcontextprotocol/sdk` v1.x | Stable, production-grade |
| Transport | Streamable HTTP (stateless, per-request) | Modern MCP transport, Vercel-compatible |
| Web Framework | Express 5 | Required for routing |
| API Client | Native `fetch` | No HTTP library needed — HiMami API is simple REST |
| Validation | Zod | Input validation for MCP tools + config |
| Logging | Pino | Structured JSON logging |
| Deployment | Vercel (serverless) | Same pattern as Localink |
| Build | TypeScript (tsc) | Type safety |

**Key difference from Localink:** No database needed. This server is a pure API proxy — all data comes from the HiMami API in real-time. No Firebase, no Firestore, no Google Maps.

## HiMami API Endpoints Used

| MCP Tool | API Endpoint(s) | Auth Required |
|----------|-----------------|---------------|
| `search_deals` | `GET /api/v1/search` | No |
| `get_suggestions` | `GET /api/v1/search/suggestions` | No |
| `get_brand` | `GET /api/v1/brands/:brandSlug` | No |
| `get_campaign` | `GET /api/v1/campaigns/:campaignId` | No |
| `get_product` | `GET /api/v1/products/:productId` | No |
| `browse_categories` | `GET /api/v1/categories/*path` + `GET /api/v1/brands` | No |
| `get_home_page` | `GET /api/v1/home-page` | No |

All endpoints are public (no auth needed for read-only access). We only need a `User-Agent` header.

## MCP Tools Design

### Tool 1: `search_deals`

**Purpose:** Full-text search across brands, campaigns, products, and categories.

```typescript
inputSchema: {
  query: z.string().min(2).describe('Search query, e.g. "nike", "baby products", "pizza deals"'),
  type: z.enum(['BRAND', 'CAMPAIGN', 'PRODUCT', 'CATEGORY']).optional()
    .describe('Optional: filter results to a specific type'),
  limit: z.number().optional().default(10)
    .describe('Max results per group (default: 10)'),
}
```

**Returns:** Rich HTML cards showing search results grouped by type (brands, campaigns, products, categories). Each result is a clickable card with image, title, and key info. Also returns `structuredContent` with the raw API response.

**UI Card:** Search results list with grouped sections, each item showing thumbnail, title, and deal summary.

---

### Tool 2: `get_suggestions`

**Purpose:** Autocomplete/typeahead for deal search.

```typescript
inputSchema: {
  query: z.string().min(1).describe('Partial search query for autocomplete'),
  limit: z.number().optional().default(5).describe('Max suggestions'),
}
```

**Returns:** List of suggestions with type, title, image, and link. Text-only response (no HTML cards needed — this is a lightweight helper tool).

---

### Tool 3: `get_brand`

**Purpose:** Get a brand page with its metadata and active deals/campaigns.

```typescript
inputSchema: {
  brand_slug: z.string().describe('Brand URL slug, e.g. "nike", "pampers", "pizzahut"'),
  page: z.number().optional().default(1).describe('Page number for deals'),
  page_size: z.number().optional().default(20).describe('Items per page'),
}
```

**Returns:** Rich HTML brand card with logo, description, and a list of active campaign/product cards. `structuredContent` with full brand metadata + page sections.

**UI Card:** Brand hero card (logo + main media + description) followed by a grid of campaign cards.

---

### Tool 4: `get_campaign`

**Purpose:** Get full details of a specific campaign/deal.

```typescript
inputSchema: {
  campaign_id: z.string().describe('Campaign ID (returned by search or brand page)'),
}
```

**Returns:** Rich HTML campaign detail card with:
- Brand logo + name
- Campaign title + description
- Discount percentage / price info
- Expiration date + tag (ends today, ends tomorrow, etc.)
- CTA (call-to-action) with redemption instructions
- Tier badge (Standard vs Mami Plus exclusive)

**UI Card:** Full campaign detail card with all conversion action info (code, link, phone number, etc.).

---

### Tool 5: `get_product`

**Purpose:** Get full details of a specific product offer.

```typescript
inputSchema: {
  product_id: z.string().describe('Product ID (returned by search or campaign page)'),
}
```

**Returns:** Rich HTML product card with:
- Product image
- Product title + description
- Original price vs discounted price (strikethrough)
- Discount amount/percentage
- Brand info
- Expiration date
- CTA for redemption

**UI Card:** Product detail card with pricing breakdown and conversion action.

---

### Tool 6: `browse_categories`

**Purpose:** Browse the category tree or a specific category with its deals.

```typescript
inputSchema: {
  category_path: z.string().optional().default('')
    .describe('Category path, e.g. "fashion", "fashion/women/shoes". Empty = root categories'),
}
```

**Returns:** Category page with metadata (title, thumbnail) and a list of section items (campaigns, products, brands). `structuredContent` with full category data.

**UI Card:** Category header + grid of deal cards from that category.

---

### Tool 7: `get_home_page`

**Purpose:** Get the featured deals and sections from the home page.

```typescript
inputSchema: {
  page: z.number().optional().default(1).describe('Page number for sections'),
  page_size: z.number().optional().default(10).describe('Sections per page'),
}
```

**Returns:** Home page hero banners + highlights + first set of page sections with featured deals. Good for "show me what's new" or "what deals are available today".

**UI Card:** Banner carousel + highlights + featured sections grid.

---

### ChatGPT Connector Tools

For ChatGPT Connectors compatibility (same SSE pattern as Localink):

- **`search`** — Maps to `search_deals` but returns simplified JSON
- **`fetch`** — Takes an entity type + ID, returns the details as text

## MCP UI Card Design

All HTML cards use **inline CSS** (MCP iframes cannot load external stylesheets).

### Design Language

- **Primary color:** `#FF6B9D` (Mami pink — derived from the site's branding)
- **Secondary color:** `#FFF5F8` (light pink background)
- **Accent color:** `#2D1B69` (deep purple for CTAs)
- **Font:** System font stack (no external fonts in MCP)
- **Card style:** Rounded corners (12px), subtle shadows, clean modern layout
- **RTL support:** All cards use `dir="rtl"` since Hi Mami is a Hebrew platform
- **Responsive:** Cards are responsive within MCP iframe constraints

### Card Types

#### 1. Search Result Card (Compact)
```
┌────────────────────────────────────────────┐
│ 🔍 Found 12 deals for "nike"               │
├────────────────────────────────────────────┤
│ [img] Nike - 50% off running shoes    ✨   │
│       Ends Apr 30 · MAMI_PLUS              │
│ [img] Nike Air Max 90 - ₪299.95      💰   │
│       Was ₪599.90 · -50%                   │
│ [img] Nike Store                      🏷   │
│       Fashion > Sports                      │
└────────────────────────────────────────────┘
```

#### 2. Campaign Detail Card
```
┌────────────────────────────────────────────┐
│ [brand logo]  Nike                         │
│ ─────────────────────────────────────────  │
│ [main image]                               │
│                                            │
│ 50% off running shoes                      │
│ "Get 50% discount on all running..."       │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 🏷 Discount Code: NIKE50            │   │
│ │ 🔗 Redeem at nike.com               │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ⏰ Ends Apr 30, 2026  ·  ⭐ Mami Plus     │
└────────────────────────────────────────────┘
```

#### 3. Product Card
```
┌────────────────────────────────────────────┐
│ [product image]                            │
│                                            │
│ Air Max 90                                 │
│ Nike                                       │
│                                            │
│  ₪599.90  →  ₪299.95                      │
│  -50% (save ₪299.95)                      │
│                                            │
│ [Redeem Deal →]                            │
│                                            │
│ ⏰ Ends Apr 30, 2026                       │
└────────────────────────────────────────────┘
```

#### 4. Brand Card
```
┌────────────────────────────────────────────┐
│ [brand logo]  [main media banner]          │
│                                            │
│ Nike                                       │
│ "Just Do It — exclusive deals..."          │
│                                            │
│ Active Deals:                              │
│ ├── 50% off running shoes (DISCOUNT)       │
│ ├── Free shipping on orders over ₪200      │
│ └── + 5 more campaigns                     │
└────────────────────────────────────────────┘
```

## File Structure

```
himami-mcp/
├── src/
│   ├── index.ts                    # Express entry point + Vercel export
│   ├── server/
│   │   ├── routes.ts               # Express router: /health, /mcp (POST/GET/DELETE), SSE
│   │   └── mcp.ts                  # MCP tool registration (7 tools + 2 ChatGPT)
│   ├── services/
│   │   └── himami-api.ts           # HiMami API client (fetch wrapper)
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces (API response types)
│   ├── ui/
│   │   ├── templates.ts            # Main entry: renderSearchResults, renderCampaignCard, etc.
│   │   ├── search-card.ts          # Search result compact list
│   │   ├── campaign-card.ts        # Full campaign detail card
│   │   ├── product-card.ts         # Product detail card with pricing
│   │   ├── brand-card.ts           # Brand page card
│   │   ├── category-card.ts        # Category listing card
│   │   └── theme.ts                # CSS custom properties + base styles + RTL
│   └── utils/
│       ├── config.ts               # Zod-validated env config
│       └── logger.ts               # Pino logger
├── tests/
│   ├── server/mcp.test.ts
│   ├── services/himami-api.test.ts
│   └── ui/templates.test.ts
├── .claude/
│   ├── settings.json               # Claude Code permissions
│   └── commands/
│       ├── build.md
│       ├── dev.md
│       └── test.md
├── CLAUDE.md                       # Claude Code project instructions
├── PLAN.md                         # This file
├── ACTION_ITEMS.md                 # Task breakdown
├── package.json
├── tsconfig.json
├── vercel.json
├── vitest.config.ts
├── eslint.config.js
├── .env.example
├── .gitignore
└── README.md
```

## Environment Variables

```env
# Required
HIMAMI_API_BASE_URL=https://hi-mami.com/api    # or https://dev.hi-mami.com/api for dev
HIMAMI_USER_AGENT=HiMamiMCP/1.0                # User-Agent header for API calls

# Optional
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

**Note:** No API key or auth token needed — all endpoints we use are public. We only need a valid `User-Agent` header.

## HiMami API Client Design

A single service class `HiMamiApiClient` wraps all API calls:

```typescript
class HiMamiApiClient {
  constructor(baseUrl: string, userAgent: string);

  // Search
  search(query: string, type?: string, limit?: number): Promise<SearchResults>;
  suggestions(query: string, limit?: number): Promise<Suggestions>;

  // Brands
  getBrand(brandSlug: string): Promise<BrandPage>;
  getBrandSections(brandSlug: string, page?: number, pageSize?: number): Promise<PageSectionList>;

  // Campaigns
  getCampaign(campaignId: string): Promise<CampaignPage>;
  getCampaignSections(campaignId: string, page?: number, pageSize?: number): Promise<PageSectionList>;

  // Products
  getProduct(productId: string): Promise<ProductPage>;

  // Categories
  getCategories(path?: string): Promise<CategoryPage>;
  getBrandsRoot(): Promise<CategoryPage>;

  // Home
  getHomePage(): Promise<HomePage>;
  getHomePageSections(page?: number, pageSize?: number): Promise<PageSectionList>;

  // Navigation
  getNavigation(type: 'menu' | 'bar' | 'footer'): Promise<Navigation>;
}
```

All methods:
- Set `User-Agent` header
- Handle errors gracefully (return typed error objects, never throw unhandled)
- Log requests/responses via pino
- Apply reasonable timeouts (10s)

## Deployment

### Vercel Configuration

Same serverless pattern as Localink:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["src/**", "package.json", "tsconfig.json"]
      }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "src/index.ts" }
  ]
}
```

### MCP Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/mcp` | Primary Streamable HTTP MCP endpoint |
| GET | `/mcp` | SSE compatibility |
| DELETE | `/mcp` | Session cleanup stub |
| GET | `/mcp/sse` | SSE endpoint (ChatGPT Connectors) |
| POST | `/mcp/sse` | SSE message handler |
| GET | `/health` | Health check |

**No label slug needed** (unlike Localink) — this is a single-purpose MCP server for HiMami only.

## RTL / Hebrew Considerations

Since Hi Mami is a Hebrew platform, all UI cards must:

1. Use `dir="rtl"` on the root HTML element
2. Use `text-align: right` by default
3. Flip flex direction where appropriate (price strikethrough → RTL order)
4. Handle mixed LTR content (brand names in English, prices with ₪ symbol)
5. Use `unicode-bidi: embed` for mixed-direction content
6. Ensure the AI agent response text is in the user's language (the agent handles this naturally)

## Error Handling Strategy

1. **API errors** → Return user-friendly error messages in the MCP response with `isError: true`
2. **Network timeouts** → 10s timeout, return "Service temporarily unavailable"
3. **404s** → "Brand/campaign/product not found. Try searching for it."
4. **Rate limits** → Return "Too many requests, please try again in a moment"
5. **Invalid input** → Zod validation errors surfaced as clear messages

## Security Considerations

1. **No user auth forwarding** — This MCP server only uses public API endpoints. No JWT tokens are forwarded.
2. **User-Agent header** — Required by HiMami API. We use a static identifier, not user-provided.
3. **Input validation** — All tool inputs validated via Zod before hitting the API.
4. **No PII** — No personal data is collected, stored, or forwarded.
5. **CORS** — Permissive CORS for MCP client compatibility.
6. **Rate limiting** — Rely on HiMami's own rate limiting; our server adds no additional load.

## Testing Strategy

- **Unit tests** for UI card rendering (snapshot tests)
- **Unit tests** for API client (mock fetch responses)
- **Integration tests** against `https://dev.hi-mami.com/api` (opt-in, requires network)
- **MCP protocol tests** for tool registration and response format

## Action Items Summary

See [ACTION_ITEMS.md](./ACTION_ITEMS.md) for the detailed task breakdown.

**Phase 1:** Project scaffolding (package.json, tsconfig, vercel.json, config)
**Phase 2:** HiMami API client + TypeScript types
**Phase 3:** MCP tools registration + server routes
**Phase 4:** MCP UI cards (HTML/CSS)
**Phase 5:** Tests + deployment
