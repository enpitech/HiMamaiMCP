import type { ProductPage } from '../types/index.js';
import { wrapInHtmlDoc } from './theme.js';

export const productCSS = `
  .product-card {
    max-width: 480px;
    background: var(--color-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .product-hero {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    background: var(--color-bg-alt);
  }
  .product-body {
    padding: 16px;
  }
  .product-brand {
    font-size: 0.85rem;
    color: var(--color-muted);
    margin-bottom: 4px;
  }
  .product-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .product-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  .product-price-section {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  .product-savings {
    font-size: 0.85rem;
    color: var(--color-success);
    font-weight: 600;
    margin-bottom: 10px;
  }
  .product-description {
    font-size: 0.9rem;
    color: var(--color-muted);
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .product-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.8rem;
    color: var(--color-muted);
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }
  .product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  .product-tag {
    background: var(--color-bg-alt);
    color: var(--color-muted);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
  }
`;

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'ILS') return `₪${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
}

export function renderProductDetailBody(page: ProductPage): string {
  const p = page.productDetails;
  const brand = page.brandMetadata;

  const heroHtml = p.mainMedia?.url
    ? `<img class="product-hero" src="${p.mainMedia.url}" alt="${p.title.text}">`
    : '';

  // Price section
  let priceHtml = '';
  if (p.price) {
    const currency = p.price.currency || 'ILS';
    priceHtml = `<div class="product-price-section">
      <span class="price-discounted">${formatCurrency(p.price.discountedPrice, currency)}</span>
      <span class="price-original">${formatCurrency(p.price.originPrice, currency)}</span>
    </div>
    <div class="product-savings">
      חיסכון של ${formatCurrency(p.price.discountAmount, currency)} (${p.price.discountPercent}% הנחה)
    </div>`;
  }

  // Badges
  const badges: string[] = [];
  if (p.price?.discountPercent) {
    badges.push(`<span class="badge badge-discount">${p.price.discountPercent}% הנחה</span>`);
  }
  if (p.tierType === 'MAMI_PLUS') {
    badges.push(`<span class="badge badge-mami-plus">⭐ מאמי פלוס</span>`);
  } else if (p.tierType === 'MAMI_PLUS_EXCLUSIVE') {
    badges.push(`<span class="badge badge-exclusive">👑 בלעדי למאמי פלוס</span>`);
  }
  if (p.expirationTag === 'ENDS_TODAY') {
    badges.push(`<span class="badge badge-ends-today">⏰ מסתיים היום!</span>`);
  } else if (p.expirationTag === 'ENDS_TOMORROW') {
    badges.push(`<span class="badge badge-ends-tomorrow">⏰ מסתיים מחר</span>`);
  }

  // Description
  const desc = p.displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  const descHtml = desc ? `<div class="product-description">${desc.value.text}</div>` : '';

  // CTA
  let ctaHtml = '';
  if (p.conversionAction) {
    const action = p.conversionAction;
    switch (action.type) {
      case 'GENERIC_CODE':
      case 'PERSONAL_CODE': {
        const data = action.data as { codes?: Array<{ code: string }>; url?: string } | null;
        if (data?.codes && data.codes.length > 0) {
          ctaHtml = `<div class="cta-box">
            <div class="cta-label">קוד:</div>
            ${data.codes.map((c) => `<span class="cta-code">${c.code}</span>`).join(' ')}
            ${data.url ? `<div style="margin-top:10px"><a class="cta-link" href="${data.url}" target="_blank" rel="noopener">למימוש ←</a></div>` : ''}
          </div>`;
        }
        break;
      }
      case 'LEADING_LINK':
      case 'PURCHASE_LINK':
      case 'PERSONAL_LINK': {
        const data = action.data as { url?: string } | null;
        if (data?.url) {
          ctaHtml = `<div class="cta-box"><a class="cta-link" href="${data.url}" target="_blank" rel="noopener">לרכישה ←</a></div>`;
        }
        break;
      }
      case 'CALL_TO_NUMBER': {
        const data = action.data as { phoneNumber?: string } | null;
        if (data?.phoneNumber) {
          ctaHtml = `<div class="cta-box"><a class="cta-link" href="tel:${data.phoneNumber}">📞 ${data.phoneNumber}</a></div>`;
        }
        break;
      }
      case 'VOUCHER': {
        const data = action.data as { code?: string } | null;
        if (data?.code) {
          ctaHtml = `<div class="cta-box"><div class="cta-label">שובר:</div><span class="cta-code">${data.code}</span></div>`;
        }
        break;
      }
      case 'OUT_OF_STOCK':
        ctaHtml = `<div class="cta-box"><div style="color:var(--color-danger);font-weight:600">⚠️ אזל מהמלאי</div></div>`;
        break;
    }
  }

  // Tags
  const tagsHtml = p.tagKeys.length > 0
    ? `<div class="product-tags">${p.tagKeys.map((t) => `<span class="product-tag">${t}</span>`).join('')}</div>`
    : '';

  const body = `<div class="product-card">
    ${heroHtml}
    <div class="product-body">
      <div class="product-brand">${brand.title.text}</div>
      <div class="product-title">${p.title.text}</div>
      <div class="product-badges">${badges.join('')}</div>
      ${priceHtml}
      ${descHtml}
      ${ctaHtml}
      ${tagsHtml}
      <div class="product-meta">
        <span>📅 בתוקף עד ${formatDate(p.expirationDate)}</span>
      </div>
    </div>
  </div>`;

  return body;
}

export function renderProductDetailCard(page: ProductPage): string {
  return wrapInHtmlDoc(renderProductDetailBody(page), productCSS);
}
