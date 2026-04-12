/**
 * Demo page — interactive visual test for HiMami MCP UI cards.
 * Served at GET /demo, calls the HiMami API directly and renders HTML cards.
 */

import type { HiMamiApiClient } from '../services/himami-api.js';
import {
  renderSearchResults,
  renderBrandCard,
  renderCampaignCard,
  renderProductCard,
  renderCategoryCard,
  renderHomeCard,
} from '../ui/templates.js';

const DEMO_SHELL = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HiMami MCP — Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif;
      background: #F3F4F6;
      color: #1F2937;
      direction: rtl;
      min-height: 100vh;
    }
    .demo-header {
      background: linear-gradient(135deg, #FF6B9D 0%, #2D1B69 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .demo-header h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .demo-header p { font-size: 0.85rem; opacity: 0.85; }
    .demo-nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .demo-nav button, .demo-nav input, .demo-nav select {
      font-size: 0.85rem;
      padding: 8px 14px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      direction: rtl;
    }
    .demo-nav button:hover { background: #F9FAFB; }
    .demo-nav button.active { background: #FF6B9D; color: white; border-color: #FF6B9D; }
    .demo-nav input[type="text"] {
      width: 200px;
      cursor: text;
    }
    .demo-content {
      max-width: 520px;
      margin: 20px auto;
      padding: 0 16px;
    }
    .demo-status {
      text-align: center;
      padding: 40px 16px;
      color: #9CA3AF;
      font-size: 0.9rem;
    }
    .demo-status.error { color: #EF4444; }
    .demo-card-frame {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      background: white;
    }
    .demo-card-frame iframe {
      width: 100%;
      border: none;
      min-height: 400px;
    }
    .demo-footer {
      text-align: center;
      padding: 20px;
      font-size: 0.75rem;
      color: #9CA3AF;
    }
    .demo-footer a { color: #FF6B9D; }
    @media (max-width: 480px) {
      .demo-nav { gap: 4px; padding: 10px; }
      .demo-nav button { padding: 6px 10px; font-size: 0.8rem; }
      .demo-nav input[type="text"] { width: 140px; }
    }
  </style>
</head>
<body>
  <div class="demo-header">
    <h1>🎀 HiMami MCP — UI Demo</h1>
    <p>כרטיסי UI חזותיים — בדיקה אינטראקטיבית</p>
  </div>
  <div class="demo-nav">
    <input type="text" id="searchInput" placeholder="חיפוש..." value="פיצה">
    <button onclick="doSearch()">🔍 חפש</button>
    <button onclick="doHome()">🏠 דף הבית</button>
    <input type="text" id="brandInput" placeholder="slug מותג" value="pizzahut">
    <button onclick="doBrand()">🏷️ מותג</button>
    <input type="text" id="campaignInput" placeholder="ID מבצע">
    <button onclick="doCampaign()">🎯 מבצע</button>
    <input type="text" id="productInput" placeholder="ID מוצר">
    <button onclick="doProduct()">📦 מוצר</button>
  </div>
  <div class="demo-content">
    <div id="status" class="demo-status">👆 בחר פעולה מהתפריט למעלה</div>
    <div id="cardContainer" style="display:none">
      <div class="demo-card-frame">
        <iframe id="cardFrame" sandbox="allow-same-origin"></iframe>
      </div>
    </div>
  </div>
  <div class="demo-footer">
    HiMami MCP Server — <a href="/health">/health</a> · <a href="https://hi-mami.com" target="_blank">hi-mami.com</a>
  </div>
  <script>
    const BASE = window.location.origin;

    function showStatus(msg, isError) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.className = 'demo-status' + (isError ? ' error' : '');
      el.style.display = 'block';
      document.getElementById('cardContainer').style.display = 'none';
    }

    function renderCard(html) {
      document.getElementById('status').style.display = 'none';
      const container = document.getElementById('cardContainer');
      container.style.display = 'block';
      const iframe = document.getElementById('cardFrame');
      iframe.srcdoc = html;
      // Auto-resize iframe
      iframe.onload = function() {
        try {
          const h = iframe.contentDocument.body.scrollHeight;
          iframe.style.height = (h + 20) + 'px';
        } catch(e) {}
      };
    }

    async function callApi(path) {
      showStatus('⏳ טוען...');
      try {
        const res = await fetch(BASE + '/demo/api' + path);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        renderCard(data.html);
      } catch(e) {
        showStatus('❌ שגיאה: ' + e.message, true);
      }
    }

    function doSearch() {
      const q = document.getElementById('searchInput').value.trim();
      if (!q) return showStatus('הזן מילת חיפוש', true);
      callApi('/search?q=' + encodeURIComponent(q));
    }
    function doHome() { callApi('/home'); }
    function doBrand() {
      const s = document.getElementById('brandInput').value.trim();
      if (!s) return showStatus('הזן slug מותג', true);
      callApi('/brand/' + encodeURIComponent(s));
    }
    function doCampaign() {
      const id = document.getElementById('campaignInput').value.trim();
      if (!id) return showStatus('הזן ID מבצע', true);
      callApi('/campaign/' + encodeURIComponent(id));
    }
    function doProduct() {
      const id = document.getElementById('productInput').value.trim();
      if (!id) return showStatus('הזן ID מוצר', true);
      callApi('/product/' + encodeURIComponent(id));
    }

    // Enter key on search
    document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    document.getElementById('brandInput').addEventListener('keydown', e => { if (e.key === 'Enter') doBrand(); });
    document.getElementById('campaignInput').addEventListener('keydown', e => { if (e.key === 'Enter') doCampaign(); });
    document.getElementById('productInput').addEventListener('keydown', e => { if (e.key === 'Enter') doProduct(); });
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
): Promise<{ html: string } | { error: string }> {
  try {
    if (path === '/search') {
      const q = query.q;
      if (!q) return { error: 'Missing query parameter "q"' };
      const results = await apiClient.search(q);
      return { html: renderSearchResults(results) };
    }

    if (path === '/home') {
      const page = await apiClient.getHomePage();
      return { html: renderHomeCard(page) };
    }

    if (path.startsWith('/brand/')) {
      const slug = path.replace('/brand/', '');
      if (!slug) return { error: 'Missing brand slug' };
      const page = await apiClient.getBrand(slug);
      return { html: renderBrandCard(page) };
    }

    if (path.startsWith('/campaign/')) {
      const id = path.replace('/campaign/', '');
      if (!id) return { error: 'Missing campaign ID' };
      const page = await apiClient.getCampaign(id);
      return { html: renderCampaignCard(page) };
    }

    if (path.startsWith('/product/')) {
      const id = path.replace('/product/', '');
      if (!id) return { error: 'Missing product ID' };
      const page = await apiClient.getProduct(id);
      return { html: renderProductCard(page) };
    }

    return { error: `Unknown path: ${path}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { error: msg };
  }
}
