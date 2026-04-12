/**
 * HiMami MCP Server — TypeScript type definitions
 *
 * All shared interfaces and types used across the application.
 * Derived from the HiMami public API documentation.
 */

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface MediaBlur {
  type: string;
  hash: string;
}

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface MediaMetadata {
  alt: string | null;
  dimensions: MediaDimensions | null;
  duration: number | null;
}

export interface Media {
  mimeType: string;
  url: string;
  blur: MediaBlur | null;
  metadata: MediaMetadata | null;
  thumbnail: Media | null;
}

// ---------------------------------------------------------------------------
// Display Strings
// ---------------------------------------------------------------------------

export type DisplayStringType =
  | 'SUBTITLE'
  | 'DESCRIPTION'
  | 'DISCLAIMER'
  | 'SMALL_PRINT'
  | 'CARD_SMALL_PRINT'
  | 'CTA'
  | 'SECOND_CTA'
  | 'CTA_HEADER'
  | 'CTA_SUBTITLE'
  | 'CTA_DISCLAIMER'
  | 'CTA_CONTACT'
  | 'CTA_REDEMPTION_DETAILS'
  | 'CTA_PLUS_ALTERNATIVE';

export interface DisplayString {
  type: DisplayStringType;
  value: { text: string };
}

// ---------------------------------------------------------------------------
// Conversion Actions
// ---------------------------------------------------------------------------

export type ConversionActionType =
  | 'GENERIC_CODE'
  | 'PERSONAL_CODE'
  | 'LEADING_LINK'
  | 'PERSONAL_LINK'
  | 'PURCHASE_LINK'
  | 'CALL_TO_NUMBER'
  | 'VOUCHER'
  | 'SET_REMINDER'
  | 'OUT_OF_STOCK';

export interface CodeData {
  codes: Array<{ code: string; name?: string }>;
  url?: string;
}

export interface LinkData {
  url: string;
}

export interface PhoneData {
  phoneNumber: string;
}

export interface VoucherData {
  code: string;
}

export type ConversionActionData = CodeData | LinkData | PhoneData | VoucherData | null;

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  currency: string;
}

export interface ConversionAction {
  type: ConversionActionType;
  data: ConversionActionData;
  displayStrings: DisplayString[];
  isPurchasable: boolean;
  catalogItem: CatalogItem | null;
}

// ---------------------------------------------------------------------------
// Page Sections
// ---------------------------------------------------------------------------

export type SectionType = 'BANNERS' | 'MEDIA_PORTRAIT' | 'BRANDS' | 'CAMPAIGNS' | 'PRODUCTS' | 'MIX';
export type ViewType = 'SLIDER' | 'CAROUSEL' | 'GRID' | 'SINGLE';

export interface SectionConfig {
  viewType: ViewType;
  data: Record<string, unknown>;
}

export interface SeeAll {
  path: string;
  text: string;
}

export interface PageSection {
  id: string;
  type: SectionType;
  title: { text: string } | null;
  subtitle: { text: string } | null;
  items: CollectionItemList;
  thumbnail: Media | null;
  sectionConfig: SectionConfig | null;
  seeAll: SeeAll | null;
}

