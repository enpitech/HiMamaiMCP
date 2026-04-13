import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import type { HiMamiApiClient } from '../services/himami-api.js';
import { HiMamiApiError } from '../services/himami-api.js';
import {
  formatSearchResults,
  formatBrandPage,
  formatCampaignDetail,
  formatProductDetail,
  formatCategoryPage,
} from '../ui/formatters.js';
import {
  renderSearchResultsBody,
  renderBrandPageBody,
  renderCampaignDetailBody,
  renderProductDetailBody,
  renderCategoryPageBody,
  searchCSS,
  brandCSS,
  campaignCSS,
  productCSS,
  categoryCSS,
} from '../ui/templates.js';
import type {
  SearchResults,
  BrandPage,
  CampaignPage,
  ProductPage,
  CategoryPage,
} from '../types/index.js';
import { createMcpAppShell } from '../ui/theme.js';
import config from '../utils/config.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/** Create a fully configured McpServer with all tools and resources registered. */
export function createMcpServer(api: HiMamiApiClient): McpServer {
  const server = new McpServer({ name: 'himami', version: '1.0.0' });
  registerTools(server, api);
  return server;
}

export function registerTools(server: McpServer, api: HiMamiApiClient): void {

  // ---------------------------------------------------------------------------
  // Static app shells — each resource returns a static HTML template that
  // receives tool result data via PostMessage (ui/notifications/tool-result).
  // The shell embeds the handshake + tool-result listener + all CSS.
  // ---------------------------------------------------------------------------

  const proxyBase = config.mcpPublicUrl;
  const searchShell = createMcpAppShell(searchCSS, proxyBase);
  const brandShell = createMcpAppShell(brandCSS, proxyBase);
  const campaignShell = createMcpAppShell(campaignCSS, proxyBase);
  const productShell = createMcpAppShell(productCSS, proxyBase);
  const categoryShell = createMcpAppShell(categoryCSS, proxyBase);

  // ---------------------------------------------------------------------------
  // UI Resources — static app shells fetched by hosts for iframe rendering
  // ---------------------------------------------------------------------------

  registerAppResource(server, 'Search Results UI', 'ui://himami/search', {
    description: 'Visual search results card for Hi Mami deals',
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({
    contents: [{ uri: 'ui://himami/search', mimeType: RESOURCE_MIME_TYPE, text: searchShell }],
  }));

  registerAppResource(server, 'Brand Page UI', 'ui://himami/brand', {
    description: 'Visual brand page card for Hi Mami',
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({
    contents: [{ uri: 'ui://himami/brand', mimeType: RESOURCE_MIME_TYPE, text: brandShell }],
  }));

  registerAppResource(server, 'Campaign Detail UI', 'ui://himami/campaign', {
    description: 'Visual campaign/deal detail card for Hi Mami',
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({
    contents: [{ uri: 'ui://himami/campaign', mimeType: RESOURCE_MIME_TYPE, text: campaignShell }],
  }));

  registerAppResource(server, 'Product Detail UI', 'ui://himami/product', {
    description: 'Visual product detail card for Hi Mami',
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({
    contents: [{ uri: 'ui://himami/product', mimeType: RESOURCE_MIME_TYPE, text: productShell }],
  }));

  registerAppResource(server, 'Category Page UI', 'ui://himami/category', {
    description: 'Visual category listing card for Hi Mami',
    mimeType: RESOURCE_MIME_TYPE,
  }, async () => ({
    contents: [{ uri: 'ui://himami/category', mimeType: RESOURCE_MIME_TYPE, text: categoryShell }],
  }));

  // -------------------------------------------------------------------------
  // Tool 1: search_deals
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'search_deals',
    {
      description:
        'Search for deals, discounts, and offers on the Hi Mami platform. ' +
        'Search across brands, campaigns, products, and categories. ' +
        'Returns rich visual cards with deal details, discount codes, and links. ' +
        'Use this tool when users ask about deals, discounts, coupons, sales, or special offers in Israel.',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/search' } },
      inputSchema: {
        query: z.string().min(2).describe('Search query, e.g. "nike", "baby products", "pizza deals", "beauty discounts"'),
        type: z.enum(['BRAND', 'CAMPAIGN', 'PRODUCT', 'CATEGORY']).optional()
          .describe('Optional: filter results to a specific type'),
        limit: z.number().optional().default(10)
          .describe('Max results per group (default: 10)'),
      },
    },
    async ({ query, type, limit }) => {
      try {
        const results = await api.search(query, type, limit);

        return {
          content: [{ type: 'text' as const, text: formatSearchResults(results) }],
          _meta: { cardHtml: renderSearchResultsBody(results) },
        };
      } catch (err) {
        return handleToolError(err, 'search for deals');
      }
    },
  );

  // -------------------------------------------------------------------------
  // Tool 2: get_suggestions (text-only — no visual card)
  // -------------------------------------------------------------------------

  server.registerTool(
    'get_suggestions',
    {
      description:
        'Get autocomplete suggestions for search queries on Hi Mami. ' +
        'Returns matching brands, campaigns, products, and categories sorted by relevance.',
      annotations: TOOL_ANNOTATIONS,
      inputSchema: {
        query: z.string().min(1).describe('Partial search query for autocomplete'),
        limit: z.number().optional().default(5).describe('Max number of suggestions'),
      },
    },
    async ({ query, limit }) => {
      try {
        const results = await api.suggestions(query, limit);

        const text = results.suggestions.length === 0
          ? `No suggestions found for "${query}".`
          : results.suggestions
              .map((s) => `• [${s.type}] ${s.title} — ${s.path}`)
              .join('\n');

        return {
          content: [{ type: 'text' as const, text }],
          structuredContent: results as unknown as Record<string, unknown>,
        };
      } catch (err) {
        return handleToolError(err, 'get suggestions');
      }
    },
  );

  // -------------------------------------------------------------------------
  // Tool 3: get_brand
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'get_brand',
    {
      description:
        'Get a brand page on Hi Mami with its metadata, logo, description, and active deals/campaigns. ' +
        'Use the brand slug (URL-friendly name) to look up a specific brand. ' +
        'Examples: "nike", "pampers", "pizzahut", "superfarmonline".',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/brand' } },
      inputSchema: {
        brand_slug: z.string().describe('Brand URL slug, e.g. "nike", "pampers", "pizzahut"'),
        page: z.number().optional().default(1).describe('Page number for deals listing'),
        page_size: z.number().optional().default(20).describe('Items per page (max 100)'),
      },
    },
    async ({ brand_slug, page, page_size }) => {
      try {
        const brandPage = await api.getBrand(brand_slug);

        if (page && page > 1) {
          const sections = await api.getBrandSections(brand_slug, page, page_size);
          brandPage.pageSections = sections;
        }

        return {
          content: [{ type: 'text' as const, text: formatBrandPage(brandPage) }],
          _meta: { cardHtml: renderBrandPageBody(brandPage) },
        };
      } catch (err) {
        return handleToolError(err, `get brand "${brand_slug}"`);
      }
    },
  );

  // -------------------------------------------------------------------------
  // Tool 4: get_campaign
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'get_campaign',
    {
      description:
        'Get full details of a specific deal/campaign on Hi Mami. ' +
        'Returns the campaign title, description, discount info, expiration date, ' +
        'and how to redeem (code, link, phone number, etc.). ' +
        'Use the campaign ID returned by search_deals or get_brand.',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/campaign' } },
      inputSchema: {
        campaign_id: z.string().describe('Campaign ID (returned by search or brand page)'),
      },
    },
    async ({ campaign_id }) => {
      try {
        const campaignPage = await api.getCampaign(campaign_id);

        return {
          content: [{ type: 'text' as const, text: formatCampaignDetail(campaignPage) }],
          _meta: { cardHtml: renderCampaignDetailBody(campaignPage) },
        };
      } catch (err) {
        return handleToolError(err, `get campaign "${campaign_id}"`);
      }
    },
  );

  // -------------------------------------------------------------------------
  // Tool 5: get_product
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'get_product',
    {
      description:
        'Get full details of a specific product offer on Hi Mami. ' +
        'Returns product title, images, original and discounted price, ' +
        'discount percentage, and how to purchase/redeem. ' +
        'Use the product ID returned by search_deals or get_campaign.',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/product' } },
      inputSchema: {
        product_id: z.string().describe('Product ID (returned by search or campaign page)'),
      },
    },
    async ({ product_id }) => {
      try {
        const productPage = await api.getProduct(product_id);

        return {
          content: [{ type: 'text' as const, text: formatProductDetail(productPage) }],
          _meta: { cardHtml: renderProductDetailBody(productPage) },
        };
      } catch (err) {
        return handleToolError(err, `get product "${product_id}"`);
      }
    },
  );

  // -------------------------------------------------------------------------
  // Tool 6: browse_categories
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'browse_categories',
    {
      description:
        'Browse deal categories on Hi Mami. ' +
        'Pass an empty path to see all top-level categories, ' +
        'or a nested path to drill down (e.g. "fashion", "fashion/women/shoes"). ' +
        'Returns the category metadata and deals in that category.',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/category' } },
      inputSchema: {
        category_path: z.string().optional().default('')
          .describe('Category path, e.g. "fashion", "fashion/women". Empty = root categories'),
      },
    },
    async ({ category_path }) => {
      try {
        const categoryPage = await api.getCategories(category_path ?? '');

        return {
          content: [{ type: 'text' as const, text: formatCategoryPage(categoryPage) }],
          _meta: { cardHtml: renderCategoryPageBody(categoryPage) },
        };
      } catch (err) {
        return handleToolError(err, `browse categories "${category_path}"`);
      }
    },
  );

  // -------------------------------------------------------------------------
  // ChatGPT Connectors: search
  // -------------------------------------------------------------------------

  server.registerTool(
    'search',
    {
      description: 'Search for deals and offers on Hi Mami. Include what you are looking for in your query.',
      annotations: TOOL_ANNOTATIONS,
      inputSchema: {
        query: z.string().describe('Search query, e.g. "nike deals", "baby product discounts"'),
      },
    },
    async ({ query }) => {
      try {
        const results = await api.search(query);
        const allItems = [
          ...(results.brands.items as Array<Record<string, unknown>>).map((b) => ({
            id: (b as { slug?: string }).slug ?? (b as { id?: string }).id,
            title: ((b as { title?: { text?: string } }).title)?.text ?? String(b),
            type: 'BRAND',
            url: `https://hi-mami.com/brands/${(b as { slug?: string }).slug ?? ''}`,
          })),
          ...(results.campaigns.items as Array<Record<string, unknown>>).map((c) => ({
            id: (c as { id?: string }).id,
            title: ((c as { title?: { text?: string } }).title)?.text ?? String(c),
            type: 'CAMPAIGN',
            url: `https://hi-mami.com/campaigns/${(c as { id?: string }).id ?? ''}`,
          })),
          ...(results.products.items as Array<Record<string, unknown>>).map((p) => ({
            id: (p as { id?: string }).id,
            title: ((p as { title?: { text?: string } }).title)?.text ?? String(p),
            type: 'PRODUCT',
            url: `https://hi-mami.com/products/${(p as { id?: string }).id ?? ''}`,
          })),
        ];
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ results: allItems }) }],
        };
      } catch (err) {
        return handleToolError(err, 'search');
      }
    },
  );

  // -------------------------------------------------------------------------
  // ChatGPT Connectors: fetch
  // -------------------------------------------------------------------------

  server.registerTool(
    'fetch',
    {
      description: 'Get details for a specific deal, brand, or product on Hi Mami by its ID or slug.',
      annotations: TOOL_ANNOTATIONS,
      inputSchema: {
        entity_type: z.enum(['brand', 'campaign', 'product']).describe('Type of entity to fetch'),
        id: z.string().describe('ID or slug of the entity'),
      },
    },
    async ({ entity_type, id }) => {
      try {
        let text: string;

        switch (entity_type) {
          case 'brand': {
            const brand = await api.getBrand(id);
            const desc = brand.brandMetadata.displayStrings
              .filter((d) => d.type === 'DESCRIPTION')
              .map((d) => d.value.text)
              .join('\n');
            text = [
              `Brand: ${brand.brandMetadata.title.text}`,
              desc ? `Description: ${desc}` : null,
              `URL: https://hi-mami.com/brands/${brand.brandMetadata.slug}`,
            ].filter(Boolean).join('\n');
            break;
          }
          case 'campaign': {
            const campaign = await api.getCampaign(id);
            const c = campaign.campaignDetails;
            text = [
              `Campaign: ${c.title.text}`,
              `Brand: ${campaign.brandMetadata.title.text}`,
              c.discountPercentage ? `Discount: ${c.discountPercentage}%` : null,
              `Expires: ${c.expirationDate}`,
              `Tier: ${c.tierType}`,
              `URL: https://hi-mami.com/brands/${c.brandSlug}`,
            ].filter(Boolean).join('\n');
            break;
          }
          case 'product': {
            const product = await api.getProduct(id);
            const p = product.productDetails;
            text = [
              `Product: ${p.title.text}`,
              `Brand: ${product.brandMetadata.title.text}`,
              p.price ? `Price: ${p.price.discountedPrice} ${p.price.currency} (was ${p.price.originPrice})` : null,
              p.price ? `Discount: ${p.price.discountPercent}%` : null,
              `Expires: ${p.expirationDate}`,
              `URL: https://hi-mami.com/brands/${p.brandSlug}`,
            ].filter(Boolean).join('\n');
            break;
          }
        }

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (err) {
        return handleToolError(err, `fetch ${entity_type}`);
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function handleToolError(err: unknown, action: string) {
  logger.error({ err, action }, 'Tool error');

  let message: string;
  if (err instanceof HiMamiApiError) {
    if (err.statusCode === 404) {
      message = `Not found. The requested item may not exist or has been removed.`;
    } else if (err.statusCode === 429) {
      message = `Too many requests. Please try again in a moment.`;
    } else {
      message = err.message;
    }
  } else {
    message = err instanceof Error ? err.message : 'An unexpected error occurred.';
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: `Sorry, I couldn't ${action} right now. ${message}`,
      },
    ],
    isError: true,
  };
}
