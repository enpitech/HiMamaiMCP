import type { SearchResults } from '../types/index.js';
import { wrapInHtmlDoc, hiMamiUrl, formatDate } from './theme.js';
import { getTierBadge } from './campaign-card.js';

export const searchCSS = `
  .search-header {
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .search-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .search-subtitle {
    font-size: 0.8rem;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .search-empty {
    text-align: center;
    padding: 32px 16px;
    color: var(--color-muted);
  }
  .search-empty-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  .deal-card {
    border-bottom: 1px solid var(--color-border);
    overflow: hidden;
  }
  .deal-card:last-child {
    border-bottom: none;
  }
  .deal-hero-wrap {
    position: relative;
    overflow: hidden;
  }
  .deal-hero {
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    display: block;
  }
  .deal-body {
    padding: 12px 16px;
  }
  .deal-footer-link {
    margin-top: 8px;
    text-align: left;
  }
  .deal-brand {
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .deal-brand-logo {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    object-fit: contain;
  }
  .deal-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.4;
    margin-bottom: 4px;
  }
  .deal-description {
    font-size: 0.85rem;
    color: var(--color-muted);
    line-height: 1.4;
    margin-bottom: 8px;
  }
  .deal-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }
  .deal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: var(--color-muted);
    padding-top: 6px;
    border-top: 1px solid var(--color-border);
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .brand-row-logo {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: contain;
    flex-shrink: 0;
    background: rgba(128,128,128,0.08);
  }
  .brand-row-info {
    flex: 1;
    min-width: 0;
  }
  .brand-row-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text);
  }
  .brand-row-desc {
    font-size: 0.8rem;
    color: var(--color-muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

function extractTitle(item: Record<string, unknown>): string {
  const title = item.title as { text?: string } | undefined;
  return title?.text ?? String(item.name ?? item.slug ?? '');
}

function extractImage(item: Record<string, unknown>): string | null {
  const mainMedia = item.mainMedia as { url?: string } | undefined;
  const logo = item.logo as { url?: string } | undefined;
  const image = item.image as { url?: string } | undefined;
  return mainMedia?.url ?? logo?.url ?? image?.url ?? null;
}

function extractDescription(item: Record<string, unknown>): string | null {
  const displayStrings = item.displayStrings as Array<{ type: string; value: { text: string } }> | undefined;
  if (!displayStrings) return null;
  const desc = displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  return desc?.value?.text ?? null;
}

function renderDealCard(item: Record<string, unknown>, type: 'campaign' | 'product'): string {
  const title = extractTitle(item);
  const imgUrl = extractImage(item);
  const description = extractDescription(item);
  const id = item.id as string | undefined;
  const expirationDate = item.expirationDate as string | undefined;
  const expirationTag = item.expirationTag as string | undefined;

  // Image with validity overlay
  let heroHtml = '';
  if (imgUrl) {
    const overlayHtml = expirationDate && expirationTag !== 'ENDED'
      ? `<span class="validity-overlay">בתוקף עד ${formatDate(expirationDate)}</span>`
      : '';
    heroHtml = `<div class="deal-hero-wrap"><img class="deal-hero" src="${imgUrl}" alt="${title}">${overlayHtml}</div>`;
  }

  // Badges — max 2 to keep it clean
  const badges: string[] = [];
  const discountPct = item.discountPercentage as number | undefined;
  const tierType = item.tierType as string | undefined;
  const campaignTypeLabel = item.campaignTypeLabel as string | undefined;
  const price = item.price as { discountedPrice?: number; currency?: string; discountPercent?: number } | undefined;

  if (discountPct) {
    badges.push(`<span class="badge badge-discount">${discountPct}% הנחה</span>`);
  } else if (price?.discountPercent) {
    badges.push(`<span class="badge badge-discount">${price.discountPercent}% הנחה</span>`);
  } else if (campaignTypeLabel === 'GIFT') {
    badges.push(`<span class="badge badge-gift">🎁 מתנה</span>`);
  }

  const tierBadge = getTierBadge((tierType ?? 'STANDARD') as 'STANDARD' | 'MAMI_PLUS' | 'MAMI_PLUS_EXCLUSIVE');
  if (tierBadge) badges.push(tierBadge);

  if (expirationTag === 'ENDS_TODAY') {
    badges.push(`<span class="badge badge-ends-today">⏰ מסתיים היום!</span>`);
  } else if (expirationTag === 'ENDS_TOMORROW') {
    badges.push(`<span class="badge badge-ends-tomorrow">⏰ מסתיים מחר</span>`);
  }

  // Price
  const brandSlug = item.brandSlug as string | undefined;
  let priceHtml = '';
  if (price?.discountedPrice) {
    priceHtml = `<span class="price-discounted">${price.discountedPrice} ${price.currency ?? '₪'}</span>`;
  }

  // Footer with price + link
  const entityUrl = id ? hiMamiUrl(type, id) : null;
  const linkHtml = entityUrl
    ? `<div class="deal-footer-link"><a class="entity-link" href="${entityUrl}" target="_blank" rel="noopener">לפרטים ←</a></div>`
    : '';

  const footerHtml = priceHtml
    ? `<div class="deal-footer"><span></span>${priceHtml}</div>`
    : '';

  return `<div class="deal-card">
    ${heroHtml}
    <div class="deal-body">
      ${brandSlug ? `<div class="deal-brand">${brandSlug}</div>` : ''}
      ${badges.length > 0 ? `<div class="deal-badges">${badges.join('')}</div>` : ''}
      <div class="deal-title">${title}</div>
      ${description ? `<div class="deal-description">${description}</div>` : ''}
      ${footerHtml}
      ${linkHtml}
    </div>
  </div>`;
}

function renderBrandRow(item: Record<string, unknown>): string {
  const title = extractTitle(item);
  const slug = item.slug as string | undefined;
  const logoUrl = (item.logo as { url?: string } | undefined)?.url;
  const description = extractDescription(item);

  const logoHtml = logoUrl
    ? `<img class="brand-row-logo" src="${logoUrl}" alt="${title}">`
    : '';

  const brandUrl = slug ? hiMamiUrl('brand', slug) : null;

  return `<div class="brand-row">
    ${logoHtml}
    <div class="brand-row-info">
      <div class="brand-row-name">${title}</div>
      ${description ? `<div class="brand-row-desc">${description}</div>` : ''}
    </div>
    ${brandUrl ? `<a class="entity-link" href="${brandUrl}" target="_blank" rel="noopener">←</a>` : ''}
  </div>`;
}

export function renderSearchResultsBody(results: SearchResults): string {
  const totalResults =
    results.brands.totalCount +
    results.campaigns.totalCount +
    results.products.totalCount +
    results.categories.totalCount;

  if (totalResults === 0) {
    return `<div class="search-empty">
      <div class="search-empty-icon">🔍</div>
      <div>לא נמצאו תוצאות עבור "${results.query}"</div>
    </div>`;
  }

  const parts: string[] = [];

  // Header
  parts.push(`<div class="search-header">
    <div class="search-title">תוצאות חיפוש: "${results.query}"</div>
    <div class="search-subtitle">${totalResults} תוצאות ב-Hi Mami</div>
  </div>`);

  // Campaigns — rendered as rich deal cards with hero images
  for (const raw of results.campaigns.items) {
    parts.push(renderDealCard(raw as Record<string, unknown>, 'campaign'));
  }

  // Products — rendered as rich deal cards
  for (const raw of results.products.items) {
    parts.push(renderDealCard(raw as Record<string, unknown>, 'product'));
  }

  // Brands — compact rows with logo
  for (const raw of results.brands.items) {
    parts.push(renderBrandRow(raw as Record<string, unknown>));
  }

  return parts.join('');
}

export function renderSearchResultsCard(results: SearchResults): string {
  return wrapInHtmlDoc(renderSearchResultsBody(results), searchCSS);
}
