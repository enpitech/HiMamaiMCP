import type { HomePage, CollectionItem, CampaignDetails, ProductDetails, BrandMetadata } from '../types/index.js';
import { wrapInHtmlDoc } from './theme.js';

export const homeCSS = `
  .home-card {
    max-width: 480px;
    background: var(--color-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .home-hero {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  }
  .home-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .home-hero-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: #fff;
  }
  .home-hero-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .home-hero-subtitle {
    font-size: 0.85rem;
    opacity: 0.9;
  }
  .home-highlights {
    padding: 12px 16px;
    display: flex;
    gap: 10px;
    overflow-x: auto;
    border-bottom: 1px solid var(--color-border);
  }
  .home-highlight {
    flex-shrink: 0;
    text-align: center;
    width: 70px;
  }
  .home-highlight-img {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid var(--color-primary);
    object-fit: cover;
    margin-bottom: 4px;
  }
  .home-highlight-placeholder {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid var(--color-primary);
    background: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    margin: 0 auto 4px;
  }
  .home-highlight-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .home-sections {
    padding: 12px 16px 16px;
  }
  .home-section {
    margin-bottom: 16px;
  }
  .home-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .home-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .home-section-see-all {
    font-size: 0.8rem;
    color: var(--color-accent);
    font-weight: 600;
  }
  .home-items-grid {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .home-grid-item {
    flex-shrink: 0;
    width: 120px;
    border-radius: 10px;
    overflow: hidden;
    background: var(--color-bg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border);
  }
  .home-grid-item img {
    width: 100%;
    height: 80px;
    object-fit: cover;
  }
  .home-grid-item-body {
    padding: 6px 8px;
  }
  .home-grid-item-title {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .home-grid-item-meta {
    font-size: 0.65rem;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .home-welcome {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: #fff;
  }
  .home-welcome h2 {
    font-size: 1.3rem;
    margin-bottom: 4px;
  }
  .home-welcome p {
    font-size: 0.9rem;
    opacity: 0.9;
  }
`;

export function renderHomePageBody(page: HomePage): string {
  // Hero banner
  let heroHtml = '';
  const heroes = page.hero?.banners ?? [];
  if (heroes.length > 0) {
    const hero = heroes[0];
    const imgHtml = hero.media?.url
      ? `<img src="${hero.media.url}" alt="">`
      : '';
    heroHtml = `<div class="home-hero">
      ${imgHtml}
      <div class="home-hero-overlay">
        <div class="home-hero-title">🛍️ היי מאמי</div>
        <div class="home-hero-subtitle">ההטבות הכי שוות</div>
      </div>
    </div>`;
  } else {
    heroHtml = `<div class="home-welcome">
      <h2>🛍️ היי מאמי</h2>
      <p>ההטבות הכי שוות במקום אחד</p>
    </div>`;
  }

  // Highlights (story-like circles)
  let highlightsHtml = '';
  const highlights = page.hero?.highlights ?? [];
  if (highlights.length > 0) {
    const items = highlights.slice(0, 8).map((h: { media?: { url?: string }; title?: string }) => {
      const imgEl = h.media?.url
        ? `<img class="home-highlight-img" src="${h.media.url}" alt="${h.title ?? ''}">`
        : `<div class="home-highlight-placeholder">⭐</div>`;
      return `<div class="home-highlight">
        ${imgEl}
        <div class="home-highlight-label">${h.title ?? ''}</div>
      </div>`;
    }).join('');
    highlightsHtml = `<div class="home-highlights">${items}</div>`;
  }

  // Page sections (deals, brands, etc.)
  let sectionsHtml = '';
  const sections = page.pageSections?.items ?? [];
  for (const section of sections.slice(0, 6)) {
    const sectionTitle = section.title?.text ?? '';
    const items = section.items?.items ?? [];
    const visibleItems = items.slice(0, 6);

    if (visibleItems.length === 0) continue;

    const itemsHtml = visibleItems.map((item: CollectionItem) => {
      let title = '';
      let imgUrl: string | null = null;
      let discount: number | null = null;

      switch (item.type) {
        case 'CAMPAIGN_DETAILS': {
          const c = item.data as CampaignDetails;
          title = c.title.text;
          imgUrl = c.mainMedia?.url ?? null;
          discount = c.discountPercentage;
          break;
        }
        case 'PRODUCT_DETAILS': {
          const p = item.data as ProductDetails;
          title = p.title.text;
          imgUrl = p.mainMedia?.url ?? null;
          discount = p.price?.discountPercent ?? null;
          break;
        }
        case 'BRAND_METADATA': {
          const b = item.data as BrandMetadata;
          title = b.title.text;
          imgUrl = b.logo?.url ?? b.mainMedia?.url ?? null;
          break;
        }
        default: {
          break;
        }
      }

      return `<div class="home-grid-item">
        ${imgUrl ? `<img src="${imgUrl}" alt="${title}">` : ''}
        <div class="home-grid-item-body">
          <div class="home-grid-item-title">${title}</div>
          ${discount ? `<div class="home-grid-item-meta">${discount}% הנחה</div>` : ''}
        </div>
      </div>`;
    }).join('');

    const seeAllHtml = section.seeAll
      ? `<a class="home-section-see-all" href="https://hi-mami.com${section.seeAll.path}" target="_blank" rel="noopener">${section.seeAll.text} ←</a>`
      : '';

    sectionsHtml += `<div class="home-section">
      <div class="home-section-header">
        <div class="home-section-title">${sectionTitle}</div>
        ${seeAllHtml}
      </div>
      <div class="home-items-grid">${itemsHtml}</div>
    </div>`;
  }

  const body = `<div class="home-card">
    ${heroHtml}
    ${highlightsHtml}
    <div class="home-sections">
      ${sectionsHtml || '<div style="text-align:center;padding:20px;color:var(--color-muted)">אין תוכן זמין כרגע</div>'}
    </div>
  </div>`;

  return body;
}

export function renderHomePageCard(page: HomePage): string {
  return wrapInHtmlDoc(renderHomePageBody(page), homeCSS);
}
