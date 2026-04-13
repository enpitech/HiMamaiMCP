import type { ProductPage } from '../types/index.js';
import { wrapInHtmlDoc, hiMamiUrl, formatDate } from './theme.js';
import { getTierBadge, renderConversionAction } from './campaign-card.js';

export const productCSS = `
  .product-card {
    width: 100%;
    background: var(--color-card-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .product-hero-wrap {
    position: relative;
    overflow: hidden;
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
  .product-brand a {
    color: inherit;
    text-decoration: none;
  }
  .product-brand a:hover {
    color: var(--color-primary);
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
  .product-footer-link {
    margin-top: 12px;
    text-align: left;
  }
`;

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'ILS') return `₪${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
}

export function renderProductDetailBody(page: ProductPage): string {
  const p = page.productDetails;
  const brand = page.brandMetadata;

  const brandUrl = hiMamiUrl('brand', brand.slug);
  const productUrl = hiMamiUrl('product', p.id);

  // Hero image with validity overlay
  let heroHtml = '';
  if (p.mainMedia?.url) {
    const overlayHtml = p.expirationTag !== 'ENDED'
      ? `<span class="validity-overlay">בתוקף עד ${formatDate(p.expirationDate)}</span>`
      : '';
    heroHtml = `<div class="product-hero-wrap"><img class="product-hero" src="${p.mainMedia.url}" alt="${p.title.text}">${overlayHtml}</div>`;
  }

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

  // Badges — reuse shared helpers
  const badges = [
    p.price?.discountPercent ? `<span class="badge badge-discount">${p.price.discountPercent}% הנחה</span>` : '',
    getTierBadge(p.tierType),
    p.expirationTag === 'ENDS_TODAY' ? `<span class="badge badge-ends-today">⏰ מסתיים היום!</span>` : '',
    p.expirationTag === 'ENDS_TOMORROW' ? `<span class="badge badge-ends-tomorrow">⏰ מסתיים מחר</span>` : '',
  ].filter(Boolean);

  // Description
  const desc = p.displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  const descHtml = desc ? `<div class="product-description">${desc.value.text}</div>` : '';

  // CTA — reuse shared renderer
  const ctaHtml = p.conversionAction ? renderConversionAction(p.conversionAction) : '';

  // Tags
  const tagsHtml = p.tagKeys.length > 0
    ? `<div class="product-tags">${p.tagKeys.map((t) => `<span class="product-tag">${t}</span>`).join('')}</div>`
    : '';

  const body = `<div class="product-card">
    ${heroHtml}
    <div class="product-body">
      <div class="product-brand"><a href="${brandUrl}" target="_blank" rel="noopener">${brand.title.text}</a></div>
      <div class="product-title">${p.title.text}</div>
      <div class="product-badges">${badges.join('')}</div>
      ${priceHtml}
      ${descHtml}
      ${ctaHtml}
      ${tagsHtml}
      <div class="product-meta">
        <span>בתוקף עד ${formatDate(p.expirationDate)}</span>
      </div>
      <div class="product-footer-link"><a class="entity-link" href="${productUrl}" target="_blank" rel="noopener">צפייה באתר ←</a></div>
    </div>
  </div>`;

  return body;
}

export function renderProductDetailCard(page: ProductPage): string {
  return wrapInHtmlDoc(renderProductDetailBody(page), productCSS);
}
