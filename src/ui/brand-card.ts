import type { BrandPage, CollectionItem, CampaignDetails, ProductDetails } from '../types/index.js';
import { wrapInHtmlDoc } from './theme.js';

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
  }
  .brand-deals-header {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-accent);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .brand-deal-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: var(--border-radius-sm);
    margin-bottom: 4px;
    border: 1px solid var(--color-border);
    background: var(--color-bg-alt);
  }
  .brand-deal-img {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .brand-deal-img-placeholder {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .brand-deal-meta {
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-top: 2px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .brand-link {
    display: block;
    text-align: center;
    margin-top: 12px;
    padding: 10px;
    background: var(--color-accent);
    color: #fff;
    border-radius: var(--border-radius-sm);
    font-weight: 600;
    text-decoration: none;
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

  const heroHtml = b.mainMedia?.url
    ? `<img class="brand-hero-img" src="${b.mainMedia.url}" alt="${b.title.text}">`
    : '';

  const logoHtml = b.logo?.url
    ? `<div class="brand-logo-overlay"><img src="${b.logo.url}" alt="${b.title.text}"></div>`
    : '';

  const desc = b.displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  const descHtml = desc ? `<div class="brand-description">${desc.value.text}</div>` : '';

  // Extract deals from page sections
  const deals = extractDeals(page.pageSections as unknown as { items: Array<{ items: { items: CollectionItem[] } }> });
  const maxDeals = 8;
  const visibleDeals = deals.slice(0, maxDeals);

  let dealsHtml = '';
  if (visibleDeals.length > 0) {
    const rows = visibleDeals.map((deal) => {
      const title = deal.data.title.text;
      const imgUrl = deal.data.mainMedia?.url;
      const meta: string[] = [];

      if (deal.type === 'campaign') {
        const c = deal.data as CampaignDetails;
        if (c.discountPercentage) meta.push(`${c.discountPercentage}% הנחה`);
        if (c.campaignTypeLabel === 'GIFT') meta.push('🎁 מתנה');
        if (c.tierType === 'MAMI_PLUS') meta.push('⭐ מאמי+');
      } else {
        const p = deal.data as ProductDetails;
        if (p.price) meta.push(`₪${p.price.discountedPrice}`);
        if (p.price?.discountPercent) meta.push(`-${p.price.discountPercent}%`);
      }

      const imgHtml = imgUrl
        ? `<img class="brand-deal-img" src="${imgUrl}" alt="${title}">`
        : `<div class="brand-deal-img-placeholder">${deal.type === 'campaign' ? '🎯' : '📦'}</div>`;

      return `<div class="brand-deal-item">
        ${imgHtml}
        <div class="brand-deal-info">
          <div class="brand-deal-title">${title}</div>
          ${meta.length > 0 ? `<div class="brand-deal-meta">${meta.map((m) => `<span>${m}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
    }).join('');

    const moreCount = deals.length - maxDeals;
    const moreHtml = moreCount > 0 ? `<div style="text-align:center;font-size:0.85rem;color:var(--color-muted);margin-top:8px">+ ${moreCount} הטבות נוספות</div>` : '';

    dealsHtml = `
      <div class="brand-deals-header">🎯 מבצעים והטבות פעילים (${deals.length})</div>
      ${rows}
      ${moreHtml}
    `;
  }

  const body = `<div class="brand-card">
    <div class="brand-hero">
      ${heroHtml}
      ${logoHtml}
    </div>
    <div class="brand-body">
      <div class="brand-name">${b.title.text}</div>
      ${descHtml}
      ${dealsHtml}
      <a class="brand-link" href="https://hi-mami.com/brands/${b.slug}" target="_blank" rel="noopener">
        צפייה בכל המבצעים של ${b.title.text} ←
      </a>
    </div>
  </div>`;

  return body;
}

export function renderBrandPageCard(page: BrandPage): string {
  return wrapInHtmlDoc(renderBrandPageBody(page), brandCSS);
}
