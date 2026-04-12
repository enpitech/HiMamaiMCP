import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HiMamiApiClient, HiMamiApiError } from '../src/services/himami-api.js';

// Suppress logger output in tests
vi.mock('../src/utils/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('HiMamiApiClient', () => {
  let api: HiMamiApiClient;

  beforeEach(() => {
    api = new HiMamiApiClient('https://hi-mami.com/api', 'TestAgent/1.0');
    vi.restoreAllMocks();
  });

  describe('search', () => {
    it('should call the correct endpoint', async () => {
      const mockResponse = { query: 'nike', brands: { items: [], totalCount: 0 }, campaigns: { items: [], totalCount: 0 }, products: { items: [], totalCount: 0 }, categories: { items: [], totalCount: 0 } };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 }),
      );

      const result = await api.search('nike');
      expect(result.query).toBe('nike');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/search?q=nike'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('should pass type filter', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ query: 'nike', brands: { items: [], totalCount: 0 }, campaigns: { items: [], totalCount: 0 }, products: { items: [], totalCount: 0 }, categories: { items: [], totalCount: 0 } }), { status: 200 }),
      );

      await api.search('nike', 'BRAND', 5);
      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain('type=BRAND');
      expect(calledUrl).toContain('limit=5');
    });
  });

  describe('getBrand', () => {
    it('should fetch brand by slug', async () => {
      const mockBrand = {
        brandMetadata: { id: '1', title: { text: 'Nike' }, slug: 'nike', displayStrings: [], logo: null, mainMedia: null, medias: [], mainColor: null },
        pageSections: { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } },
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockBrand), { status: 200 }),
      );

      const result = await api.getBrand('nike');
      expect(result.brandMetadata.slug).toBe('nike');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/brands/nike'),
        expect.any(Object),
      );
    });

    it('should encode brand slug', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ brandMetadata: { slug: 'test brand' }, pageSections: { items: [], pagination: {} } }), { status: 200 }),
      );

      await api.getBrand('test brand');
      const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/v1/brands/test%20brand');
    });
  });

  describe('getCampaign', () => {
    it('should fetch campaign by ID', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ campaignDetails: { id: '123' }, brandMetadata: {}, pageSections: { items: [], pagination: {} } }), { status: 200 }),
      );

      const result = await api.getCampaign('123');
      expect(result.campaignDetails.id).toBe('123');
    });
  });

  describe('getProduct', () => {
    it('should fetch product by ID', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ productDetails: { id: 'p1' }, campaignDetails: {}, brandMetadata: {}, pageSections: { items: [], pagination: {} } }), { status: 200 }),
      );

      const result = await api.getProduct('p1');
      expect(result.productDetails.id).toBe('p1');
    });
  });

  describe('error handling', () => {
    it('should throw HiMamiApiError on 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'NOT_FOUND', message: 'Brand not found' }), { status: 404 }),
      );

      await expect(api.getBrand('nonexistent')).rejects.toThrow(HiMamiApiError);
      await expect(api.getBrand('nonexistent').catch(e => e)).resolves.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw HiMamiApiError on 500', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500 }),
      );

      await expect(api.getBrand('test')).rejects.toThrow(HiMamiApiError);
    });

    it('should throw on network errors', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failed'));

      await expect(api.search('test')).rejects.toThrow(HiMamiApiError);
    });
  });

  describe('request headers', () => {
    it('should include User-Agent header', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 }),
      );

      await api.getHomePage();
      const calledOpts = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
      expect(calledOpts.headers).toMatchObject({
        'User-Agent': 'TestAgent/1.0',
        'Accept': 'application/json',
      });
    });
  });
});
