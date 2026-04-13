/**
 * CSS custom properties and base styles for HiMami MCP UI cards.
 * Uses a neutral mid-tone palette that works on both light and dark backgrounds.
 * All cards use RTL direction for Hebrew content.
 */

export function generateBaseCSS(): string {
  return `
    :root {
      --color-primary: #FF6B9D;
      --color-primary-dark: #E85588;
      --color-secondary: rgba(255,107,157,0.1);
      --color-accent: #7C6BC4;
      --color-accent-light: #9B8FD8;
      --color-success: #4ADE80;
      --color-warning: #FBBF24;
      --color-danger: #F87171;
      --color-muted: #9CA3AF;
      --color-text: #E5E7EB;
      --color-text-light: #9CA3AF;
      --color-bg: transparent;
      --color-bg-alt: rgba(128,128,128,0.08);
      --color-border: rgba(128,128,128,0.2);
      --color-card-bg: rgba(128,128,128,0.06);
      --color-mami-plus: #A78BFA;
      --color-mami-plus-bg: rgba(167,139,250,0.15);
      --border-radius: 12px;
      --border-radius-sm: 8px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.15);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.2);
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    [data-theme="light"] {
      --color-text: #1F2937;
      --color-text-light: #6B7280;
      --color-muted: #6B7280;
      --color-bg-alt: rgba(0,0,0,0.03);
      --color-border: rgba(0,0,0,0.1);
      --color-card-bg: rgba(0,0,0,0.02);
      --color-accent: #2D1B69;
      --color-accent-light: #4A3A8A;
      --color-mami-plus: #9333EA;
      --color-mami-plus-bg: rgba(147,51,234,0.1);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
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
      color: var(--color-accent-light);
      text-decoration: none;
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
    }

    .badge-exclusive {
      background: rgba(251,191,36,0.15);
      color: var(--color-warning);
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
      background: rgba(124,107,196,0.15);
      color: var(--color-accent-light);
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
      color: var(--color-accent-light);
      background: rgba(124,107,196,0.15);
      padding: 6px 12px;
      border-radius: 6px;
      display: inline-block;
      direction: ltr;
      unicode-bidi: embed;
      letter-spacing: 1px;
    }

    .cta-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--color-accent);
      color: #fff;
      padding: 8px 20px;
      border-radius: var(--border-radius-sm);
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      transition: background 0.2s;
    }

    .cta-link:hover {
      background: var(--color-accent-light);
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
    for(var i=0;i<imgs.length;i++){
      var src=imgs[i].getAttribute("src");
      if(src&&src.indexOf("hi-mami.com")!==-1&&src.indexOf(PROXY_BASE)===-1){
        imgs[i].setAttribute("src",PROXY_BASE+encodeURIComponent(src));
      }
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
