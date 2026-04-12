import { describe, it, expect } from 'vitest';
import {
  formatSearchResults,
  formatCampaignDetail,
  formatProductDetail,
  formatBrandPage,
  formatCategoryPage,
  formatHomePage,
  getMainImageUrl,
} from '../src/ui/formatters.js';
import type { SearchResults, CampaignPage, ProductPage, BrandPage, CategoryPage, HomePage } from '../src/types/index.js';

describe('Text Formatters', () => {
  describe('formatSearchResults', () => {
    it('should format empty state', () => {
      const results: SearchResults = {
        query: 'nonexistent',
        brands: { items: [], totalCount: 0 },
        campaigns: { items: [], totalCount: 0 },
        products: { items: [], totalCount: 0 },
        categories: { items: [], totalCount: 0 },
      };
      const text = formatSearchResults(results);
      expect(text).toContain('🔍');
      expect(text).toContain('לא נמצאו');
    });

    it('should format results with Hebrew text', () => {
      const results: SearchResults = {
        query: 'nike',
        brands: { items: [{ id: '1', title: { text: 'Nike' }, slug: 'nike', displayStrings: [], logo: null, mainMedia: null, medias: [], mainColor: null }], totalCount: 1 },
        campaigns: { items: [], totalCount: 0 },
        products: { items: [], totalCount: 0 },
        categories: { items: [], totalCount: 0 },
      };
      const text = formatSearchResults(results as SearchResults);
      expect(text).toContain('Nike');
      expect(text).toContain('נמצאו');
      expect(text).toContain('hi-mami.com/brands/nike');
    });
  });

  describe('formatCampaignDetail', () => {
    it('should format campaign with discount', () => {
      const page: CampaignPage = {
        campaignDetails: {
          id: 'c1',
          brandId: 'b1',
          brandSlug: 'test-brand',
          title: { text: 'מבצע טסט' },
          displayStrings: [],
          mainMedia: null,
          medias: [],
          startDate: '2024-01-01',
          expirationDate: '2025-12-31',
          conversionAction: null,
          expirationTag: 'ENDS_ON',
          campaignTypeLabel: 'DISCOUNT',
          tierType: 'STANDARD',
          discountPercentage: 25,
        },
        brandMetadata: {
          id: 'b1',
          title: { text: 'מותג טסט' },
          slug: 'test-brand',
          displayStrings: [],
          logo: null,
          mainMedia: null,
          medias: [],
          mainColor: null,
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      const text = formatCampaignDetail(page);
      expect(text).toContain('מבצע טסט');
      expect(text).toContain('25%');
      expect(text).toContain('מותג טסט');
    });

    it('should format conversion action with code', () => {
      const page: CampaignPage = {
        campaignDetails: {
          id: 'c2',
          brandId: 'b1',
          brandSlug: 'test',
          title: { text: 'Deal' },
          displayStrings: [],
          mainMedia: null,
          medias: [],
          startDate: '2024-01-01',
          expirationDate: '2025-12-31',
          conversionAction: {
            type: 'GENERIC_CODE',
            data: { codes: [{ code: 'SAVE20' }] },
            displayStrings: [{ type: 'CTA', value: { text: 'Use Code' } }],
            isPurchasable: false,
            catalogItem: null,
          },
          expirationTag: 'ENDS_TODAY',
          campaignTypeLabel: 'DISCOUNT',
          tierType: 'STANDARD',
          discountPercentage: 20,
        },
        brandMetadata: {
          id: 'b1', title: { text: 'Brand' }, slug: 'test',
          displayStrings: [], logo: null, mainMedia: null, medias: [], mainColor: null,
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      const text = formatCampaignDetail(page);
      expect(text).toContain('SAVE20');
      expect(text).toContain('קוד הנחה');
    });
  });

  describe('formatProductDetail', () => {
    it('should format product with pricing', () => {
      const page: ProductPage = {
        productDetails: {
          id: 'p1',
          campaignId: 'c1',
          brandId: 'b1',
          brandSlug: 'test',
          title: { text: 'מוצר טסט' },
          displayStrings: [],
          conversionAction: null,
          mainMedia: null,
          medias: [],
          tagKeys: [],
          expirationDate: '2025-12-31',
          expirationTag: 'ENDS_ON',
          campaignTypeLabel: 'DISCOUNT',
          tierType: 'STANDARD',
          startDate: '2024-01-01',
          price: {
            originPrice: 200,
            discountedPrice: 150,
            currency: 'ILS',
            discountAmount: 50,
            discountPercent: 25,
          },
        },
        campaignDetails: {
          id: 'c1', brandId: 'b1', brandSlug: 'test', title: { text: 'Campaign' },
          displayStrings: [], mainMedia: null, medias: [], startDate: '2024-01-01',
          expirationDate: '2025-12-31', conversionAction: null, expirationTag: 'ENDS_ON',
          campaignTypeLabel: 'DISCOUNT', tierType: 'STANDARD', discountPercentage: null,
        },
        brandMetadata: {
          id: 'b1', title: { text: 'Brand' }, slug: 'test',
          displayStrings: [], logo: null, mainMedia: null, medias: [], mainColor: null,
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      const text = formatProductDetail(page);
      expect(text).toContain('מוצר טסט');
      expect(text).toContain('150');
      expect(text).toContain('200');
      expect(text).toContain('25%');
      expect(text).toContain('חיסכון');
    });
  });

  describe('formatBrandPage', () => {
    it('should format brand page', () => {
      const page: BrandPage = {
        brandMetadata: {
          id: 'b1',
          title: { text: 'Nike' },
          slug: 'nike',
          displayStrings: [{ type: 'DESCRIPTION', value: { text: 'Just Do It' } }],
          logo: null,
          mainMedia: null,
          medias: [],
          mainColor: null,
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      const text = formatBrandPage(page);
      expect(text).toContain('Nike');
      expect(text).toContain('Just Do It');
      expect(text).toContain('hi-mami.com/brands/nike');
    });
  });

  describe('formatCategoryPage', () => {
    it('should format category page', () => {
      const page: CategoryPage = {
        categoryMetadata: {
          id: 'cat1',
          slug: 'fashion',
          title: { text: 'אופנה' },
          thumbnail: null,
          medias: [],
          mainColor: null,
          ancestorSlugs: [],
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      const text = formatCategoryPage(page);
      expect(text).toContain('אופנה');
    });
  });

  describe('formatHomePage', () => {
    it('should format home page', () => {
      const page: HomePage = {
        hero: {
          banners: [],
          assistanceAvatar: null,
          highlights: [],
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      const text = formatHomePage(page);
      expect(text).toContain('Hi Mami');
      expect(text).toContain('hi-mami.com');
    });
  });

  describe('getMainImageUrl', () => {
    it('should extract campaign image', () => {
      const page: CampaignPage = {
        campaignDetails: {
          id: 'c1', brandId: 'b1', brandSlug: 'test', title: { text: 'Test' },
          displayStrings: [], mainMedia: { mimeType: 'image/webp', url: 'https://example.com/img.webp', blur: null, metadata: null, thumbnail: null },
          medias: [], startDate: '2024-01-01', expirationDate: '2025-12-31',
          conversionAction: null, expirationTag: 'ENDS_ON', campaignTypeLabel: 'DISCOUNT',
          tierType: 'STANDARD', discountPercentage: null,
        },
        brandMetadata: {
          id: 'b1', title: { text: 'Brand' }, slug: 'test',
          displayStrings: [], logo: null, mainMedia: null, medias: [], mainColor: null,
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      expect(getMainImageUrl(page)).toBe('https://example.com/img.webp');
    });

    it('should return null when no image', () => {
      const page: BrandPage = {
        brandMetadata: {
          id: 'b1', title: { text: 'Brand' }, slug: 'test',
          displayStrings: [], logo: null, mainMedia: null, medias: [], mainColor: null,
        },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      expect(getMainImageUrl(page)).toBeNull();
    });
  });
});
