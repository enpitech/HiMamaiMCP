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
import { createMcpAppShell, HIMAMI_BASE_URL } from '../ui/theme.js';
import config from '../utils/config.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Card HTML post-processing for MCP iframe sandbox
// ---------------------------------------------------------------------------

/** Remove all <a> tags, keeping inner content. */
function stripLinks(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, '').replace(/<\/a>/gi, '');
}

/** Inline images as base64, remove any that fail to load. */
async function inlineImages(html: string, api: HiMamiApiClient): Promise<string> {
  const imgRegex = /(<img\s[^>]*\bsrc=")([^"]+)(")/gi;
  const matches: Array<{ url: string }> = [];

  let m: RegExpExecArray | null;
  while ((m = imgRegex.exec(html)) !== null) {
    const url = m[2];
    if (url.startsWith('http://') || url.startsWith('https://')) {
      matches.push({ url });
    }
  }

  if (matches.length === 0) return html;

  const results = await Promise.all(
    matches.slice(0, 10).map(async ({ url }) => {
      const img = await api.fetchImageAsBase64(url);
      return { url, img };
    }),
  );

  const urlMap = new Map<string, string>();
  for (const { url, img } of results) {
    if (img) {
      urlMap.set(url, `data:${img.mimeType};base64,${img.data}`);
    }
  }

  // Replace successful inlines, remove failed images entirely
  return html.replace(
    /<img\s[^>]*\bsrc="([^"]+)"[^>]*\/?>/gi,
    (full, url: string) => {
      const dataUri = urlMap.get(url);
      if (dataUri) return full.replace(url, dataUri);
      return ''; // Remove failed images
    },
  );
}

