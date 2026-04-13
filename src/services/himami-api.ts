import logger from '../utils/logger.js';
import type {
  SearchResults,
  SearchSuggestions,
  BrandPage,
  PageSectionList,
  CollectionItemList,
  CampaignPage,
  ProductPage,
  CategoryPage,
  HomePage,
  Navigation,
  ApiError,
} from '../types/index.js';

const REQUEST_TIMEOUT_MS = 10_000;

export class HiMamiApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly userAgent: string,
  ) {}

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async search(query: string, type?: string, limit?: number): Promise<SearchResults> {
    const params = new URLSearchParams({ q: query });
    if (type) params.set('type', type);
    if (limit) params.set('limit', String(limit));
    return this.get<SearchResults>(`/v1/search?${params}`);
  }

  async suggestions(query: string, limit?: number): Promise<SearchSuggestions> {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', String(limit));
    return this.get<SearchSuggestions>(`/v1/search/suggestions?${params}`);
  }

  // ---------------------------------------------------------------------------
  // Brands
  // ---------------------------------------------------------------------------

  async getBrand(brandSlug: string): Promise<BrandPage> {
    return this.get<BrandPage>(`/v1/brands/${encodeURIComponent(brandSlug)}`);
  }

  async getBrandSections(brandSlug: string, page = 1, pageSize = 20): Promise<PageSectionList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<PageSectionList>(`/v1/brands/${encodeURIComponent(brandSlug)}/page-sections?${params}`);
  }

  async getBrandSectionItems(brandSlug: string, sectionId: string, page = 1, pageSize = 20): Promise<CollectionItemList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<CollectionItemList>(
      `/v1/brands/${encodeURIComponent(brandSlug)}/page-sections/${encodeURIComponent(sectionId)}/items?${params}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Campaigns
  // ---------------------------------------------------------------------------

  async getCampaign(campaignId: string): Promise<CampaignPage> {
    return this.get<CampaignPage>(`/v1/campaigns/${encodeURIComponent(campaignId)}`);
  }

  async getCampaignSections(campaignId: string, page = 1, pageSize = 20): Promise<PageSectionList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<PageSectionList>(`/v1/campaigns/${encodeURIComponent(campaignId)}/page-sections?${params}`);
  }

  async getCampaignSectionItems(campaignId: string, sectionId: string, page = 1, pageSize = 20): Promise<CollectionItemList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<CollectionItemList>(
      `/v1/campaigns/${encodeURIComponent(campaignId)}/page-sections/${encodeURIComponent(sectionId)}/items?${params}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------

  async getProduct(productId: string): Promise<ProductPage> {
    return this.get<ProductPage>(`/v1/products/${encodeURIComponent(productId)}`);
  }

  async getProductSections(productId: string, page = 1, pageSize = 20): Promise<PageSectionList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<PageSectionList>(`/v1/products/${encodeURIComponent(productId)}/page-sections?${params}`);
  }

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------

  async getCategories(path = ''): Promise<CategoryPage> {
    const cleanPath = path.replace(/^\/+/, '');
    const endpoint = cleanPath ? `/v1/categories/${cleanPath}` : '/v1/brands';
    return this.get<CategoryPage>(endpoint);
  }

  async getCategorySectionItems(sectionId: string, page = 1, pageSize = 20): Promise<CollectionItemList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<CollectionItemList>(`/v1/category-sections/${encodeURIComponent(sectionId)}/items?${params}`);
  }

  // ---------------------------------------------------------------------------
  // Home Page
  // ---------------------------------------------------------------------------

  async getHomePage(): Promise<HomePage> {
    return this.get<HomePage>('/v1/home-page');
  }

  async getHomePageSections(page = 1, pageSize = 20): Promise<PageSectionList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<PageSectionList>(`/v1/home-page/page-sections?${params}`);
  }

  async getHomePageSectionItems(sectionId: string, page = 1, pageSize = 20): Promise<CollectionItemList> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return this.get<CollectionItemList>(`/v1/home-page/page-sections/${encodeURIComponent(sectionId)}/items?${params}`);
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async getNavigation(type: 'menu' | 'bar' | 'footer'): Promise<Navigation> {
    return this.get<Navigation>(`/v1/navigation/${type}`);
  }

  // ---------------------------------------------------------------------------
  // Image fetching (for MCP type: "image" base64 responses)
  // ---------------------------------------------------------------------------

  async fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);

      try {
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: { 'User-Agent': this.userAgent },
          signal: controller.signal,
        });

        if (!response.ok) {
          logger.warn({ imageUrl, status: response.status }, 'Image fetch failed');
          return null;
        }

        const contentType = response.headers.get('content-type') ?? 'image/jpeg';
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return { data: base64, mimeType: contentType };
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      logger.debug({ imageUrl, err }, 'Image fetch error (non-critical)');
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP helper
  // ---------------------------------------------------------------------------

  private async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const startTime = Date.now();

    logger.info({ event: 'api.request', path }, `-> API GET ${path}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      const text = await response.text();
      const durationMs = Date.now() - startTime;
      const responseSize = text.length;

      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        if (!response.ok) {
          logger.warn({ event: 'api.error', path, status: response.status, durationMs, responseSize }, `<- API ${response.status} (non-JSON) ${durationMs}ms`);
          throw new HiMamiApiError(`HTTP ${response.status}`, response.status);
        }
        throw new HiMamiApiError('Invalid JSON response', 500);
      }

      // Check if the parsed body is an error object
      const maybeError = data as Record<string, unknown>;
      if (!response.ok && maybeError.code && maybeError.message && Object.keys(maybeError).length <= 3) {
        const apiErr = maybeError as unknown as ApiError;
        logger.warn({ event: 'api.error', path, status: response.status, durationMs, responseSize, apiErrorCode: apiErr.code }, `<- API ${response.status} ${apiErr.code ?? ''} ${durationMs}ms`);
        throw new HiMamiApiError(apiErr.message, response.status, apiErr.code);
      }

      logger.info({ event: 'api.success', path, status: response.status, durationMs, responseSize }, `<- API ${response.status} ${durationMs}ms [${responseSize}b]`);
      return data as T;
    } catch (err) {
      if (err instanceof HiMamiApiError) throw err;

      const durationMs = Date.now() - startTime;

      if (err instanceof DOMException && err.name === 'AbortError') {
        logger.error({ event: 'api.timeout', path, durationMs }, `<- API timeout after ${durationMs}ms`);
        throw new HiMamiApiError('Request timed out', 408);
      }

      logger.error({ event: 'api.exception', path, durationMs, error: err instanceof Error ? err.message : String(err) }, `<- API exception ${durationMs}ms`);
      throw new HiMamiApiError(
        err instanceof Error ? err.message : 'Unknown error',
        500,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class HiMamiApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HiMamiApiError';
  }
}
