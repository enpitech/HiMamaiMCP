/**
 * Demo page — auto-loads all HiMami MCP UI widgets for visual testing.
 * Served at GET /demo. Loads search, brand, campaign, product, category
 * all at once with built-in test data from the dev API.
 */

import type { HiMamiApiClient } from '../services/himami-api.js';
import {
  renderSearchResults,
  renderBrandCard,
  renderCampaignCard,
  renderProductCard,
  renderCategoryCard,
} from '../ui/templates.js';
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
import { createMcpAppShell } from '../ui/theme.js';
import config from '../utils/config.js';

const DEMO_SHELL = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HiMami MCP — Widget Test</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
      color: #ccc;
      direction: rtl;
      min-height: 100vh;
      padding: 16px;
    }
    body.theme-dark { background: #1e1e1e; color: #ccc; }
    body.theme-light { background: #f5f5f5; color: #333; }
    .demo-header {
      text-align: center;
      padding: 16px;
      margin-bottom: 16px;
    }
    .demo-header h1 { font-size: 1.3rem; margin-bottom: 4px; }
    .demo-header p { font-size: 0.8rem; opacity: 0.6; }
    .demo-controls {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .demo-controls button {
      padding: 6px 14px;
      border: 1px solid rgba(128,128,128,0.3);
      border-radius: 6px;
      background: rgba(128,128,128,0.1);
      color: inherit;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .demo-controls button:hover { background: rgba(128,128,128,0.2); }
    .demo-controls button.active { background: rgba(255,107,157,0.3); border-color: rgba(255,107,157,0.5); }
    .widget-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    .widget-section {
      border: 1px solid rgba(128,128,128,0.15);
      border-radius: 12px;
      overflow: hidden;
    }
    .widget-label {
      padding: 8px 14px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.5;
      border-bottom: 1px solid rgba(128,128,128,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .widget-label .status { font-weight: 400; opacity: 0.7; }
    .widget-label .status.ok { color: #4ade80; }
    .widget-label .status.err { color: #f87171; }
    .widget-frame {
      width: 100%;
      border: none;
      min-height: 100px;
      display: block;
    }
    .widget-mode-mcp .widget-section { background: transparent; }
    .widget-mode-standalone .widget-section { background: transparent; }
    .debug-panel {
      max-width: 600px;
      margin: 20px auto;
      padding: 12px;
      border: 1px solid rgba(128,128,128,0.15);
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;
      display: none;
    }
    .debug-panel.visible { display: block; }
  </style>
</head>
<body class="theme-dark">
  <div class="demo-header">
    <h1>HiMami MCP — Widget Test</h1>
    <p>All widgets auto-loaded with test queries</p>
  </div>
  <div class="demo-controls">
    <button onclick="toggleTheme()" id="themeBtn">🌓 Toggle Theme</button>
    <button onclick="setMode('standalone')" id="btnStandalone" class="active">Standalone HTML</button>
    <button onclick="setMode('mcp')" id="btnMcp">MCP App Shell</button>
    <button onclick="toggleDebug()" id="debugBtn">🐛 Debug Log</button>
    <button onclick="loadAll()">🔄 Reload All</button>
  </div>
  <div id="debugLog" class="debug-panel"></div>
  <div id="widgetGrid" class="widget-grid widget-mode-standalone"></div>
  <script>
    const BASE = window.location.origin;
    let currentMode = 'standalone';
    let debugVisible = false;

    const WIDGETS = [
      { id: 'search',   label: '🔍 Search — "פיצה"',    api: '/search?q=פיצה' },
      { id: 'brand',    label: '🏷️ Brand — pizzahut',   api: '/brand/pizzahut' },
      { id: 'campaign', label: '🎯 Campaign (from brand)', api: null, depends: 'brand' },
      { id: 'product',  label: '📦 Product (from brand)',  api: null, depends: 'brand' },
      { id: 'category', label: '📂 Category — food',     api: '/category/food' },
    ];

    function log(msg) {
      const el = document.getElementById('debugLog');
      const ts = new Date().toISOString().slice(11,23);
      el.textContent += ts + ' ' + msg + '\\n';
      el.scrollTop = el.scrollHeight;
    }

    function toggleDebug() {
      debugVisible = !debugVisible;
      document.getElementById('debugLog').className = 'debug-panel' + (debugVisible ? ' visible' : '');
    }

    function toggleTheme() {
      const body = document.body;
      if (body.classList.contains('theme-dark')) {
        body.classList.replace('theme-dark', 'theme-light');
      } else {
        body.classList.replace('theme-light', 'theme-dark');
      }
    }

    function setMode(mode) {
      currentMode = mode;
      document.getElementById('btnStandalone').className = mode === 'standalone' ? 'active' : '';
      document.getElementById('btnMcp').className = mode === 'mcp' ? 'active' : '';
      const grid = document.getElementById('widgetGrid');
      grid.className = 'widget-grid widget-mode-' + mode;
      loadAll();
    }

    function buildGrid() {
      const grid = document.getElementById('widgetGrid');
      grid.innerHTML = WIDGETS.map(w => 
        '<div class="widget-section" id="section-' + w.id + '">' +
          '<div class="widget-label">' + w.label + ' <span class="status" id="status-' + w.id + '">loading...</span></div>' +
          '<iframe class="widget-frame" id="frame-' + w.id + '" sandbox="allow-scripts allow-same-origin"></iframe>' +
        '</div>'
      ).join('');
    }

    function setStatus(id, ok, msg) {
      const el = document.getElementById('status-' + id);
      if (el) {
        el.textContent = msg;
        el.className = 'status ' + (ok ? 'ok' : 'err');
      }
    }

    function renderInFrame(id, html) {
      const iframe = document.getElementById('frame-' + id);
      if (!iframe) return;
      iframe.srcdoc = html;
      iframe.onload = function() {
        try {
          const h = iframe.contentDocument.documentElement.scrollHeight;
          iframe.style.height = Math.max(h + 10, 100) + 'px';
          log(id + ': rendered, height=' + h);
        } catch(e) {
          log(id + ': resize error: ' + e.message);
        }
      };
    }

    async function loadWidget(w, brandData) {
      const mode = currentMode;
      try {
        let apiPath = w.api;

        // For campaign/product, extract IDs from brand data
        if (w.depends === 'brand' && brandData) {
          if (w.id === 'campaign' && brandData.campaignId) {
            apiPath = '/campaign/' + brandData.campaignId;
          } else if (w.id === 'product' && brandData.productId) {
            apiPath = '/product/' + brandData.productId;
          } else {
            setStatus(w.id, false, 'no ' + w.id + ' found in brand');
            log(w.id + ': skipped — no ID from brand');
            return null;
          }
        }

        if (!apiPath) {
          setStatus(w.id, false, 'no path');
          return null;
        }

        log(w.id + ': fetching ' + apiPath + ' (mode=' + mode + ')');
        const suffix = mode === 'mcp' ? '&mode=mcp' : '';
        const sep = apiPath.includes('?') ? '&' : '?';
        const res = await fetch(BASE + '/demo/api' + apiPath + (mode === 'mcp' ? sep + 'mode=mcp' : ''));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        renderInFrame(w.id, data.html);

        // Count images in returned HTML
        const imgCount = (data.html.match(/<img /g) || []).length;
        const proxyCount = (data.html.match(/\\/img\\?url=/g) || []).length;
        setStatus(w.id, true, 'ok — ' + imgCount + ' imgs' + (proxyCount > 0 ? ', ' + proxyCount + ' proxied' : ''));
        log(w.id + ': loaded ok — ' + imgCount + ' images, ' + proxyCount + ' proxied');

        return data;
      } catch(e) {
        setStatus(w.id, false, e.message);
        log(w.id + ': ERROR — ' + e.message);
        return null;
      }
    }

    async function loadAll() {
      log('--- loading all widgets (mode=' + currentMode + ') ---');
      buildGrid();

      // Load search, brand, category in parallel
      const [searchResult, brandResult, categoryResult] = await Promise.all([
        loadWidget(WIDGETS[0]),
        loadWidget(WIDGETS[1]),
        loadWidget(WIDGETS[4]),
      ]);

      // Extract campaign/product IDs from brand result
      let brandData = null;
      if (brandResult && brandResult.ids) {
        brandData = brandResult.ids;
        log('brand returned IDs: campaign=' + (brandData.campaignId||'none') + ', product=' + (brandData.productId||'none'));
      }

      // Load campaign and product using IDs from brand
      await Promise.all([
        loadWidget(WIDGETS[2], brandData),
        loadWidget(WIDGETS[3], brandData),
      ]);
    }

    // Auto-load on page load
    loadAll();
  </script>
</body>
</html>`;

export function getDemoPageHtml(): string {
  return DEMO_SHELL;
}

export async function handleDemoApi(
  path: string,
  query: Record<string, string>,
  apiClient: HiMamiApiClient,
): Promise<{ html: string; ids?: { campaignId?: string; productId?: string } } | { error: string }> {
  const proxyBase = config.mcpPublicUrl;
  const isMcp = query.mode === 'mcp';

  // Rewrite image URLs through our proxy
  function proxyImageUrls(html: string): string {
    return html.replace(/src="(https?:\/\/[^"]+)"/g, (_match, url: string) => {
      return `src="${proxyBase}/img?url=${encodeURIComponent(url)}"`;
    });
  }

  function wrap(html: string): string {
    return proxyImageUrls(html);
  }

  try {
    if (path === '/search') {
      const q = query.q;
      if (!q) return { error: 'Missing query parameter "q"' };
      const results = await apiClient.search(q);
      if (isMcp) {
        const shell = createMcpAppShell(searchCSS, proxyBase);
        // Inject card data directly into the shell for testing
        const body = renderSearchResultsBody(results);
        return { html: injectIntoShell(shell, proxyImageUrls(body)) };
      }
      return { html: wrap(renderSearchResults(results)) };
    }

    if (path.startsWith('/brand/')) {
      const slug = path.replace('/brand/', '');
      if (!slug) return { error: 'Missing brand slug' };
      const page = await apiClient.getBrand(slug);

      // Extract first campaign and product IDs for dependent widgets
      const ids: { campaignId?: string; productId?: string } = {};
      const sections = (page.pageSections as unknown as { items?: Array<{ items?: { items?: Array<{ type: string; data: { id?: string } }> } }> })?.items ?? [];
      for (const section of sections) {
        const items = section.items?.items ?? [];
        for (const item of items) {
          if (item.type === 'CAMPAIGN_DETAILS' && !ids.campaignId && item.data?.id) {
            ids.campaignId = item.data.id;
          }
          if (item.type === 'PRODUCT_DETAILS' && !ids.productId && item.data?.id) {
            ids.productId = item.data.id;
          }
          if (ids.campaignId && ids.productId) break;
        }
        if (ids.campaignId && ids.productId) break;
      }

      if (isMcp) {
        const shell = createMcpAppShell(brandCSS, proxyBase);
        const body = renderBrandPageBody(page);
        return { html: injectIntoShell(shell, proxyImageUrls(body)), ids };
      }
      return { html: wrap(renderBrandCard(page)), ids };
    }

    if (path.startsWith('/campaign/')) {
      const id = path.replace('/campaign/', '');
      if (!id) return { error: 'Missing campaign ID' };
      const page = await apiClient.getCampaign(id);
      if (isMcp) {
        const shell = createMcpAppShell(campaignCSS, proxyBase);
        const body = renderCampaignDetailBody(page);
        return { html: injectIntoShell(shell, proxyImageUrls(body)) };
      }
      return { html: wrap(renderCampaignCard(page)) };
    }

    if (path.startsWith('/product/')) {
      const id = path.replace('/product/', '');
      if (!id) return { error: 'Missing product ID' };
      const page = await apiClient.getProduct(id);
      if (isMcp) {
        const shell = createMcpAppShell(productCSS, proxyBase);
        const body = renderProductDetailBody(page);
        return { html: injectIntoShell(shell, proxyImageUrls(body)) };
      }
      return { html: wrap(renderProductCard(page)) };
    }

    if (path.startsWith('/category/')) {
      const slug = path.replace('/category/', '');
      if (!slug) return { error: 'Missing category slug' };
      const page = await apiClient.getCategories(slug);
      if (isMcp) {
        const shell = createMcpAppShell(categoryCSS, proxyBase);
        const body = renderCategoryPageBody(page);
        return { html: injectIntoShell(shell, proxyImageUrls(body)) };
      }
      return { html: wrap(renderCategoryCard(page)) };
    }

    return { error: `Unknown path: ${path}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { error: msg };
  }
}

/**
 * Inject pre-rendered body HTML directly into the MCP App shell
 * (replaces the "טוען..." loading placeholder).
 * Used only for demo/testing — in real MCP flow, the host sends tool-result via PostMessage.
 */
function injectIntoShell(shell: string, bodyHtml: string): string {
  // Replace the loading div content
  return shell.replace(
    /(<div id="app"[^>]*>).*?(<\/div>)/,
    `$1${bodyHtml}$2`,
  );
}
