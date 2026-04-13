import type { CategoryPage, CollectionItem, CampaignDetails, ProductDetails, BrandMetadata } from '../types/index.js';
import { wrapInHtmlDoc, hiMamiUrl, escapeHtml, icon } from './theme.js';

export const categoryCSS = `
  .category-card {
    width: 100%;
    background: var(--color-card-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .category-header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .category-thumb {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .category-thumb-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-primary);
  }
  .category-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .category-path {
    font-size: 0.8rem;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .category-sections {
    padding: 8px 16px 16px;
  }
  .category-section {
    margin-bottom: 16px;
  }
  .category-section-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .category-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .category-item:last-child {
    border-bottom: none;
  }
  .category-item-img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .category-item-info {
    flex: 1;
    min-width: 0;
  }
  .category-item-title {
    font-weight: 600;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .category-item-meta {
    font-size: 0.75rem;
    color: var(--color-muted);
    margin-top: 1px;
  }
  .category-see-all {
    display: inline-block;
    margin-top: 6px;
    font-size: 0.85rem;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
  }
  .category-item-link {
    flex-shrink: 0;
    font-size: 0.8rem;
  }
`;

function renderCollectionItem(item: CollectionItem): string {
  let title = '';
  let imgUrl: string | null = null;
  let meta = '';
  let entityUrl: string | null = null;

  switch (item.type) {
    case 'CAMPAIGN_DETAILS': {
      const c = item.data as CampaignDetails;
      title = c.title.text;
      imgUrl = c.mainMedia?.url ?? null;
      entityUrl = hiMamiUrl('campaign', c.id);
      const parts: string[] = [];
      if (c.discountPercentage) parts.push(`${c.discountPercentage}% הנחה`);
      if (c.tierType === 'MAMI_PLUS') parts.push('מאמי+');
      meta = parts.join(' · ');
      break;
    }
    case 'PRODUCT_DETAILS': {
      const p = item.data as ProductDetails;
      title = p.title.text;
      imgUrl = p.mainMedia?.url ?? null;
      entityUrl = hiMamiUrl('product', p.id);
      if (p.price) meta = `₪${p.price.discountedPrice} (${p.price.discountPercent}% הנחה)`;
      break;
    }
    case 'BRAND_METADATA': {
      const b = item.data as BrandMetadata;
      title = b.title.text;
      imgUrl = b.logo?.url ?? null;
      entityUrl = hiMamiUrl('brand', b.slug);
      break;
    }
    default:
      return '';
  }

  const imgHtml = imgUrl
    ? `<img class="category-item-img" src="${imgUrl}" alt="${escapeHtml(title)}">`
    : '';

  const linkHtml = entityUrl
    ? `<a class="entity-link category-item-link" href="${entityUrl}" target="_blank" rel="noopener" aria-label="${escapeHtml(title)} - לפרטים">לפרטים</a>`
    : '';

  return `<div class="category-item">
    ${imgHtml}
    <div class="category-item-info">
      <div class="category-item-title">${escapeHtml(title)}</div>
      ${meta ? `<div class="category-item-meta">${meta}</div>` : ''}
    </div>
    ${linkHtml}
  </div>`;
}

export function renderCategoryPageBody(page: CategoryPage): string {
  const cat = page.categoryMetadata;

  const thumbHtml = cat.thumbnail?.url
    ? `<img class="category-thumb" src="${cat.thumbnail.url}" alt="${escapeHtml(cat.title.text)}">`
    : `<div class="category-thumb-placeholder">${icon('folder', 24)}</div>`;

  const pathHtml = cat.ancestorSlugs.length > 0
    ? `<div class="category-path">${cat.ancestorSlugs.map((s) => escapeHtml(s)).join(' / ')} / ${escapeHtml(cat.slug)}</div>`
    : '';

  let sectionsHtml = '';
  const sections = page.pageSections?.items ?? [];

  for (const section of sections.slice(0, 5)) {
    const sectionTitle = section.title?.text ?? '';
    const items = section.items?.items ?? [];
    const maxItems = 5;
    const visibleItems = items.slice(0, maxItems);

    if (visibleItems.length === 0) continue;

    const sectionIcon = section.type === 'BRANDS' ? icon('tag') : section.type === 'CAMPAIGNS' ? icon('target') : icon('package');
    const itemsHtml = visibleItems.map(renderCollectionItem).join('');

    const seeAllHtml = items.length > maxItems
        ? `<div class="category-see-all">+ ${items.length - maxItems} נוספים</div>`
        : '';

    sectionsHtml += `<div class="category-section">
      <div class="category-section-title">${sectionIcon} ${escapeHtml(sectionTitle)}</div>
      ${itemsHtml}
      ${seeAllHtml}
    </div>`;
  }

  const body = `<div class="category-card">
    <div class="category-header">
      ${thumbHtml}
      <div>
        <div class="category-title">${escapeHtml(cat.title.text)}</div>
        ${pathHtml}
      </div>
    </div>
    <div class="category-sections">
      ${sectionsHtml || '<div style="text-align:center;padding:20px;color:var(--color-muted)">אין פריטים בקטגוריה זו</div>'}
    </div>
  </div>`;

  return body;
}

export function renderCategoryPageCard(page: CategoryPage): string {
  return wrapInHtmlDoc(renderCategoryPageBody(page), categoryCSS);
}
