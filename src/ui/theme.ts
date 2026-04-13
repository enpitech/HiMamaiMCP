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

export function generateBaseCSS(): string {
  return `
    :root {
      --color-primary: #E91E63;
      --color-primary-dark: #C2185B;
      --color-secondary: rgba(233,30,99,0.1);
      --color-success: #4ADE80;
      --color-warning: #FBBF24;
      --color-danger: #F87171;
      --color-muted: rgba(160,160,160,0.65);
      --color-text: rgba(220,220,220,0.9);
      --color-text-light: rgba(160,160,160,0.7);
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
      --color-text-light: #666666;
      --color-muted: #888888;
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
      font-size: 14px;
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
    var count=imgs.length,loaded=0,failed=0;
    for(var i=0;i<imgs.length;i++){
      var src=imgs[i].getAttribute("src");
      if(src&&(src.indexOf("http://")===0||src.indexOf("https://")===0)&&src.indexOf(PROXY_BASE)===-1){
        imgs[i].setAttribute("src",PROXY_BASE+encodeURIComponent(src));
      }
      imgs[i].onload=function(){loaded++;updateDebug(count,loaded,failed);};
      imgs[i].onerror=function(){failed++;this.style.opacity="0.3";this.style.minHeight="20px";this.style.background="rgba(255,0,0,0.1)";updateDebug(count,loaded,failed);};
    }
    updateDebug(count,loaded,failed);
  }
  function updateDebug(total,ok,fail){
    var el=document.getElementById("_dbg");
    if(!el){el=document.createElement("div");el.id="_dbg";el.style.cssText="position:fixed;bottom:0;left:0;right:0;padding:2px 6px;font-size:10px;background:rgba(0,0,0,0.7);color:#aaa;z-index:9999;text-align:left;direction:ltr;";app.parentNode.appendChild(el);}
    el.textContent="imgs: "+total+" | loaded: "+ok+" | failed: "+fail;
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
