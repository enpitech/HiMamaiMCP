import type { SearchResults } from '../types/index.js';
import { wrapInHtmlDoc } from './theme.js';

export const searchCSS = `
  .search-header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .search-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-primary);
  }
  .search-subtitle {
    font-size: 0.85rem;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .search-group {
    padding: 12px 16px;
  }
  .search-group-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-accent);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .search-group-count {
    font-weight: 400;
    color: var(--color-muted);
    font-size: 0.8rem;
  }
  .search-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--border-radius-sm);
    margin-bottom: 4px;
    transition: background 0.15s;
  }
  .search-item:hover {
    background: var(--color-bg-alt);
  }
  .search-item-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .search-item-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
  }
  .search-item-info {
    flex: 1;
    min-width: 0;
  }
  .search-item-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .search-item-meta {
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
`;

function extractTitle(item: Record<string, unknown>): string {
  const title = item.title as { text?: string } | undefined;
  return title?.text ?? String(item.name ?? item.slug ?? '');
}

function extractImage(item: Record<string, unknown>): string | null {
  const logo = item.logo as { url?: string } | undefined;
  const mainMedia = item.mainMedia as { url?: string } | undefined;
  const image = item.image as { url?: string } | undefined;
  return logo?.url ?? mainMedia?.url ?? image?.url ?? null;
}

function renderGroup(
  icon: string,
  label: string,
  items: unknown[],
  totalCount: number,
  typeLabel: string,
): string {
  if (items.length === 0) return '';

  const rows = items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const title = extractTitle(item);
    const imgUrl = extractImage(item);
    const slug = item.slug as string | undefined;
    const id = item.id as string | undefined;

    const meta: string[] = [];
    if (item.discountPercentage) meta.push(`${item.discountPercentage}% הנחה`);
    if (item.expirationTag === 'ENDS_TODAY') meta.push('מסתיים היום!');
    else if (item.expirationTag === 'ENDS_TOMORROW') meta.push('מסתיים מחר');
    if (item.tierType === 'MAMI_PLUS') meta.push('מאמי פלוס');
    if (item.tierType === 'MAMI_PLUS_EXCLUSIVE') meta.push('בלעדי למאמי פלוס');

    const price = item.price as { discountedPrice?: number; currency?: string; discountPercent?: number } | undefined;
    if (price) {
      meta.push(`${price.discountedPrice} ${price.currency ?? '₪'}`);
      if (price.discountPercent) meta.push(`-${price.discountPercent}%`);
    }

    const imgHtml = imgUrl
      ? `<img class="search-item-img" src="${imgUrl}" alt="${title}">`
      : `<div class="search-item-placeholder">${icon}</div>`;

    const identifier = slug ?? id ?? '';

    return `<div class="search-item" data-type="${typeLabel}" data-id="${identifier}">
      ${imgHtml}
      <div class="search-item-info">
        <div class="search-item-title">${title}</div>
        ${meta.length > 0 ? `<div class="search-item-meta">${meta.join(' · ')}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="search-group">
    <div class="search-group-title">
      ${icon} ${label}
      <span class="search-group-count">(${totalCount})</span>
    </div>
    ${rows}
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

  const header = `<div class="search-header">
    <div class="search-title">🔍 נמצאו ${totalResults} תוצאות עבור "${results.query}"</div>
    <div class="search-subtitle">Hi Mami מבצעים והטבות</div>
  </div>`;

  const groups = [
    renderGroup('🏷️', 'מותגים', results.brands.items, results.brands.totalCount, 'brand'),
    renderGroup('🎯', 'מבצעים', results.campaigns.items, results.campaigns.totalCount, 'campaign'),
    renderGroup('📦', 'מוצרים', results.products.items, results.products.totalCount, 'product'),
    renderGroup('📂', 'קטגוריות', results.categories.items, results.categories.totalCount, 'category'),
  ].filter(Boolean).join('<hr class="card-divider">');

  return header + groups;
}

export function renderSearchResultsCard(results: SearchResults): string {
  return wrapInHtmlDoc(renderSearchResultsBody(results), searchCSS);
}
