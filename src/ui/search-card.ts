import type { SearchResults } from '../types/index.js';
import { wrapInHtmlDoc, hiMamiUrl, escapeHtml, icon } from './theme.js';

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
    max-width: 60ch;
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

function extractBrandName(item: Record<string, unknown>): string | null {
  // Try brand logo alt text from medias (contains Hebrew brand name)
  const medias = item.medias as Array<{ type: string; value: { metadata?: { alt?: string } } }> | undefined;
  if (medias) {
    const brandLogo = medias.find((m) => m.type === 'BRAND_LOGO');
    if (brandLogo?.value?.metadata?.alt) {
      return brandLogo.value.metadata.alt.replace(/^לוגו\s*/, '');
    }
  }
  // Fall back to slug
  return item.brandSlug as string | null;
}

function extractDescription(item: Record<string, unknown>): string | null {
  const displayStrings = item.displayStrings as Array<{ type: string; value: { text: string } }> | undefined;
  if (!displayStrings) return null;
  const desc = displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  return desc?.value?.text ?? null;
}

// Compact row for a deal (campaign/product). A full-width hero per result made
// the search card several screens tall with slow-loading images; a small
// thumbnail + meta line keeps it a tight, scannable list.
function renderDealCard(item: Record<string, unknown>, type: 'campaign' | 'product'): string {
  const title = extractTitle(item);
  const imgUrl = extractImage(item);
  const id = item.id as string | undefined;
  const expirationTag = item.expirationTag as string | undefined;
  const discountPct = item.discountPercentage as number | undefined;
  const campaignTypeLabel = item.campaignTypeLabel as string | undefined;
  const price = item.price as { discountedPrice?: number; currency?: string; discountPercent?: number } | undefined;
  const brandName = extractBrandName(item);

  // One short meta line: brand · discount/price · urgency.
  const meta: string[] = [];
  if (brandName) meta.push(brandName);
  if (price?.discountedPrice) meta.push(`${price.discountedPrice} ${price.currency ?? '₪'}`);
  if (discountPct) meta.push(`${discountPct}% הנחה`);
  else if (price?.discountPercent) meta.push(`${price.discountPercent}% הנחה`);
  else if (campaignTypeLabel === 'GIFT') meta.push('מתנה');
  if (expirationTag === 'ENDS_TODAY') meta.push('מסתיים היום!');
  else if (expirationTag === 'ENDS_TOMORROW') meta.push('מסתיים מחר');

  const thumbHtml = imgUrl
    ? `<img class="brand-row-logo" src="${imgUrl}" alt="${escapeHtml(title)}">`
    : '';
  const entityUrl = id ? hiMamiUrl(type, id) : null;

  return `<div class="brand-row">
    ${thumbHtml}
    <div class="brand-row-info">
      <div class="brand-row-name">${escapeHtml(title)}</div>
      ${meta.length > 0 ? `<div class="brand-row-desc">${escapeHtml(meta.join(' · '))}</div>` : ''}
    </div>
    ${entityUrl ? `<a class="entity-link" href="${entityUrl}" target="_blank" rel="noopener" aria-label="${escapeHtml(title)} - לפרטים">לפרטים ←</a>` : ''}
  </div>`;
}

function renderBrandRow(item: Record<string, unknown>): string {
  const title = extractTitle(item);
  const slug = item.slug as string | undefined;
  const logoUrl = (item.logo as { url?: string } | undefined)?.url;
  const description = extractDescription(item);

  const logoHtml = logoUrl
    ? `<img class="brand-row-logo" src="${logoUrl}" alt="${escapeHtml(title)}">`
    : '';

  const brandUrl = slug ? hiMamiUrl('brand', slug) : null;

  return `<div class="brand-row">
    ${logoHtml}
    <div class="brand-row-info">
      <div class="brand-row-name">${escapeHtml(title)}</div>
      ${description ? `<div class="brand-row-desc">${escapeHtml(description)}</div>` : ''}
    </div>
    ${brandUrl ? `<a class="entity-link" href="${brandUrl}" target="_blank" rel="noopener" aria-label="${escapeHtml(title)} - לפרטים">←</a>` : ''}
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
      <div>לא נמצאו תוצאות עבור "${escapeHtml(results.query)}"</div>
    </div>`;
  }

  const parts: string[] = [];

  // Header
  parts.push(`<div class="search-header">
    <div class="search-title">תוצאות חיפוש: "${escapeHtml(results.query)}"</div>
    <div class="search-subtitle">${totalResults} תוצאות ב-Hi Mami</div>
  </div>`);

  // Compact rows, capped per group so the card stays roughly one screen.
  // The full list (with links) is in the text response for the model to relay.
  const sectionRow = (label: string): string =>
    `<div class="search-section-label">${label}</div>`;

  const campaigns = results.campaigns.items.slice(0, 6);
  const products = results.products.items.slice(0, 4);
  const brands = results.brands.items.slice(0, 6);

  if (campaigns.length > 0) {
    parts.push(sectionRow(`${icon('tag')} מבצעים`));
    for (const raw of campaigns) parts.push(renderDealCard(raw as Record<string, unknown>, 'campaign'));
  }
  if (products.length > 0) {
    parts.push(sectionRow(`${icon('package')} מוצרים`));
    for (const raw of products) parts.push(renderDealCard(raw as Record<string, unknown>, 'product'));
  }
  if (brands.length > 0) {
    parts.push(sectionRow(`${icon('star')} מותגים`));
    for (const raw of brands) parts.push(renderBrandRow(raw as Record<string, unknown>));
  }

  return parts.join('');
}

export function renderSearchResultsCard(results: SearchResults): string {
  return wrapInHtmlDoc(renderSearchResultsBody(results), searchCSS);
}
