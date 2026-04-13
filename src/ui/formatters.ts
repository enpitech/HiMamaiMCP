/**
 * Plain-text formatters for MCP tool responses.
 *
 * MCP spec does NOT support HTML rendering — only text, base64 images, and JSON.
 * These formatters produce clean, structured text that LLMs present naturally.
 */

import type {
  SearchResults,
  BrandPage,
  CampaignPage,
  ProductPage,
  CategoryPage,
  HomePage,
  CampaignDetails,
  ProductDetails,
  CollectionItem,
  ConversionAction,
  ExpirationTag,
  TierType,
  PageSection,
} from '../types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'ILS') return `₪${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
}

function expirationText(tag: ExpirationTag, date: string): string {
  const formatted = formatDate(date);
  switch (tag) {
    case 'ENDS_TODAY': return '⏰ מסתיים היום!';
    case 'ENDS_TOMORROW': return '⏰ מסתיים מחר';
    case 'ENDS_ON': return `📅 בתוקף עד ${formatted}`;
    case 'STARTS_ON': return `🔔 מתחיל ב-${formatted}`;
    case 'ENDED': return '❌ הסתיים';
    default: return `📅 ${formatted}`;
  }
}

function tierText(tier: TierType): string | null {
  switch (tier) {
    case 'MAMI_PLUS': return '⭐ מאמי פלוס';
    case 'MAMI_PLUS_EXCLUSIVE': return '👑 בלעדי למאמי פלוס';
    default: return null;
  }
}