export interface PageSectionList {
  items: PageSection[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Collection Items
// ---------------------------------------------------------------------------

export type CollectionItemType = 'CAMPAIGN_DETAILS' | 'PRODUCT_DETAILS' | 'BRAND_METADATA' | 'BANNER' | 'MEDIA';

export interface CollectionItem {
  type: CollectionItemType;
  data: CampaignDetails | ProductDetails | BrandMetadata | BannerData | Media;
}

export interface CollectionItemList {
  items: CollectionItem[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Text wrapper
// ---------------------------------------------------------------------------

export interface TextValue {
  text: string;
}

// ---------------------------------------------------------------------------
// Branded Media (used in medias arrays)
// ---------------------------------------------------------------------------

export interface BrandedMedia {
  type: string;
  value: Media;
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export interface BrandMetadata {
  id: string;
  title: TextValue;
  slug: string;
  displayStrings: DisplayString[];
  logo: Media | null;
  mainMedia: Media | null;
  medias: BrandedMedia[];
  mainColor: string | null;
}

export interface BrandPage {
  brandMetadata: BrandMetadata;
  pageSections: PageSectionList;
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export type ExpirationTag = 'ENDS_TODAY' | 'ENDS_TOMORROW' | 'ENDS_ON' | 'STARTS_ON' | 'ENDED';
export type CampaignTypeLabel = 'DISCOUNT' | 'GIFT' | 'COMBO' | 'OFFER';
export type TierType = 'STANDARD' | 'MAMI_PLUS' | 'MAMI_PLUS_EXCLUSIVE';

export interface CampaignDetails {
  id: string;
  brandId: string;
  brandSlug: string;
  title: TextValue;
  displayStrings: DisplayString[];
  mainMedia: Media | null;
  medias: BrandedMedia[];
  startDate: string;
  expirationDate: string;
  conversionAction: ConversionAction | null;
  expirationTag: ExpirationTag;
  campaignTypeLabel: CampaignTypeLabel;
  tierType: TierType;
  discountPercentage: number | null;
}

export interface CampaignPage {
  campaignDetails: CampaignDetails;
  brandMetadata: BrandMetadata;
  pageSections: PageSectionList;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface ProductPrice {
  originPrice: number;
  discountedPrice: number;
  currency: string;
  discountAmount: number;
  discountPercent: number;
}

export interface ProductDetails {
  id: string;
  campaignId: string;
  brandId: string;
  brandSlug: string;
  title: TextValue;
  displayStrings: DisplayString[];
  conversionAction: ConversionAction | null;
  mainMedia: Media | null;
  medias: BrandedMedia[];
  tagKeys: string[];
  expirationDate: string;
  expirationTag: ExpirationTag;
  campaignTypeLabel: CampaignTypeLabel;
  tierType: TierType;
  startDate: string;
  price: ProductPrice | null;
}

export interface ProductPage {
  productDetails: ProductDetails;
  campaignDetails: CampaignDetails;
  brandMetadata: BrandMetadata;
  pageSections: PageSectionList;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface CategoryMetadata {
  id: string;
  slug: string;
  title: TextValue;
  thumbnail: Media | null;
  medias: BrandedMedia[];
  mainColor: string | null;
  ancestorSlugs: string[];
}

export interface CategoryPage {
  categoryMetadata: CategoryMetadata;
  pageSections: PageSectionList;
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

export interface BannerData {
  id: string;
  media: Media;
  targetUrl: string;
}

export interface AssistanceAvatar {
  text: string;
  image: Media;
}

export interface Highlight {
  id: string;
  title: string;
  media: Media;
  targetUrl: string;
}

export interface Hero {
  banners: BannerData[];
  assistanceAvatar: AssistanceAvatar | null;
  highlights: Highlight[];
}

export interface HomePage {
  hero: Hero;
  pageSections: PageSectionList;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  title: string;
  url: string;
  iconId: string | null;
  items: NavItem[];
}

export interface Navigation {
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResultGroup<T = unknown> {
  items: T[];
  totalCount: number;
}

export interface SearchResults {
  query: string;
  brands: SearchResultGroup;
  campaigns: SearchResultGroup;
  products: SearchResultGroup;
  categories: SearchResultGroup;
}

export interface SearchSuggestion {
  type: 'BRAND' | 'CAMPAIGN' | 'PRODUCT' | 'CATEGORY';
  id: string;
  title: string;
  slug: string;
  image: Media | null;
  path: string;
}

export interface SearchSuggestions {
  query: string;
  suggestions: SearchSuggestion[];
}

// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------

export interface ApiError {
  code: string;
  message: string;
}