// Light + dark inline CSS — self-contained, bypasses cached app shell
const CARD_CSS = `<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;direction:rtl;text-align:right;font-size:15px;line-height:1.5;margin:0;padding:0;color:var(--t);background:var(--bg)}
:root{--t:#111827;--t2:#4B5563;--mu:#6B7280;--bg:#fff;--bg2:#F3F4F6;--br:#D1D5DB;--br2:#E5E7EB;--pk:#E91E63;--gr:#16A34A;--rd:#DC2626;--am:#D97706;--bl:#2563EB;--mp:#B45309;--sh:0 4px 12px rgba(0,0,0,0.1)}
[data-theme="dark"]{--t:#E5E7EB;--t2:#9CA3AF;--mu:#9CA3AF;--bg:#1F2937;--bg2:#374151;--br:#4B5563;--br2:#374151;--pk:#F472B6;--gr:#4ADE80;--rd:#F87171;--am:#FBBF24;--bl:#60A5FA;--mp:#FBBF24;--sh:0 4px 12px rgba(0,0,0,0.3)}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--t:#E5E7EB;--t2:#9CA3AF;--mu:#9CA3AF;--bg:#1F2937;--bg2:#374151;--br:#4B5563;--br2:#374151;--pk:#F472B6;--gr:#4ADE80;--rd:#F87171;--am:#FBBF24;--bl:#60A5FA;--mp:#FBBF24;--sh:0 4px 12px rgba(0,0,0,0.3)}}
img{max-width:100%;height:auto;display:block;border-radius:8px}
.search-header{padding:14px 16px;border-bottom:1px solid var(--br2)}
.search-title{font-size:1rem;font-weight:700;color:var(--t)}
.search-subtitle{font-size:0.8rem;color:var(--mu);margin-top:2px}
.search-empty{text-align:center;padding:32px 16px;color:var(--mu)}
.deal-card{border-bottom:1px solid var(--br2);overflow:hidden}
.deal-card:last-child{border-bottom:none}
.deal-hero-wrap{position:relative;overflow:hidden}
.deal-hero{width:100%;max-height:180px;object-fit:cover;display:block}
.deal-body{padding:12px 16px}
.deal-brand{font-size:0.75rem;color:var(--mu);margin-bottom:4px}
.deal-title{font-size:1rem;font-weight:700;color:var(--t);line-height:1.4;margin-bottom:4px}
.deal-description{font-size:0.85rem;color:var(--t2);line-height:1.4;margin-bottom:8px}
.deal-badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.deal-footer{display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:var(--mu);padding-top:6px;border-top:1px solid var(--br2)}
.brand-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--br2)}
.brand-row-logo{width:40px;height:40px;border-radius:8px;object-fit:contain;background:var(--bg2)}
.brand-row-name{font-weight:600;font-size:0.9rem;color:var(--t)}
.brand-row-desc{font-size:0.8rem;color:var(--mu);margin-top:2px}
.campaign-card,.product-card,.brand-card,.category-card,.home-card{background:var(--bg);border-radius:12px;border:1px solid var(--br);overflow:hidden;max-width:480px;margin:0 auto;box-shadow:var(--sh)}
.campaign-brand-bar{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg2);border-bottom:1px solid var(--br2)}
.campaign-brand-logo{width:36px;height:36px;border-radius:8px;object-fit:contain;background:var(--bg2)}
.campaign-brand-name{font-weight:600;color:var(--t)}
.deal-hero-wrap:not(:has(img)),.campaign-hero-wrap:not(:has(img)),.product-hero-wrap:not(:has(img)),.brand-hero:not(:has(img)){display:none}
.campaign-hero-wrap,.product-hero-wrap{position:relative;overflow:hidden}
.campaign-hero{width:100%;max-height:240px;object-fit:cover}
.product-hero{width:100%;max-height:280px;object-fit:cover;background:var(--bg2)}
.campaign-body,.product-body,.brand-body{padding:16px}
.campaign-title,.product-title{font-size:1.15rem;font-weight:700;color:var(--t);margin-bottom:6px;line-height:1.4}
.campaign-description,.product-description,.brand-description{font-size:0.9rem;color:var(--t2);margin-bottom:12px;line-height:1.5}
.campaign-badges,.product-badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.campaign-meta,.product-meta{display:flex;gap:12px;font-size:0.8rem;color:var(--mu);margin-top:12px;padding-top:12px;border-top:1px solid var(--br2)}
.brand-hero{position:relative;width:100%;height:160px;overflow:hidden;background:var(--bg2)}
.brand-hero-img{width:100%;height:100%;object-fit:cover}
.brand-logo-overlay{position:absolute;bottom:-24px;right:16px;width:56px;height:56px;border-radius:12px;background:var(--bg2);padding:4px;display:flex;align-items:center;justify-content:center}
.brand-logo-overlay img{width:100%;height:100%;object-fit:contain;border-radius:8px}
.brand-name{font-size:1.25rem;font-weight:700;color:var(--t);margin-bottom:6px}
.brand-deals-header{font-size:0.95rem;font-weight:700;color:var(--t);margin-bottom:10px;padding-top:12px;border-top:1px solid var(--br2)}
.brand-deal-item{display:flex;align-items:flex-start;gap:12px;padding:10px;border-radius:8px;margin-bottom:6px;border:1px solid var(--br2);background:var(--bg2)}
.brand-deal-img{width:80px;height:60px;border-radius:8px;object-fit:cover}
.brand-deal-title{font-weight:600;font-size:0.85rem;color:var(--t)}
.brand-deal-meta{font-size:0.75rem;color:var(--mu);margin-top:3px}
.category-header{padding:16px;border-bottom:1px solid var(--br2);display:flex;align-items:center;gap:12px}
.category-thumb{width:48px;height:48px;border-radius:10px;object-fit:cover}
.category-thumb-placeholder{width:48px;height:48px;border-radius:10px;background:var(--bg2);display:flex;align-items:center;justify-content:center;color:var(--pk)}
.category-title{font-size:1.15rem;font-weight:700;color:var(--t)}
.category-sections{padding:8px 16px 16px}
.category-section-title{font-size:0.95rem;font-weight:700;color:var(--pk);margin-bottom:8px;display:flex;align-items:center;gap:6px}
.category-item{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--br2)}
.category-item:last-child{border-bottom:none}
.category-item-img{width:40px;height:40px;border-radius:8px;object-fit:cover}
.category-item-title{font-weight:600;font-size:0.85rem;color:var(--t)}
.category-item-meta{font-size:0.75rem;color:var(--mu)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;white-space:nowrap}
.badge-discount{background:rgba(22,163,74,0.1);color:var(--gr)}
.badge-mami-plus{background:rgba(180,83,9,0.1);color:var(--mp)}
.badge-exclusive{background:rgba(233,30,99,0.1);color:var(--pk)}
.badge-ends-today{background:rgba(220,38,38,0.1);color:var(--rd)}
.badge-ends-tomorrow{background:rgba(217,119,6,0.1);color:var(--am)}
.badge-ended{background:rgba(107,114,128,0.1);color:var(--mu)}
.badge-gift{background:rgba(37,99,235,0.1);color:var(--bl)}
.badge-offer{background:rgba(233,30,99,0.08);color:var(--pk)}
.cta-box{background:rgba(233,30,99,0.06);border:1px solid var(--pk);border-radius:8px;padding:12px 16px;margin-top:12px}
.cta-code{font-family:'Courier New',monospace;font-size:1.1rem;font-weight:700;color:var(--pk);background:rgba(233,30,99,0.08);padding:6px 12px;border-radius:6px;display:inline-block;direction:ltr;letter-spacing:1px}
.cta-label{font-size:0.8rem;color:var(--mu);margin-bottom:6px}
.price-discounted{font-size:1.3rem;font-weight:700;color:var(--pk)}
.price-original{text-decoration:line-through;color:var(--mu);font-size:0.9rem}
.product-savings{font-size:0.85rem;color:var(--gr);font-weight:600;margin-bottom:10px}
.product-price-section{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}
.product-tag{background:var(--bg2);color:var(--mu);padding:2px 8px;border-radius:12px;font-size:0.75rem}
.product-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.validity-overlay{position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:3px 8px;border-radius:4px;font-size:0.7rem}
.icon{display:inline-block;vertical-align:-0.15em}
.home-grid-item{flex-shrink:0;width:150px;border-radius:10px;overflow:hidden;background:var(--bg);box-shadow:0 1px 3px rgba(0,0,0,0.1);border:1px solid var(--br2)}
.home-grid-item img{width:100%;height:100px;object-fit:cover}
.home-grid-item-body{padding:6px 8px}
.home-grid-item-title{font-size:0.75rem;font-weight:600;line-height:1.3;color:var(--t)}
.home-grid-item-meta{font-size:0.75rem;color:var(--mu);margin-top:2px}
.home-highlights{padding:12px 16px;display:flex;gap:10px;overflow-x:auto;border-bottom:1px solid var(--br2)}
.home-highlight-img{width:52px;height:52px;border-radius:50%;border:2px solid var(--pk);object-fit:cover}
.home-sections{padding:12px 16px 16px}
.home-section{margin-bottom:16px}
.home-section-title{font-size:1rem;font-weight:700;color:var(--t)}
.home-items-grid{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
</style>`;

