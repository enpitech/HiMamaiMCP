import type { CampaignPage, ConversionAction, DisplayString, ExpirationTag, TierType, CampaignTypeLabel } from '../types/index.js';
import { wrapInHtmlDoc } from './theme.js';

export const campaignCSS = `
  .campaign-card {
    width: 100%;
    background: var(--color-card-bg);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .campaign-brand-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--color-bg-alt);
    border-bottom: 1px solid var(--color-border);
  }
  .campaign-brand-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: contain;
    background: rgba(128,128,128,0.15);
  }
  .campaign-brand-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--color-text);
  }
  .campaign-hero {
    width: 100%;
    max-height: 240px;
    object-fit: cover;
  }
  .campaign-body {
    padding: 16px;
  }
  .campaign-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }
  .campaign-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .campaign-description {
    font-size: 0.9rem;
    color: var(--color-muted);
    margin-bottom: 12px;
    line-height: 1.5;
  }
  .campaign-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.8rem;
    color: var(--color-muted);
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
  }
  .campaign-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .cta-section {
    margin-top: 14px;
  }
  .cta-label {
    font-size: 0.8rem;
    color: var(--color-muted);
    margin-bottom: 6px;
  }
  .cta-display-strings {
    font-size: 0.85rem;
    color: var(--color-text);
    margin-top: 8px;
  }
  .cta-display-strings p {
    margin-bottom: 4px;
  }
`;

function getExpirationBadge(tag: ExpirationTag, date: string): string {
  const formatted = formatDate(date);
  switch (tag) {
    case 'ENDS_TODAY':
      return `<span class="badge badge-ends-today">⏰ מסתיים היום!</span>`;
    case 'ENDS_TOMORROW':
      return `<span class="badge badge-ends-tomorrow">⏰ מסתיים מחר</span>`;
    case 'ENDS_ON':
      return `<span class="badge badge-discount">📅 בתוקף עד ${formatted}</span>`;
    case 'STARTS_ON':
      return `<span class="badge badge-offer">🔔 מתחיל ב-${formatted}</span>`;
    case 'ENDED':
      return `<span class="badge badge-ended">הסתיים</span>`;
    default:
      return '';
  }
}

function getTierBadge(tier: TierType): string {
  switch (tier) {
    case 'MAMI_PLUS':
      return `<span class="badge badge-mami-plus">⭐ מאמי פלוס</span>`;
    case 'MAMI_PLUS_EXCLUSIVE':
      return `<span class="badge badge-exclusive">👑 בלעדי למאמי פלוס</span>`;
    default:
      return '';
  }
}

function getTypeBadge(label: CampaignTypeLabel, discountPct: number | null): string {
  switch (label) {
    case 'DISCOUNT':
      return discountPct
        ? `<span class="badge badge-discount">${discountPct}% הנחה</span>`
        : `<span class="badge badge-discount">🏷️ הנחה</span>`;
    case 'GIFT':
      return `<span class="badge badge-gift">🎁 מתנה</span>`;
    case 'COMBO':
      return `<span class="badge badge-discount">🔗 קומבו</span>`;
    case 'OFFER':
      return `<span class="badge badge-offer">💡 הצעה</span>`;
    default:
      return '';
  }
}

