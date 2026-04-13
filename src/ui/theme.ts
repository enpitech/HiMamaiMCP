/**
 * CSS custom properties and base styles for HiMami MCP UI cards.
 * Brand colors from hi-mami.com: primary pink #E91E63.
 * Adaptive theme system — dark mode default, light override via [data-theme="light"].
 * All cards use RTL direction for Hebrew content.
 */

export const HIMAMI_BASE_URL = 'https://hi-mami.com';

export function hiMamiUrl(type: 'brand' | 'campaign' | 'product' | 'category', id: string): string {
  switch (type) {
    case 'brand': return `${HIMAMI_BASE_URL}/brands/${id}`;
    case 'campaign': return `${HIMAMI_BASE_URL}/campaigns/${id}`;
    case 'product': return `${HIMAMI_BASE_URL}/products/${id}`;
    case 'category': return `${HIMAMI_BASE_URL}/categories/${id}`;
  }
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
  } catch {
    return iso;
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function icon(name: string, size = 14): string {
  const paths: Record<string, string> = {
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><rect x="5" y="12" width="14" height="8" rx="1"/><path d="M12 8v12M12 8c-2-4-6-4-6-1s4 1 6 1M12 8c2-4 6-4 6-1s-4 1-6 1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.97.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h.01M16 12h.01"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2"/><path d="M7 7h.01"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  };
  const path = paths[name];
  if (!path) return '';
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

export function generateBaseCSS(): string {
  return `
    :root {
      --color-primary: #E91E63;
      --color-primary-dark: #C2185B;
      --color-accent: #AD1457;
      --color-secondary: rgba(233,30,99,0.1);
      --color-success: #4ADE80;
      --color-warning: #FBBF24;
      --color-danger: #F87171;
      --color-muted: rgba(180,180,180,0.85);
      --color-text: rgba(220,220,220,0.9);
      --color-text-light: rgba(190,190,190,0.9);
      --color-bg: transparent;
      --color-bg-alt: rgba(128,128,128,0.06);
      --color-border: rgba(128,128,128,0.15);
      --color-card-bg: rgba(128,128,128,0.08);
      --color-mami-plus: #FFB300;
      --color-mami-plus-bg: rgba(255,179,0,0.12);
      --border-radius: 12px;
      --border-radius-sm: 8px;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.08);
      --shadow-md: 0 2px 8px rgba(0,0,0,0.12);
      --font-family: 'Noto Sans Hebrew', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    [data-theme="light"] {
      --color-text: #333333;
      --color-text-light: #555555;
      --color-muted: #636363;
      --color-accent: #880E4F;
      --color-bg-alt: #F5F5F5;
      --color-border: #EEEEEE;
      --color-card-bg: #FFFFFF;
      --color-mami-plus: #E6A000;
      --color-mami-plus-bg: rgba(255,179,0,0.08);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 2px 8px rgba(0,0,0,0.1);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: auto;
      overflow-x: hidden;
    }

    body {
      font-family: var(--font-family);
      color: var(--color-text);
      background: var(--color-bg);
      direction: rtl;
      text-align: right;
      line-height: 1.5;
      font-size: 15px;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    a {
      color: var(--color-primary);
      text-decoration: none;
    }

    h1 a, h2 a, h3 a,
    .heading-link {
      color: inherit;
      text-decoration: none;
    }
    .heading-link:hover {
      color: var(--color-primary);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-discount {
      background: rgba(74,222,128,0.15);
      color: var(--color-success);
    }

    .badge-mami-plus {
      background: var(--color-mami-plus-bg);
      color: var(--color-mami-plus);
      font-weight: 700;
    }

    .badge-exclusive {
      background: rgba(233,30,99,0.12);
      color: var(--color-primary);
      font-weight: 700;
    }

    .badge-ends-today {
      background: rgba(248,113,113,0.15);
      color: var(--color-danger);
    }

    .badge-ends-tomorrow {
      background: rgba(251,191,36,0.15);
      color: var(--color-warning);
    }

    .badge-ended {
      background: rgba(128,128,128,0.1);
      color: var(--color-muted);
    }

    .badge-gift {
      background: rgba(96,165,250,0.15);
      color: #60A5FA;
    }

    .badge-offer {
      background: rgba(233,30,99,0.08);
      color: var(--color-primary);
    }

    .cta-box {
      background: var(--color-secondary);
      border: 1px solid var(--color-primary);
      border-radius: var(--border-radius-sm);
      padding: 12px 16px;
      margin-top: 12px;
    }

    .cta-code {
      font-family: 'Courier New', monospace;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      background: var(--color-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      display: inline-block;
      direction: ltr;
      unicode-bidi: embed;
      letter-spacing: 1px;
    }

    .entity-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--color-primary);
      font-weight: 600;
      font-size: 0.85rem;
      text-decoration: none;
    }

    .entity-link:hover {
      text-decoration: underline;
    }

    .cta-action-link {
      display: inline-block;
      background: var(--color-primary);
      color: #fff;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      text-align: center;
    }

    .price-original {
      text-decoration: line-through;
      color: var(--color-muted);
      font-size: 0.9rem;
    }

    .price-discounted {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .price-currency {
      font-size: 0.85rem;
      font-weight: 400;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 8px;
    }

    .validity-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .card-divider {
      border: none;
      border-top: 1px solid var(--color-border);
      margin: 12px 0;
    }

    .ltr-inline {
      direction: ltr;
      unicode-bidi: embed;
    }

    .icon {
      display: inline-block;
      vertical-align: -0.15em;
      flex-shrink: 0;
    }

    a, .entity-link, .cta-action-link {
      cursor: pointer;
      transition: color 0.2s ease-out, background-color 0.2s ease-out, opacity 0.2s ease-out;
    }

    a:focus-visible, button:focus-visible, [tabindex]:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: 4px;
    }

    .cta-action-link:hover {
      background: var(--color-primary-dark);
    }

    .deal-card, .brand-row, .brand-deal-item, .category-item, .home-grid-item {
      cursor: pointer;
      transition: background-color 0.2s ease-out, box-shadow 0.2s ease-out, transform 0.2s ease-out;
    }

    .deal-card:hover, .brand-row:hover, .brand-deal-item:hover, .category-item:hover {
      background: var(--color-bg-alt);
    }

    .home-grid-item:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .home-items-grid, .home-highlights {
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }

    .home-grid-item, .home-highlight {
      scroll-snap-align: start;
    }

    .campaign-card, .product-card, .brand-card, .category-card, .home-card {
      max-width: 480px;
      margin: 0 auto;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }

    @media (prefers-color-scheme: light) {
      :root:not([data-theme="dark"]) {
        --color-text: #333333;
        --color-text-light: #555555;
        --color-muted: #636363;
        --color-accent: #880E4F;
        --color-bg-alt: #F5F5F5;
        --color-border: #EEEEEE;
        --color-card-bg: #FFFFFF;
        --color-mami-plus: #E6A000;
        --color-mami-plus-bg: rgba(255,179,0,0.08);
        --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
        --shadow-md: 0 2px 8px rgba(0,0,0,0.1);
      }
    }

    @media (max-width: 400px) {
      .home-grid-item { width: 120px; }
      .brand-deal-img { width: 60px; height: 45px; }
      .campaign-hero { max-height: 160px; }
      .product-hero { max-height: 200px; }
      .brand-hero { height: 120px; }
    }
  `;
}

export function wrapInHtmlDoc(body: string, extraCSS = ''): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${generateBaseCSS()}${extraCSS}</style>
</head>
<body>${body}</body>
</html>`;
}

/**
 * Creates a static MCP App shell for iframes.
 * The shell includes all CSS, the PostMessage handshake,
 * theme detection from host context (light/dark),
 * image URL rewriting through our proxy, and
 * a tool-result listener that injects pre-rendered card HTML.
 */
export function createMcpAppShell(extraCSS = '', proxyBaseUrl = 'https://hi-mami-mcp.vercel.app'): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${generateBaseCSS()}${extraCSS}</style>
</head>
<body>
<div id="app" style="display:flex;justify-content:center;align-items:center;min-height:60px;color:var(--color-muted);font-size:0.9rem;">\u05d8\u05d5\u05e2\u05df...</div>
<script>
(function(){
  var PROXY_BASE="${proxyBaseUrl}/img?url=";
  var nextId=1,pending={},app=document.getElementById("app");

  function applyTheme(ctx){
    if(!ctx)return;
    var theme=ctx.theme||"";
    if(theme==="light"||theme==="dark"){
      document.documentElement.setAttribute("data-theme",theme);
    }
  }

  function proxyImages(){
    var imgs=app.querySelectorAll("img[src]");
    for(var i=0;i<imgs.length;i++){
      var src=imgs[i].getAttribute("src");
      if(src&&(src.indexOf("http://")===0||src.indexOf("https://")===0)&&src.indexOf(PROXY_BASE)===-1){
        imgs[i].setAttribute("src",PROXY_BASE+encodeURIComponent(src));
      }
      imgs[i].onerror=function(){this.style.opacity="0.3";this.style.minHeight="20px";this.style.background="rgba(128,128,128,0.1)";};
    }
  }

  window.addEventListener("message",function(e){
    var m=e.data;
    if(!m||m.jsonrpc!=="2.0")return;
    if("id" in m&&"result" in m){var r=pending[m.id];if(r){delete pending[m.id];r(m.result);}return;}
    if(m.method==="ping"&&"id" in m){window.parent.postMessage({jsonrpc:"2.0",id:m.id,result:{}},"*");return;}
    if(m.method==="ui/resource-teardown"&&"id" in m){window.parent.postMessage({jsonrpc:"2.0",id:m.id,result:{}},"*");return;}
    if(m.method==="ui/notifications/host-context-changed"&&m.params){applyTheme(m.params);}
    if(m.method==="ui/notifications/tool-result"&&m.params){
      var html=null;
      if(m.params._meta&&m.params._meta.cardHtml){html=m.params._meta.cardHtml;}
      if(!html&&m.params.content){
        for(var i=0;i<m.params.content.length;i++){
          var c=m.params.content[i];
          if(c.type==="resource"&&c.resource&&c.resource.mimeType==="text/html"){html=c.resource.text;break;}
        }
      }
      if(html){app.innerHTML=html;proxyImages();reportSize();}
    }
  });
  function req(method,params){return new Promise(function(resolve){var id=nextId++;pending[id]=resolve;window.parent.postMessage({jsonrpc:"2.0",method:method,params:params,id:id},"*");});}
  function notify(method,params){window.parent.postMessage({jsonrpc:"2.0",method:method,params:params||{}},"*");}
  function reportSize(){notify("ui/notifications/size-changed",{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight});}
  req("ui/initialize",{appInfo:{name:"himami",version:"1.0.0"},appCapabilities:{},protocolVersion:"2026-01-26"}).then(function(result){
    if(result&&result.hostContext){applyTheme(result.hostContext);}
    notify("ui/notifications/initialized");
    reportSize();
    if(typeof ResizeObserver!=="undefined"){new ResizeObserver(reportSize).observe(document.documentElement);}
  });
})();
<\/script>
</body>
</html>`;
}