/** Full post-processing pipeline for card HTML. */
async function prepareCardHtml(html: string, api: HiMamiApiClient): Promise<string> {
  const stripped = stripLinks(html);
  const withImages = await inlineImages(stripped, api);
  return CARD_CSS + withImages;
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

// ---------------------------------------------------------------------------
// Tool call logging wrapper
// ---------------------------------------------------------------------------

function withToolLogging<TArgs, TResult>(
  toolName: string,
  handler: (args: TArgs) => Promise<TResult>,
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    const startTime = Date.now();
    logger.info({ event: 'mcp.tool.call', tool: toolName, input: args }, `Tool call: ${toolName}`);

    try {
      const result = await handler(args);
      const durationMs = Date.now() - startTime;

      const r = result as unknown as Record<string, unknown>;
      const content = r.content as Array<{ type: string; text?: string }> | undefined;
      const meta = r._meta as Record<string, unknown> | undefined;
      const textLen = content?.find(c => c.type === 'text')?.text?.length ?? 0;
      const cardLen = meta?.cardHtml ? String(meta.cardHtml).length : 0;
      const isError = Boolean(r.isError);

      const logData = {
        event: isError ? 'mcp.tool.error_result' : 'mcp.tool.success',
        tool: toolName,
        durationMs,
        success: !isError,
        resultTextLength: textLen,
        resultCardLength: cardLen,
      };

      if (isError) {
        logger.warn(logData, `Tool ${toolName} error result (${durationMs}ms)`);
      } else {
        logger.info(logData, `Tool ${toolName} OK (${durationMs}ms, text=${textLen}b, card=${cardLen}b)`);
      }

      return result;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error({
        event: 'mcp.tool.exception',
        tool: toolName,
        durationMs,
        error: err instanceof Error ? err.message : String(err),
      }, `Tool ${toolName} exception (${durationMs}ms)`);
      throw err;
    }
  };
}

