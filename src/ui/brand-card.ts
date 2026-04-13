import type { BrandPage, CollectionItem, CampaignDetails, ProductDetails } from '../types/index.js';
import { wrapInHtmlDoc, hiMamiUrl, formatDate, escapeHtml, icon } from './theme.js';

export const brandCSS = `
  .brand-card {
    width: 100%;
    background: var(--color-card-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .brand-hero {
    position: relative;
    width: 100%;
    height: 160px;
    overflow: hidden;
    background: var(--color-bg-alt);
  }
  .brand-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .brand-logo-overlay {
    position: absolute;
    bottom: -24px;
    right: 16px;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: rgba(128,128,128,0.15);
    box-shadow: var(--shadow-sm);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-logo-overlay img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }
  .brand-body {
    padding: 16px;
    padding-top: 32px;
  }
  .brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 6px;
  }
  .brand-description {
    font-size: 0.9rem;
    color: var(--color-muted);
    margin-bottom: 16px;
    line-height: 1.5;
    max-width: 60ch;
  }
  .brand-name a {
    color: inherit;
    text-decoration: none;
  }
  .brand-deals-header {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand-deals-see-all {
    font-size: 0.8rem;
    font-weight: 600;
  }
  .brand-deal-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px;
    border-radius: var(--border-radius-sm);
    margin-bottom: 6px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .brand-deal-img {
    width: 80px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .brand-deal-img-placeholder {
    width: 80px;
    height: 60px;
    border-radius: 8px;
    background: var(--color-secondary);
    flex-shrink: 0;
  }
  .brand-deal-info {
    flex: 1;
    min-width: 0;
  }
  .brand-deal-title {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--color-text);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .brand-deal-meta {
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-top: 3px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .brand-deal-link {
    flex-shrink: 0;
    font-size: 0.85rem;
    align-self: center;
  }
`;

function extractDeals(sections: { items: Array<{ items: { items: CollectionItem[] } }> }): Array<{ type: 'campaign' | 'product'; data: CampaignDetails | ProductDetails }> {
  const deals: Array<{ type: 'campaign' | 'product'; data: CampaignDetails | ProductDetails }> = [];

  for (const section of sections.items) {
    if (!section.items?.items) continue;
    for (const item of section.items.items) {
      if (item.type === 'CAMPAIGN_DETAILS') {
        deals.push({ type: 'campaign', data: item.data as CampaignDetails });
      } else if (item.type === 'PRODUCT_DETAILS') {
        deals.push({ type: 'product', data: item.data as ProductDetails });
      }
    }
  }

  return deals;
}

export function renderBrandPageBody(page: BrandPage): string {
  const b = page.brandMetadata;
  const brandUrl = hiMamiUrl('brand', b.slug);

  const heroHtml = b.mainMedia?.url
    ? `<img class="brand-hero-img" src="${b.mainMedia.url}" alt="${escapeHtml(b.title.text)}">`
    : '';

  const logoHtml = b.logo?.url
    ? `<div class="brand-logo-overlay"><img src="${b.logo.url}" alt="${escapeHtml(b.title.text)}"></div>`
    : '';

  const desc = b.displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  const descHtml = desc ? `<div class="brand-description">${escapeHtml(desc.value.text)}</div>` : '';

  // Extract deals from page sections
  const deals = extractDeals(page.pageSections as unknown as { items: Array<{ items: { items: CollectionItem[] } }> });
  const maxDeals = 8;
  const visibleDeals = deals.slice(0, maxDeals);

  let dealsHtml = '';
  if (visibleDeals.length > 0) {
    const rows = visibleDeals.map((deal) => {
      const title = deal.data.title.text;
      const imgUrl = deal.data.mainMedia?.url;
      const dealId = deal.data.id;
      const dealUrl = hiMamiUrl(deal.type === 'campaign' ? 'campaign' : 'product', dealId);
      const meta: string[] = [];

      if (deal.type === 'campaign') {
        const c = deal.data as CampaignDetails;
        if (c.discountPercentage) meta.push(`${c.discountPercentage}% הנחה`);
        if (c.campaignTypeLabel === 'GIFT') meta.push(`${icon('gift')} מתנה`);
        if (c.tierType === 'MAMI_PLUS') meta.push('מאמי+');
        if (c.expirationTag === 'ENDS_TODAY') meta.push(`${icon('clock')} מסתיים היום`);
        else if (c.expirationTag === 'ENDS_TOMORROW') meta.push(`${icon('clock')} מסתיים מחר`);
        else if (c.expirationDate) meta.push(`עד ${formatDate(c.expirationDate)}`);
      } else {
        const p = deal.data as ProductDetails;
        if (p.price) meta.push(`₪${p.price.discountedPrice}`);
        if (p.price?.discountPercent) meta.push(`-${p.price.discountPercent}%`);
        if (p.expirationDate) meta.push(`עד ${formatDate(p.expirationDate)}`);
      }

      const imgHtml = imgUrl
        ? `<img class="brand-deal-img" src="${imgUrl}" alt="${escapeHtml(title)}">`
        : `<div class="brand-deal-img-placeholder"></div>`;

      return `<div class="brand-deal-item">
        ${imgHtml}
        <div class="brand-deal-info">
          <div class="brand-deal-title">${escapeHtml(title)}</div>
          ${meta.length > 0 ? `<div class="brand-deal-meta">${meta.map((m) => `<span>${m}</span>`).join('')}</div>` : ''}
        </div>
        <a class="entity-link brand-deal-link" href="${dealUrl}" target="_blank" rel="noopener" aria-label="${escapeHtml(title)} - לפרטים">לפרטים</a>
      </div>`;
    }).join('');

    const seeAllHtml = `<a class="entity-link brand-deals-see-all" href="${brandUrl}" target="_blank" rel="noopener">עוד ←</a>`;

    dealsHtml = `
      <div class="brand-deals-header"><span>מבצעים והטבות (${deals.length})</span>${seeAllHtml}</div>
      ${rows}
    `;
  }

  const body = `<div class="brand-card">
    <div class="brand-hero">
      ${heroHtml}
      ${logoHtml}
    </div>
    <div class="brand-body">
      <div class="brand-name"><a class="heading-link" href="${brandUrl}" target="_blank" rel="noopener">${escapeHtml(b.title.text)}</a></div>
      ${descHtml}
      ${dealsHtml}
    </div>
  </div>`;

  return body;
}

export function renderBrandPageCard(page: BrandPage): string {
  return wrapInHtmlDoc(renderBrandPageBody(page), brandCSS);
}