function renderConversionAction(action: ConversionAction): string {
  const displayStringsHtml = action.displayStrings
    .filter((d) => ['CTA', 'CTA_HEADER', 'CTA_SUBTITLE', 'CTA_REDEMPTION_DETAILS'].includes(d.type))
    .map((d) => `<p>${d.value.text}</p>`)
    .join('');

  let ctaContent = '';

  switch (action.type) {
    case 'GENERIC_CODE':
    case 'PERSONAL_CODE': {
      const data = action.data as { codes?: Array<{ code: string }>; url?: string } | null;
      if (data?.codes && data.codes.length > 0) {
        const codesList = data.codes.map((c) => `<span class="cta-code">${c.code}</span>`).join(' ');
        ctaContent = `<div class="cta-label">קוד:</div>${codesList}`;
        if (data.url) {
          ctaContent += `<div style="margin-top:10px"><a class="cta-link" href="${data.url}" target="_blank" rel="noopener">למימוש ←</a></div>`;
        }
      }
      break;
    }
    case 'LEADING_LINK':
    case 'PURCHASE_LINK':
    case 'PERSONAL_LINK': {
      const data = action.data as { url?: string } | null;
      if (data?.url) {
        ctaContent = `<a class="cta-link" href="${data.url}" target="_blank" rel="noopener">לפרטים ←</a>`;
      }
      break;
    }
    case 'CALL_TO_NUMBER': {
      const data = action.data as { phoneNumber?: string } | null;
      if (data?.phoneNumber) {
        ctaContent = `<a class="cta-link" href="tel:${data.phoneNumber}">📞 ${data.phoneNumber}</a>`;
      }
      break;
    }
    case 'VOUCHER': {
      const data = action.data as { code?: string } | null;
      if (data?.code) {
        ctaContent = `<div class="cta-label">שובר:</div><span class="cta-code">${data.code}</span>`;
      }
      break;
    }
    case 'SET_REMINDER':
      ctaContent = `<div class="cta-label">🔔 ניתן להגדיר תזכורת באתר</div>`;
      break;
    case 'OUT_OF_STOCK':
      ctaContent = `<div class="cta-label">⚠️ אזל מהמלאי</div>`;
      break;
  }

  if (action.isPurchasable && action.catalogItem) {
    const { price, currency } = action.catalogItem;
    ctaContent += `<div style="margin-top:8px;font-size:0.85rem;color:var(--color-muted)">💰 מחיר: ${price} ${currency}</div>`;
  }

  return `<div class="cta-section">
    <div class="cta-box">
      ${ctaContent}
      ${displayStringsHtml ? `<div class="cta-display-strings">${displayStringsHtml}</div>` : ''}
    </div>
  </div>`;
}

function getDescription(displayStrings: DisplayString[]): string {
  const desc = displayStrings.find((d) => d.type === 'DESCRIPTION' || d.type === 'SUBTITLE');
  return desc?.value.text ?? '';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
  } catch {
    return iso;
  }
}

export function renderCampaignDetailBody(page: CampaignPage): string {
  const c = page.campaignDetails;
  const brand = page.brandMetadata;

  const brandLogoHtml = brand.logo?.url
    ? `<img class="campaign-brand-logo" src="${brand.logo.url}" alt="${brand.title.text}">`
    : '';

  const heroHtml = c.mainMedia?.url
    ? `<img class="campaign-hero" src="${c.mainMedia.url}" alt="${c.title.text}">`
    : '';

  const badges = [
    getTypeBadge(c.campaignTypeLabel, c.discountPercentage),
    getTierBadge(c.tierType),
    getExpirationBadge(c.expirationTag, c.expirationDate),
  ].filter(Boolean).join('');

  const description = getDescription(c.displayStrings);

  const ctaHtml = c.conversionAction
    ? renderConversionAction(c.conversionAction)
    : '';

  const smallPrint = c.displayStrings
    .filter((d) => d.type === 'SMALL_PRINT' || d.type === 'DISCLAIMER' || d.type === 'CARD_SMALL_PRINT')
    .map((d) => d.value.text);

  const body = `<div class="campaign-card">
    <div class="campaign-brand-bar">
      ${brandLogoHtml}
      <span class="campaign-brand-name">${brand.title.text}</span>
    </div>
    ${heroHtml}
    <div class="campaign-body">
      <div class="campaign-badges">${badges}</div>
      <div class="campaign-title">${c.title.text}</div>
      ${description ? `<div class="campaign-description">${description}</div>` : ''}
      ${ctaHtml}
      <div class="campaign-meta">
        <span class="campaign-meta-item">📅 ${formatDate(c.startDate)} — ${formatDate(c.expirationDate)}</span>
      </div>
      ${smallPrint.length > 0 ? `<div style="margin-top:8px;font-size:0.75rem;color:var(--color-text-light)">${smallPrint.join(' · ')}</div>` : ''}
    </div>
  </div>`;

  return body;
}

export function renderCampaignDetailCard(page: CampaignPage): string {
  return wrapInHtmlDoc(renderCampaignDetailBody(page), campaignCSS);
}