/** Create a fully configured McpServer with all tools and resources registered. */
export function createMcpServer(api: HiMamiApiClient): McpServer {
  const server = new McpServer({
    name: 'himami',
    version: '1.0.0',
    title: 'Hi Mami - הטבות ומבצעים',
    description:
      'Hi Mami (מאמי) is Israel\'s leading deals & benefits platform with hundreds of brands ' +
      '(Nike, Super-Pharm, IKEA, Castro, Pizza Hut, TerminalX, and more). ' +
      'Categories: beauty, fashion, food & grocery, kids & babies, electronics, home & kitchen, tourism. ' +
      'Deals include discount codes, percentage discounts, gifts, vouchers, and Mami Plus exclusives. ' +
      'Always present deals with clickable links to hi-mami.com. Respond in the user\'s language.',
    icons: [{ src: `${HIMAMI_BASE_URL}/images/mami_logo.svg`, mimeType: 'image/svg+xml', sizes: ['any'] }],
  });
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
        'Search for deals, discounts, and offers on Hi Mami — Israel\'s top deals platform. ' +
        'Searches across brands, campaigns (deals), products, and categories.\n\n' +
        'SEARCH TIPS:\n' +
        '- Hebrew queries often give better results (e.g. "ביוטי", "אופנה", "פיצה")\n' +
        '- Brand names work in English: "nike", "adidas", "superpharm", "ikea"\n' +
        '- Be specific: "pizza deals" > "food"\n' +
        '- Omit the type filter for broad discovery; use type=BRAND to find a brand page\n\n' +
        'RESPONSE FORMAT:\n' +
        '- Present each deal as a numbered item with name, discount/price, and a CLICKABLE link\n' +
        '- Put discount codes in `backticks` for easy copying\n' +
        '- Always include the 🔗 URLs from the text result as clickable links\n' +
        '- NEVER tell users to "click the card" — card links do not work\n' +
        '- To get full deal details (discount codes, redemption links), call get_campaign with the campaign ID',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/search' } },
      inputSchema: {
        query: z.string().min(2).describe(
          'Search query in Hebrew or English. Examples: "nike", "ביוטי", "פיצה", "baby products", "superpharm". ' +
          'Use brand name, product category, or deal type.',
        ),
        type: z.enum(['BRAND', 'CAMPAIGN', 'PRODUCT', 'CATEGORY']).optional()
          .describe('Filter to one type. BRAND = find brands, CAMPAIGN = find deals, PRODUCT = find products with prices'),
        limit: z.number().optional().default(10)
          .describe('Max results per group (default: 10)'),
      },
    },
    withToolLogging('search_deals', async ({ query, type, limit }) => {
      try {
        const results = await api.search(query, type, limit);

        return {
          content: [{ type: 'text' as const, text: formatSearchResults(results) }],
          _meta: { cardHtml: await prepareCardHtml(renderSearchResultsBody(results), api) },
        };
      } catch (err) {
        return handleToolError(err, 'search for deals');
      }
    }),
  );

  // -------------------------------------------------------------------------
  // Tool 2: get_suggestions (text-only — no visual card)
  // -------------------------------------------------------------------------

  server.registerTool(
    'get_suggestions',
    {
      description:
        'Autocomplete helper for Hi Mami search. Use BEFORE search_deals when the user\'s ' +
        'request is vague or you\'re unsure of the exact brand/product name. ' +
        'Returns suggestions sorted by relevance. Use the suggestion to make a targeted search_deals or get_brand call.',
      annotations: TOOL_ANNOTATIONS,
      inputSchema: {
        query: z.string().min(1).describe('Partial query for autocomplete, e.g. "סופר", "nik", "פיצ"'),
        limit: z.number().optional().default(5).describe('Max number of suggestions'),
      },
    },
    withToolLogging('get_suggestions', async ({ query, limit }) => {
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
    }),
  );

  // -------------------------------------------------------------------------
  // Tool 3: get_brand
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'get_brand',
    {
      description:
        'Get a brand\'s page on Hi Mami with all active deals. ' +
        'Use after finding a brand in search results, or when a user asks about a specific brand.\n\n' +
        'RESPONSE FORMAT:\n' +
        '- Show the brand name and description\n' +
        '- List each deal with its discount and a clickable link\n' +
        '- Put discount codes in `backticks`\n' +
        '- To get full deal details (codes, redemption steps), call get_campaign with the deal ID\n\n' +
        'Common brand slugs: "nike", "superfarmonline", "ikea", "castro", "pizzahut", ' +
        '"golf", "terminalx", "erroca", "h-and-o", "cramim", "arad-textile".',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/brand' } },
      inputSchema: {
        brand_slug: z.string().describe(
          'Brand URL slug (lowercase, hyphens). Examples: "nike", "superfarmonline", "pizzahut", "h-and-o". ' +
          'Tip: use get_suggestions first if unsure of the exact slug.',
        ),
        page: z.number().optional().default(1).describe('Page number for deals listing'),
        page_size: z.number().optional().default(20).describe('Items per page (max 100)'),
      },
    },
    withToolLogging('get_brand', async ({ brand_slug, page, page_size }) => {
      try {
        const brandPage = await api.getBrand(brand_slug);

        if (page && page > 1) {
          const sections = await api.getBrandSections(brand_slug, page, page_size);
          brandPage.pageSections = sections;
        }

        return {
          content: [{ type: 'text' as const, text: formatBrandPage(brandPage) }],
          _meta: { cardHtml: await prepareCardHtml(renderBrandPageBody(brandPage), api) },
        };
      } catch (err) {
        return handleToolError(err, `get brand "${brand_slug}"`);
      }
    }),
  );

  // -------------------------------------------------------------------------
  // Tool 4: get_campaign
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'get_campaign',
    {
      description:
        'Get full details of a specific deal/campaign on Hi Mami, including redemption info. ' +
        'This is the key tool for actionable deal info — it returns discount codes, redemption links, ' +
        'phone numbers, vouchers, expiration dates, and terms.\n\n' +
        'RESPONSE FORMAT:\n' +
        '- Show deal title and brand name\n' +
        '- Put discount codes in `backticks` so users can copy them\n' +
        '- Include the redemption/purchase link as a clickable URL\n' +
        '- Highlight urgency if ending today/tomorrow\n' +
        '- Show terms and conditions\n' +
        '- Always include the 🔗 deal URL as a clickable link',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/campaign' } },
      inputSchema: {
        campaign_id: z.string().describe('Campaign ID from search_deals or get_brand results (e.g. "abc123")'),
      },
    },
    withToolLogging('get_campaign', async ({ campaign_id }) => {
      try {
        const campaignPage = await api.getCampaign(campaign_id);

        return {
          content: [{ type: 'text' as const, text: formatCampaignDetail(campaignPage) }],
          _meta: { cardHtml: await prepareCardHtml(renderCampaignDetailBody(campaignPage), api) },
        };
      } catch (err) {
        return handleToolError(err, `get campaign "${campaign_id}"`);
      }
    }),
  );

  // -------------------------------------------------------------------------
  // Tool 5: get_product
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'get_product',
    {
      description:
        'Get a specific product offer with pricing and purchase info. ' +
        'Returns original price, discounted price, savings, discount code, and purchase link.\n\n' +
        'RESPONSE FORMAT:\n' +
        '- Show ~~original price~~ → discounted price (XX% off, save ₪XX)\n' +
        '- Put discount codes in `backticks`\n' +
        '- Include the purchase link as a clickable URL\n' +
        '- Always include the 🔗 product URL',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/product' } },
      inputSchema: {
        product_id: z.string().describe('Product ID from search_deals or get_brand results'),
      },
    },
    withToolLogging('get_product', async ({ product_id }) => {
      try {
        const productPage = await api.getProduct(product_id);

        return {
          content: [{ type: 'text' as const, text: formatProductDetail(productPage) }],
          _meta: { cardHtml: await prepareCardHtml(renderProductDetailBody(productPage), api) },
        };
      } catch (err) {
        return handleToolError(err, `get product "${product_id}"`);
      }
    }),
  );

  // -------------------------------------------------------------------------
  // Tool 6: browse_categories
  // -------------------------------------------------------------------------

  registerAppTool(
    server,
    'browse_categories',
    {
      description:
        'Browse deal categories on Hi Mami for discovery. ' +
        'Use when users say "what deals are available?", "show me beauty offers", "what categories exist?".\n\n' +
        'AVAILABLE CATEGORIES: beuty (beauty/cosmetics), fashion, home (home & kitchen), ' +
        'hasmal (electronics), baby (kids & babies), tayarotclali (tourism & travel), ' +
        'food (food & grocery), insurance, sport.\n' +
        'Pass empty string for all top-level categories.\n\n' +
        'RESPONSE FORMAT:\n' +
        '- List each deal with name, discount, and a clickable link\n' +
        '- Always include the 🔗 URLs\n' +
        '- NEVER tell users to "click the card"',
      annotations: TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: 'ui://himami/category' } },
      inputSchema: {
        category_path: z.string().optional().default('')
          .describe(
            'Category slug: "beuty", "fashion", "home", "hasmal", "baby", "tayarotclali", "food", "insurance", "sport". ' +
            'Empty = show all categories. Can nest: "fashion/women".',
          ),
      },
    },
    withToolLogging('browse_categories', async ({ category_path }) => {
      try {
        const categoryPage = await api.getCategories(category_path ?? '');

        return {
          content: [{ type: 'text' as const, text: formatCategoryPage(categoryPage) }],
          _meta: { cardHtml: await prepareCardHtml(renderCategoryPageBody(categoryPage), api) },
        };
      } catch (err) {
        return handleToolError(err, `browse categories "${category_path}"`);
      }
    }),
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
    withToolLogging('search', async ({ query }) => {
      try {
        const results = await api.search(query);
        const allItems = [
          ...(results.brands.items as Array<Record<string, unknown>>).map((b) => ({
            id: (b as { slug?: string }).slug ?? (b as { id?: string }).id,
            title: ((b as { title?: { text?: string } }).title)?.text ?? String(b),
            type: 'BRAND',
            url: `${HIMAMI_BASE_URL}/brands/${(b as { slug?: string }).slug ?? ''}`,
          })),
          ...(results.campaigns.items as Array<Record<string, unknown>>).map((c) => ({
            id: (c as { id?: string }).id,
            title: ((c as { title?: { text?: string } }).title)?.text ?? String(c),
            type: 'CAMPAIGN',
            url: `${HIMAMI_BASE_URL}/brands/${(c as { brandSlug?: string }).brandSlug ?? ''}/?benefitid=${(c as { id?: string }).id ?? ''}`,
          })),
          ...(results.products.items as Array<Record<string, unknown>>).map((p) => ({
            id: (p as { id?: string }).id,
            title: ((p as { title?: { text?: string } }).title)?.text ?? String(p),
            type: 'PRODUCT',
            url: `${HIMAMI_BASE_URL}/brands/${(p as { brandSlug?: string }).brandSlug ?? ''}/?benefitid=${(p as { id?: string }).id ?? ''}`,
          })),
        ];
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ results: allItems }) }],
        };
      } catch (err) {
        return handleToolError(err, 'search');
      }
    }),
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
    withToolLogging('fetch', async ({ entity_type, id }) => {
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
              `URL: ${HIMAMI_BASE_URL}/brands/${brand.brandMetadata.slug}`,
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
              `URL: ${HIMAMI_BASE_URL}/brands/${c.brandSlug}/?benefitid=${c.id}`,
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
              `URL: ${HIMAMI_BASE_URL}/brands/${p.brandSlug}/?benefitid=${p.id}`,
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
    }),
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