function conversionActionText(action: ConversionAction): string[] {
  const lines: string[] = [];

  switch (action.type) {
    case 'GENERIC_CODE':
    case 'PERSONAL_CODE': {
      const data = action.data as { codes?: Array<{ code: string }>; url?: string } | null;
      if (data?.codes && data.codes.length > 0) {
        lines.push(`🔑 קוד הנחה: ${data.codes.map((c) => c.code).join(', ')}`);
      }
      if (data?.url) {
        lines.push(`🔗 קישור למימוש: ${data.url}`);
      }
      break;
    }
    case 'LEADING_LINK':
    case 'PURCHASE_LINK':
    case 'PERSONAL_LINK': {
      const data = action.data as { url?: string } | null;
      if (data?.url) {
        lines.push(`🔗 קישור: ${data.url}`);
      }
      break;
    }
    case 'CALL_TO_NUMBER': {
      const data = action.data as { phoneNumber?: string } | null;
      if (data?.phoneNumber) {
        lines.push(`📞 טלפון: ${data.phoneNumber}`);
      }
      break;
    }
    case 'VOUCHER': {
      const data = action.data as { code?: string } | null;
      if (data?.code) {
        lines.push(`🎟️ שובר: ${data.code}`);
      }
      break;
    }
    case 'SET_REMINDER':
      lines.push('🔔 ניתן להגדיר תזכורת באתר');
      break;
    case 'OUT_OF_STOCK':
      lines.push('⚠️ אזל מהמלאי');
      break;
  }

  // Include relevant display strings
  for (const ds of action.displayStrings) {
    if (['CTA_REDEMPTION_DETAILS', 'CTA_SUBTITLE'].includes(ds.type) && ds.value.text) {
      lines.push(`  ${ds.value.text}`);
    }
  }

  if (action.isPurchasable && action.catalogItem) {
    const { price, currency } = action.catalogItem;
    lines.push(`💰 מחיר: ${price} ${currency}`);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Search Results
// ---------------------------------------------------------------------------

export function formatSearchResults(results: SearchResults): string {
  const total =
    results.brands.totalCount +
    results.campaigns.totalCount +
    results.products.totalCount +
    results.categories.totalCount;

  if (total === 0) {
    return `🔍 לא נמצאו תוצאות עבור "${results.query}"`;
  }

  const lines: string[] = [];
  lines.push(`🔍 נמצאו ${total} תוצאות עבור "${results.query}"`);
  lines.push('');

  // Brands
  if (results.brands.items.length > 0) {
    lines.push(`🏷️ מותגים (${results.brands.totalCount}):`);
    for (const raw of results.brands.items) {
      const item = raw as Record<string, unknown>;
      const title = (item.title as { text?: string })?.text ?? String(item.slug ?? '');
      const slug = item.slug as string | undefined;
      lines.push(`  • ${title} — https://hi-mami.com/brands/${slug ?? ''}`);
    }
    lines.push('');
  }

  // Campaigns
  if (results.campaigns.items.length > 0) {
    lines.push(`🎯 מבצעים (${results.campaigns.totalCount}):`);
    for (const raw of results.campaigns.items) {
      const item = raw as Record<string, unknown>;
      const title = (item.title as { text?: string })?.text ?? '';
      const id = item.id as string | undefined;
      const meta: string[] = [];
      if (item.discountPercentage) meta.push(`${item.discountPercentage}% הנחה`);
      const tierLabel = tierText(item.tierType as TierType);
      if (tierLabel) meta.push(tierLabel);
      if (item.expirationTag === 'ENDS_TODAY') meta.push('מסתיים היום!');
      else if (item.expirationTag === 'ENDS_TOMORROW') meta.push('מסתיים מחר');
      const suffix = meta.length > 0 ? ` | ${meta.join(' · ')}` : '';
      lines.push(`  • ${title}${suffix}`);
      if (id) lines.push(`    🔗 https://hi-mami.com/campaigns/${id}`);
    }
    lines.push('');
  }

  // Products
  if (results.products.items.length > 0) {
    lines.push(`📦 מוצרים (${results.products.totalCount}):`);
    for (const raw of results.products.items) {
      const item = raw as Record<string, unknown>;
      const title = (item.title as { text?: string })?.text ?? '';
      const id = item.id as string | undefined;
      const price = item.price as { discountedPrice?: number; currency?: string; discountPercent?: number } | undefined;
      const meta: string[] = [];
      if (price) {
        meta.push(`${price.discountedPrice} ${price.currency ?? '₪'}`);
        if (price.discountPercent) meta.push(`-${price.discountPercent}%`);
      }
      const suffix = meta.length > 0 ? ` | ${meta.join(' · ')}` : '';
      lines.push(`  • ${title}${suffix}`);
      if (id) lines.push(`    🔗 https://hi-mami.com/products/${id}`);
    }
    lines.push('');
  }

  // Categories
  if (results.categories.items.length > 0) {
    lines.push(`📂 קטגוריות (${results.categories.totalCount}):`);
    for (const raw of results.categories.items) {
      const item = raw as Record<string, unknown>;
      const title = (item.title as { text?: string })?.text ?? String(item.slug ?? '');
      const slug = item.slug as string | undefined;
      lines.push(`  • ${title} — ${slug ?? ''}`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Campaign Detail
// ---------------------------------------------------------------------------

export function formatCampaignDetail(page: CampaignPage): string {
  const c = page.campaignDetails;
  const brand = page.brandMetadata;

  const lines: string[] = [];
  lines.push(`🎯 ${c.title.text}`);
  lines.push(`🏷️ מותג: ${brand.title.text}`);
  lines.push('');

  // Badges
  const badges: string[] = [];
  if (c.discountPercentage) badges.push(`💰 ${c.discountPercentage}% הנחה`);
  const tier = tierText(c.tierType);
  if (tier) badges.push(tier);
  badges.push(expirationText(c.expirationTag, c.expirationDate));
  lines.push(badges.join(' | '));
  lines.push('');

  // Description
  const desc = c.displayStrings.find((d) => d.type === 'DESCRIPTION');
  const subtitle = c.displayStrings.find((d) => d.type === 'SUBTITLE');
  if (desc) {
    lines.push(desc.value.text);
    lines.push('');
  } else if (subtitle) {
    lines.push(subtitle.value.text);
    lines.push('');
  }

  // CTA
  if (c.conversionAction) {
    lines.push('📋 איך לממש:');
    const ctaLines = conversionActionText(c.conversionAction);
    lines.push(...ctaLines);
    lines.push('');
  }

  // Small print
  const smallPrint = c.displayStrings.filter((d) => d.type === 'SMALL_PRINT' || d.type === 'DISCLAIMER');
  if (smallPrint.length > 0) {
    lines.push('⚠️ תנאים:');
    for (const sp of smallPrint) {
      lines.push(`  ${sp.value.text}`);
    }
    lines.push('');
  }

  // Meta
  lines.push(`📅 תאריכים: ${formatDate(c.startDate)} — ${formatDate(c.expirationDate)}`);
  lines.push('');
  lines.push(`🔗 לצפייה במבצע: https://hi-mami.com/campaigns/${c.id}`);
  lines.push(`🏷️ עמוד המותג: https://hi-mami.com/brands/${c.brandSlug}`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Product Detail
// ---------------------------------------------------------------------------

export function formatProductDetail(page: ProductPage): string {
  const p = page.productDetails;
  const brand = page.brandMetadata;

  const lines: string[] = [];
  lines.push(`📦 ${p.title.text}`);
  lines.push(`🏷️ מותג: ${brand.title.text}`);
  lines.push('');

  // Price
  if (p.price) {
    const currency = p.price.currency || 'ILS';
    lines.push(`💰 מחיר: ${formatCurrency(p.price.discountedPrice, currency)} (במקום ${formatCurrency(p.price.originPrice, currency)})`);
    lines.push(`💵 חיסכון: ${formatCurrency(p.price.discountAmount, currency)} (${p.price.discountPercent}% הנחה)`);
    lines.push('');
  }

  // Badges
  const badges: string[] = [];
  const tier = tierText(p.tierType);
  if (tier) badges.push(tier);
  badges.push(expirationText(p.expirationTag, p.expirationDate));
  if (badges.length > 0) {
    lines.push(badges.join(' | '));
    lines.push('');
  }

  // Description
  const desc = p.displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  if (desc) {
    lines.push(desc.value.text);
    lines.push('');
  }

  // CTA
  if (p.conversionAction) {
    lines.push('📋 איך לממש:');
    const ctaLines = conversionActionText(p.conversionAction);
    lines.push(...ctaLines);
    lines.push('');
  }

  // Tags
  if (p.tagKeys.length > 0) {
    lines.push(`🏷️ תגיות: ${p.tagKeys.join(', ')}`);
  }

  lines.push('');
  lines.push(`🔗 לצפייה במוצר: https://hi-mami.com/products/${p.id}`);
  lines.push(`🏷️ עמוד המותג: https://hi-mami.com/brands/${p.brandSlug}`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Brand Page
// ---------------------------------------------------------------------------

export function formatBrandPage(page: BrandPage): string {
  const b = page.brandMetadata;

  const lines: string[] = [];
  lines.push(`🏷️ ${b.title.text}`);
  lines.push('');

  // Description
  const desc = b.displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  if (desc) {
    lines.push(desc.value.text);
    lines.push('');
  }

  // Deals
  const deals = extractDealsFromSections(page.pageSections);
  if (deals.length > 0) {
    lines.push(`🎯 הטבות פעילות (${deals.length}):`);
    for (const deal of deals.slice(0, 15)) {
      if (deal.type === 'campaign') {
        const c = deal.data as CampaignDetails;
        const meta: string[] = [];
        if (c.discountPercentage) meta.push(`${c.discountPercentage}% הנחה`);
        const tier = tierText(c.tierType);
        if (tier) meta.push(tier);
        meta.push(expirationText(c.expirationTag, c.expirationDate));
        lines.push(`  • ${c.title.text}`);
        lines.push(`    ${meta.join(' | ')}`);
        lines.push(`    🔗 https://hi-mami.com/campaigns/${c.id}`);
      } else {
        const p = deal.data as ProductDetails;
        const meta: string[] = [];
        if (p.price) meta.push(`${formatCurrency(p.price.discountedPrice, p.price.currency || 'ILS')}`);
        if (p.price?.discountPercent) meta.push(`-${p.price.discountPercent}%`);
        meta.push(expirationText(p.expirationTag, p.expirationDate));
        lines.push(`  • ${p.title.text}`);
        lines.push(`    ${meta.join(' | ')}`);
        lines.push(`    🔗 https://hi-mami.com/products/${p.id}`);
      }
    }
    if (deals.length > 15) {
      lines.push(`  ... ועוד ${deals.length - 15} הטבות`);
    }
    lines.push('');
  }

  lines.push(`🔗 https://hi-mami.com/brands/${b.slug}`);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Category Page
// ---------------------------------------------------------------------------

export function formatCategoryPage(page: CategoryPage): string {
  const cat = page.categoryMetadata;

  const lines: string[] = [];
  lines.push(`📂 ${cat.title.text}`);
  if (cat.ancestorSlugs.length > 0) {
    lines.push(`📍 נתיב: ${cat.ancestorSlugs.join(' > ')}`);
  }
  lines.push('');

  // Sections
  if (page.pageSections?.items) {
    for (const section of page.pageSections.items.slice(0, 5)) {
      formatSection(section, lines);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

export function formatHomePage(page: HomePage): string {
  const lines: string[] = [];
  lines.push('🏠 Hi Mami — מבצעים והטבות');
  lines.push('');

  // Highlights
  if (page.hero?.highlights && page.hero.highlights.length > 0) {
    lines.push('⭐ הדגשות:');
    for (const h of page.hero.highlights.slice(0, 8)) {
      lines.push(`  • ${h.title}`);
    }
    lines.push('');
  }

  // Sections
  if (page.pageSections?.items) {
    for (const section of page.pageSections.items.slice(0, 6)) {
      formatSection(section, lines);
    }
  }

  lines.push('🔗 https://hi-mami.com');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function formatSection(section: PageSection, lines: string[]): void {
  const title = section.title?.text;
  if (title) {
    lines.push(`── ${title} ──`);
  }

  if (section.items?.items) {
    for (const item of section.items.items.slice(0, 6)) {
      formatCollectionItem(item, lines);
    }
    const remaining = (section.items.pagination?.totalItems ?? section.items.items.length) - 6;
    if (remaining > 0) {
      lines.push(`  ... ועוד ${remaining}`);
    }
  }

  if (section.seeAll?.text) {
    lines.push(`  → ${section.seeAll.text}`);
  }
  lines.push('');
}

function formatCollectionItem(item: CollectionItem, lines: string[]): void {
  switch (item.type) {
    case 'CAMPAIGN_DETAILS': {
      const c = item.data as CampaignDetails;
      const meta: string[] = [];
      if (c.discountPercentage) meta.push(`${c.discountPercentage}%`);
      const tier = tierText(c.tierType);
      if (tier) meta.push(tier);
      const suffix = meta.length > 0 ? ` (${meta.join(', ')})` : '';
      lines.push(`  🎯 ${c.title.text}${suffix}`);
      lines.push(`     🔗 https://hi-mami.com/campaigns/${c.id}`);
      break;
    }
    case 'PRODUCT_DETAILS': {
      const p = item.data as ProductDetails;
      const meta: string[] = [];
      if (p.price) meta.push(formatCurrency(p.price.discountedPrice, p.price.currency || 'ILS'));
      if (p.price?.discountPercent) meta.push(`-${p.price.discountPercent}%`);
      const suffix = meta.length > 0 ? ` (${meta.join(', ')})` : '';
      lines.push(`  📦 ${p.title.text}${suffix}`);
      lines.push(`     🔗 https://hi-mami.com/products/${p.id}`);
      break;
    }
    case 'BRAND_METADATA': {
      const b = item.data as { title: { text: string }; slug: string };
      lines.push(`  🏷️ ${b.title.text}`);
      lines.push(`     🔗 https://hi-mami.com/brands/${b.slug}`);
      break;
    }
    default:
      break;
  }
}

function extractDealsFromSections(sections: { items: PageSection[] }): Array<{ type: 'campaign' | 'product'; data: CampaignDetails | ProductDetails }> {
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

// ---------------------------------------------------------------------------
// Image URL extraction (for base64 fetching)
// ---------------------------------------------------------------------------

export function getMainImageUrl(page: CampaignPage | ProductPage | BrandPage | HomePage): string | null {
  if ('productDetails' in page) {
    return (page as ProductPage).productDetails.mainMedia?.url ?? null;
  }
  if ('campaignDetails' in page) {
    return (page as CampaignPage).campaignDetails.mainMedia?.url ?? null;
  }
  if ('hero' in page) {
    const banner = (page as HomePage).hero?.banners?.[0];
    return banner?.media?.url ?? null;
  }
  if ('brandMetadata' in page) {
    return (page as BrandPage).brandMetadata.mainMedia?.url ?? (page as BrandPage).brandMetadata.logo?.url ?? null;
  }
  return null;
}
