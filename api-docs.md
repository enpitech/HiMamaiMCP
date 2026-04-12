# API Documentation

## Base URL & Common Rules

**Base URL:** `https://<host>/api`

### Required Headers (all endpoints except `/api/health` and `/api/ready`)

| Header | Required | Description |
|---|---|---|
| `User-Agent` | Yes | App identifier — must be present and valid, otherwise `400` |
| `Authorization` | Conditional | `Bearer <jwt>` — required on protected endpoints |

### Response Format

**Success:** HTTP `200`/`201` — the payload object directly (no wrapper).

**Error:**
```json
{ "code": "ERROR_CODE", "message": "human-readable description" }
```

### Pagination (where supported)

| Query param | Default | Max | Description |
|---|---|---|---|
| `page` | `1` | — | Page number (1-based) |
| `pageSize` | `20` | `100` | Items per page |

**Pagination metadata in responses:**
```json
{
  "page": 1,
  "pageSize": 20,
  "totalItems": 150,
  "totalPages": 8
}
```

---

## Shared Types

### `Media`
```json
{
  "mimeType": "image/jpeg",
  "url": "https://...",
  "blur": { "type": "BLUR_HASH", "hash": "L6Pj0^n~..." },
  "metadata": {
    "alt": "alt text",
    "dimensions": { "width": 800, "height": 600 },
    "duration": null
  },
  "thumbnail": null
}
```

### `DisplayString`
```json
{ "type": "SUBTITLE", "value": { "text": "..." } }
```

`type` values: `SUBTITLE`, `DESCRIPTION`, `DISCLAIMER`, `SMALL_PRINT`, `CARD_SMALL_PRINT`, `CTA`, `SECOND_CTA`, `CTA_HEADER`, `CTA_SUBTITLE`, `CTA_DISCLAIMER`, `CTA_CONTACT`, `CTA_REDEMPTION_DETAILS`, `CTA_PLUS_ALTERNATIVE`

### `ConversionAction`
```json
{
  "type": "GENERIC_CODE",
  "data": { ... },
  "displayStrings": [ ... ],
  "isPurchasable": false,
  "catalogItem": { "id": "...", "name": "...", "price": 9.99, "currency": "ILS" }
}
```

`type` values: `GENERIC_CODE`, `PERSONAL_CODE`, `LEADING_LINK`, `PERSONAL_LINK`, `PURCHASE_LINK`, `CALL_TO_NUMBER`, `VOUCHER`, `SET_REMINDER`, `OUT_OF_STOCK`

**`data` shape per type:**

| type | data |
|---|---|
| `GENERIC_CODE` / `PERSONAL_CODE` | `{ "codes": [{"code":"ABC","name":"optional"}], "url": "https://..." }` |
| `LEADING_LINK` / `PURCHASE_LINK` | `{ "url": "https://..." }` |
| `CALL_TO_NUMBER` | `{ "phoneNumber": "+972..." }` |
| `VOUCHER` | `{ "code": "XYZ" }` |
| `SET_REMINDER` / `OUT_OF_STOCK` | `null` |

### `PageSectionList`
```json
{
  "items": [
    {
      "id": "...",
      "type": "CAMPAIGNS",
      "title": { "text": "..." },
      "subtitle": null,
      "items": { ... },
      "thumbnail": null,
      "sectionConfig": {
        "viewType": "SLIDER",
        "data": { "mobileVisibleCards": 2.1, "desktopWidthCards": 240 }
      },
      "seeAll": { "path": "/brands/...", "text": "See all" }
    }
  ],
  "pagination": { ... }
}
```

Section `type` values: `BANNERS`, `MEDIA_PORTRAIT`, `BRANDS`, `CAMPAIGNS`, `PRODUCTS`, `MIX`

`viewType` values: `SLIDER`, `CAROUSEL`, `GRID`, `SINGLE`

### `CollectionItemList`
```json
{
  "items": [ { "type": "CAMPAIGN_DETAILS", "data": { ... } } ],
  "pagination": { ... }
}
```

Item `type` values: `CAMPAIGN_DETAILS`, `PRODUCT_DETAILS`, `BRAND_METADATA`, `BANNER`, `MEDIA`

---

## Health

### `GET /api/health`
Liveness probe. No auth, no `User-Agent` required.

**Response `200`:**
```json
{ "status": "healthy" }
```

---

### `GET /api/ready`
Readiness probe — pings MongoDB and Redis.

**Response `200`:**
```json
{
  "status": "healthy",
  "checks": { "mongodb": "healthy", "redis": "healthy" }
}
```

**Response `503`:**
```json
{
  "status": "unhealthy",
  "checks": { "mongodb": "unhealthy", "redis": "healthy" }
}
```

---

## SEO

### `GET /api/seo`
Returns SEO metadata for a given page path. Used for server-side rendering.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `path` | Yes | URL path of the page, e.g. `/brands/nike` |

**Response `200`:**
```json
{
  "title": "Nike | Mami",
  "description": "...",
  "canonicalUrl": "https://...",
  "image": "https://...",
  "robots": "index,follow",
  "openGraph": {
    "type": "website",
    "siteName": "Mami",
    "locale": "he_IL",
    "title": "...",
    "description": "...",
    "url": "https://...",
    "image": "https://..."
  },
  "twitterCard": {
    "card": "summary_large_image",
    "title": "...",
    "description": "...",
    "image": "https://..."
  },
  "breadcrumbs": [
    { "name": "Home", "url": "/", "position": 1 },
    { "name": "Nike", "url": null, "position": 2 }
  ],
  "structuredData": { "@type": "Product", "name": "...", "brand": { "@type": "Brand", "name": "Nike" } },
  "layout": { ... },
  "pageType": "brand"
}
```

The `layout` field contains a full server-rendered layout structure (header, main, footer) for SSR/LLM-driven rendering.

**Errors:** `400` (missing `path`), `404` (path not found)

---

### `GET /api/seo/sitemap.xml`
Returns the XML sitemap.

**Response `200`:** `Content-Type: application/xml`

---

### `GET /api/seo/robots.txt`
Returns the `robots.txt` content.

**Response `200`:** `Content-Type: text/plain`

---

## Config

### `GET /api/v1/config`
Returns remote feature flags and app configuration. Personalized when a valid JWT is provided.

**Auth:** Optional

**Response `200`:**
```json
{
  "featureFlags": { "someFlag": true },
  "settings": { "someKey": "someValue" }
}
```

---

## Navigation

### `GET /api/v1/navigation/:type`
Returns navigation items for the given type.

**Path params:**

| Param | Values |
|---|---|
| `type` | `menu`, `bar`, `footer` |

**Response `200`:**
```json
{
  "items": [
    {
      "title": "Brands",
      "url": "/brands",
      "iconId": "icon-brands",
      "items": [
        { "title": "Fashion", "url": "/brands/c/fashion", "iconId": null }
      ]
    }
  ]
}
```

**Errors:** `400` (invalid type), `404` (not configured)

---

## User

All user routes are under `/api/v1/user`.

---

### `GET /api/v1/user/verify-email`
Verifies a user's email address using a one-time token sent by email.

**Rate limit:** 5 req/s, burst 10

**Query params:**

| Param | Required | Description |
|---|---|---|
| `token` | Yes | Email verification token |

**Response `200`:**
```json
{ "message": "email verified successfully" }
```

**Errors:** `400` (missing/invalid/expired token, email mismatch)

---

### `POST /api/v1/user/register`
Completes registration for a user who has authenticated with an onboarding JWT (phone-verified but profile not yet created).

**Auth:** Required — onboarding JWT (role `ONBOARDING_USER`)

**Rate limit:** 1 req/s, burst 1

**Request body:**
```json
{
  "phoneNumber": "+972541234567",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "city": "Tel Aviv",
  "dateOfBirth": "1990-05-15",
  "gender": "FEMALE",
  "agreeToCommercialMailing": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `phoneNumber` | string | Yes | E.164 format, mobile numbers only |
| `firstName` | string | Yes | |
| `lastName` | string | Yes | |
| `email` | string | Yes | Valid email format |
| `city` | string | No | |
| `dateOfBirth` | string | No | `YYYY-MM-DD` |
| `gender` | string | No | `MALE`, `FEMALE`, `UNSPECIFIED` |
| `agreeToCommercialMailing` | bool | No | Default `false` |

**Response `201`:**
```json
{
  "userId": "abc123",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+972541234567",
  "email": "jane@example.com",
  "address": { "city": "Tel Aviv" },
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "gender": "FEMALE",
  "nationalId": null,
  "roles": []
}
```

**Errors:** `400` (invalid phone, invalid date of birth, user not in onboarding), `404` (user not found)

---

### `GET /api/v1/user/profile`
Returns the authenticated user's profile.

**Auth:** Required

**Response `200`:**
```json
{
  "userId": "abc123",
  "firstName": "Jane",
  "lastName": "Doe",
  "phoneNumber": "+972541234567",
  "email": "jane@example.com",
  "address": { "city": "Tel Aviv" },
  "dateOfBirth": "1990-05-15T00:00:00Z",
  "gender": "FEMALE",
  "nationalId": "123456789",
  "roles": ["MAMI_PLUS"]
}
```

`roles` can include: `MAMI_PLUS`, `MAMI_TEAM`

**Errors:** `401`, `404`

---

### `PATCH /api/v1/user/profile`
Partially updates the authenticated user's profile. Only send fields you want to change.

**Auth:** Required

**Request body** (all fields optional):
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "city": "Haifa",
  "dateOfBirth": "1990-05-15",
  "gender": "FEMALE",
  "nationalId": "123456789",
  "agreeToCommercialMailing": false
}
```

**Response `200`:** empty body (`null`)

**Errors:** `400` (invalid email, invalid date of birth), `404`

---

### `GET /api/v1/user/account`
Returns the full account object including membership tier, subscriptions, and saved payment method.

**Auth:** Required

**Response `200`:**
```json
{
  "id": "account-id",
  "ownerUserId": "user-id",
  "membership": {
    "tier": "MT_MAMI_PLUS",
    "changedAt": "2024-01-01T00:00:00Z"
  },
  "agreeToCommercialMailing": true,
  "subscriptions": [
    {
      "id": "sub-id",
      "catalogItemId": "plan-id",
      "planName": "Mami Plus Monthly",
      "status": "ACTIVE",
      "pricePaid": 29.90,
      "currency": "ILS",
      "currentPeriodStart": "2024-03-01T00:00:00Z",
      "currentPeriodEnd": "2024-04-01T00:00:00Z",
      "cancelledAt": null,
      "cancellationReason": null
    }
  ],
  "subscriptionPaymentMethod": {
    "last4Digits": "1234",
    "expireMonth": 12,
    "expireYear": 2027
  }
}
```

`membership.tier` values: `MT_FREEMIUM`, `MT_MAMI_PLUS`

`subscription.status` values: `ACTIVE`, `CANCELLED`, `EXPIRED`

**Errors:** `401`, `404`

---

### `GET /api/v1/user/my-benefits`
Returns the user's conversion history (redeemed deals) and active reminders.

**Auth:** Required

**Response `200`:**
```json
{
  "conversionHistory": [
    { "type": "CAMPAIGN", "data": { ... } },
    { "type": "PRODUCT", "data": { ... } }
  ],
  "reminders": [
    { "type": "CAMPAIGN", "data": { ... } }
  ]
}
```

`type` values: `CAMPAIGN`, `PRODUCT`. `data` is either a `CampaignDetails` or `ProductDetails` object.

---

## Vendors

### `GET /api/v1/vendors`
Returns all vendors that currently have an active earning rule.

**Response `200`:**
```json
[
  {
    "vendorId": "v1",
    "name": "Acme Store",
    "earningPercentage": 5.0
  }
]
```

---

## Brands

### `GET /api/v1/brands`
Returns the brands root category page (top-level listing).

**Response `200`:** `CategoryPage` — see [Categories](#categories).

---

### `GET /api/v1/brands/c/*brandsPath`
Returns a nested brands category page.

**Example:** `/api/v1/brands/c/fashion/women`

**Response `200`:** `CategoryPage`

---

### `GET /api/v1/brands/:brandSlug`
Returns the full brand page — metadata + initial page sections.

**Response `200`:**
```json
{
  "brandMetadata": {
    "id": "brand-id",
    "title": { "text": "Nike" },
    "slug": "nike",
    "displayStrings": [ { "type": "DESCRIPTION", "value": { "text": "..." } } ],
    "logo": { ... },
    "mainMedia": { ... },
    "medias": [ { "type": "BRAND_LOGO", "value": { ... } } ],
    "mainColor": "#111111"
  },
  "pageSections": { ... }
}
```

**Errors:** `404`

---

### `GET /api/v1/brands/:brandSlug/page-sections`
Paginated page sections for a brand.

**Query params:** `page`, `pageSize`

**Response `200`:** `PageSectionList`

---

### `GET /api/v1/brands/:brandSlug/page-sections/:sectionId/items`
Paginated items within a specific brand section.

**Query params:** `page`, `pageSize`

**Response `200`:** `CollectionItemList`

---

## Campaigns

### `GET /api/v1/campaigns/:campaignId`
Returns the full campaign page.

**Response `200`:**
```json
{
  "campaignDetails": {
    "id": "campaign-id",
    "brandId": "brand-id",
    "brandSlug": "nike",
    "title": { "text": "50% off running shoes" },
    "displayStrings": [ ... ],
    "mainMedia": { ... },
    "medias": [ { "type": "BRAND_LOGO", "value": { ... } } ],
    "startDate": "2024-01-01T00:00:00Z",
    "expirationDate": "2024-12-31T23:59:59Z",
    "conversionAction": { ... },
    "expirationTag": "ENDS_ON",
    "campaignTypeLabel": "DISCOUNT",
    "tierType": "MAMI_PLUS",
    "discountPercentage": 50.0
  },
  "brandMetadata": { ... },
  "pageSections": { ... }
}
```

`expirationTag` values: `ENDS_TODAY`, `ENDS_TOMORROW`, `ENDS_ON`, `STARTS_ON`, `ENDED`

`campaignTypeLabel` values: `DISCOUNT`, `GIFT`, `COMBO`, `OFFER`

`tierType` values: `STANDARD`, `MAMI_PLUS`, `MAMI_PLUS_EXCLUSIVE`

**Errors:** `404`

---

### `GET /api/v1/campaigns/:campaignId/page-sections`
Paginated sections for a campaign.

**Query params:** `page`, `pageSize` | **Response `200`:** `PageSectionList`

---

### `GET /api/v1/campaigns/:campaignId/page-sections/:sectionId/items`
Paginated items for a campaign section.

**Query params:** `page`, `pageSize` | **Response `200`:** `CollectionItemList`

---

### `POST /api/v1/campaigns/:campaignId/resource/assign`
Assigns a campaign resource to the authenticated user (claims a personal code or voucher).

**Auth:** Required | **Rate limit:** 1 req/s, burst 1

**Request body:** empty

**Response `200`:** `ConversionAction`
```json
{
  "type": "PERSONAL_CODE",
  "data": { "codes": [{ "code": "MYCODE123" }], "url": "https://..." },
  "displayStrings": [ ... ],
  "isPurchasable": false
}
```

**Errors:**

| Status | Code | Meaning |
|---|---|---|
| `401` | — | Not authenticated |
| `409` | `NO_RESOURCES_AVAILABLE` | No codes/vouchers left |
| `404` | — | Campaign not found |

---

### `POST /api/v1/campaigns/:campaignId/resource/ack`
Acknowledges that the user has seen/used the assigned resource. Call after a successful `assign`.

**Auth:** Required | **Rate limit:** 1 req/s | **Request body:** empty | **Response `200`:** `null`

---

### `POST /api/v1/campaigns/:campaignId/set-reminder`
Sets a reminder for a campaign that has not started yet (`STARTS_ON` state).

**Auth:** Required | **Rate limit:** 1 req/s | **Request body:** empty | **Response `200`:** `null`

---

## Products

Products follow the exact same pattern as campaigns.

### `GET /api/v1/products/:productId`
Returns the full product page.

**Response `200`:**
```json
{
  "productDetails": {
    "id": "product-id",
    "campaignId": "campaign-id",
    "brandId": "brand-id",
    "brandSlug": "nike",
    "title": { "text": "Air Max 90" },
    "displayStrings": [ ... ],
    "conversionAction": { ... },
    "mainMedia": { ... },
    "medias": [],
    "tagKeys": ["running", "lifestyle"],
    "expirationDate": "2024-12-31T23:59:59Z",
    "expirationTag": "ENDS_ON",
    "campaignTypeLabel": "DISCOUNT",
    "tierType": "STANDARD",
    "startDate": "2024-01-01T00:00:00Z",
    "price": {
      "originPrice": 599.90,
      "discountedPrice": 299.95,
      "currency": "ILS",
      "discountAmount": 299.95,
      "discountPercent": 50.0
    }
  },
  "campaignDetails": { ... },
  "brandMetadata": { ... },
  "pageSections": { ... }
}
```

**Errors:** `404`

---

### `GET /api/v1/products/:productId/page-sections`
**Query params:** `page`, `pageSize` | **Response `200`:** `PageSectionList`

---

### `GET /api/v1/products/:productId/page-sections/:sectionId/items`
**Query params:** `page`, `pageSize` | **Response `200`:** `CollectionItemList`

---

### `POST /api/v1/products/:productId/resource/assign`
**Auth:** Required | **Rate limit:** 1 req/s | **Response `200`:** `ConversionAction`

---

### `POST /api/v1/products/:productId/resource/ack`
**Auth:** Required | **Rate limit:** 1 req/s | **Response `200`:** `null`

---

### `POST /api/v1/products/:productId/set-reminder`
**Auth:** Required | **Rate limit:** 1 req/s | **Response `200`:** `null`

---

## Categories

### `GET /api/v1/categories/*categoryPath`
Returns a category page. Supports nested paths.

**Example:** `/api/v1/categories/fashion/women/shoes`

**Response `200`:**
```json
{
  "categoryMetadata": {
    "id": "cat-id",
    "slug": "fashion",
    "title": { "text": "Fashion" },
    "thumbnail": { ... },
    "medias": [],
    "mainColor": "#ff0000",
    "ancestorSlugs": []
  },
  "pageSections": { ... }
}
```

**Errors:** `404`

---

### `GET /api/v1/category-sections/:sectionId/items`
Returns paginated items for a category section.

**Query params:** `page`, `pageSize` | **Response `200`:** `CollectionItemList`

---

## Home Page

### `GET /api/v1/home-page`
Returns the home page including hero (banners + highlights) and first set of page sections.

**Response `200`:**
```json
{
  "hero": {
    "banners": [
      { "id": "b1", "media": { ... }, "targetUrl": "https://..." }
    ],
    "assistanceAvatar": {
      "text": "Hi, I'm Mami!",
      "image": { ... }
    },
    "highlights": [
      { "id": "h1", "title": "New Arrivals", "media": { ... }, "targetUrl": "/brands/c/new" }
    ]
  },
  "pageSections": { ... }
}
```

---

### `GET /api/v1/home-page/page-sections`
**Query params:** `page`, `pageSize` | **Response `200`:** `PageSectionList`

---

### `GET /api/v1/home-page/page-sections/:sectionId/items`
**Query params:** `page`, `pageSize` | **Response `200`:** `CollectionItemList`

---

## Mami Plus

### `GET /api/v1/mami-plus/marketing-page`
Returns the Mami Plus subscription marketing page content.

**Response `200`:**
```json
{
  "sliders": [
    {
      "title": "Exclusive deals",
      "subtitle": "Only for Mami Plus members",
      "icon": "https://...",
      "campaigns": [
        {
          "title": "50% off Nike",
          "subtitle": "Running shoes",
          "image": "https://...",
          "brandLogo": "https://..."
        }
      ]
    }
  ]
}
```

---

## Company / Regulations

### `GET /api/v1/company/regulations/:slug`
Returns a regulation or legal page by its slug.

**Example:** `/api/v1/company/regulations/terms-of-service`

**Response `200`:**
```json
{
  "id": "reg-id",
  "slug": "terms-of-service",
  "title": { "text": "Terms of Service" },
  "markdownText": "# Terms of Service\n..."
}
```

**Errors:** `404`

---

## Search

Both endpoints share a **rate limit of 10 req/s, burst 20**.

### `GET /api/v1/search`
Full-text search across brands, campaigns, products, and categories.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `q` | Yes | Search query (min 2 characters) |
| `type` | No | Filter to one type: `BRAND`, `CAMPAIGN`, `PRODUCT`, `CATEGORY` |
| `limit` | No | Max results per group |

**Response `200`:**
```json
{
  "query": "nike",
  "brands":     { "items": [ ... ], "totalCount": 3 },
  "campaigns":  { "items": [ ... ], "totalCount": 12 },
  "products":   { "items": [ ... ], "totalCount": 5 },
  "categories": { "items": [ ... ], "totalCount": 1 }
}
```

**Errors:** `400` (query too short)

---

### `GET /api/v1/search/suggestions`
Autocomplete suggestions sorted by relevance.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `q` | Yes | Partial query |
| `limit` | No | Max number of suggestions |

**Response `200`:**
```json
{
  "query": "nik",
  "suggestions": [
    {
      "type": "BRAND",
      "id": "brand-id",
      "title": "Nike",
      "slug": "nike",
      "image": { ... },
      "path": "/brands/nike"
    }
  ]
}
```

`suggestion.type` values: `BRAND`, `CAMPAIGN`, `PRODUCT`, `CATEGORY`

---

## Commerce

### `GET /api/v1/commerce/plans`
Returns all active subscription plans available for purchase.

**Response `200`:**
```json
[
  {
    "id": "plan-monthly",
    "name": "Mami Plus Monthly",
    "description": "Full access to all Mami Plus benefits",
    "price": 29.90,
    "currency": "ILS",
    "billingInterval": "month",
    "billingIntervalCount": 1,
    "features": ["Exclusive deals", "Personal codes", "Priority support"]
  }
]
```

`billingInterval` values: `day`, `week`, `month`, `year`

---

### `POST /api/v1/commerce/subscription/cancel`
Cancels the authenticated user's active subscription.

**Auth:** Required | **Request body:** empty

**Response `200`:** `null`

**Errors:**

| Status | Meaning |
|---|---|
| `404` | No active subscription found |
| `400` | Subscription is not in an active state |

---

## Payment

The payment flow is two steps:

1. `POST /payment/init` → receive transaction credentials + Tranzila token (`thtk`)
2. Submit card details directly to Tranzila using `thtk`
3. `POST /payment/acknowledge` → verify hash, activate subscription

Both endpoints require authentication.

---

### `POST /api/v1/payment/init`
Initializes a payment transaction for a catalog item (subscription plan).

**Auth:** Required

**Request body:**
```json
{
  "catalogItemId": "plan-monthly",
  "sum": 29.90
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `catalogItemId` | string | Yes | ID from `/commerce/plans` |
| `sum` | number | Yes | Must exactly match catalog item price (> 0) |

**Response `200`:**
```json
{
  "transactionId": "txn-uuid",
  "thtk": "tranzila-hosted-token",
  "terminalName": "mami_terminal",
  "sum": 29.90,
  "currencyCode": "ILS",
  "chargeOnInit": false
}
```

Use `thtk` + `terminalName` to render the Tranzila hosted payment form on the client.

**Errors:**

| Status | Meaning |
|---|---|
| `404` | `catalogItemId` does not exist |
| `400` | `sum` does not match the catalog item's price |

---

### `POST /api/v1/payment/acknowledge`
Verifies the Tranzila payment response and completes the subscription.

**Auth:** Required | **Rate limit:** 1 req/s, burst 1

**Request body:**
```json
{
  "transactionId": "txn-uuid",
  "responseHash": "tranzila-response-hash",
  "rawPayload": "raw-tranzila-response-string",
  "cardHolderId": "0123456789"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `transactionId` | string | Yes | From `init` response |
| `responseHash` | string | Yes | Hash received from Tranzila callback |
| `rawPayload` | string | Yes | Full raw Tranzila response string |
| `cardHolderId` | string | Conditional | Required for standing-order (recurring) payments |

**Response `200`:**
```json
{
  "transactionId": "txn-uuid",
  "verified": true,
  "success": true
}
```

**Errors:**

| Status | Meaning |
|---|---|
| `404` | Transaction not found |
| `403` | Transaction belongs to a different account |
| `409` | Transaction was already completed |
| `400` | Invalid response hash |
| `400` | `cardHolderId` required but missing |

---

## Error Reference

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request — invalid input, missing fields, business rule violation |
| `401` | Unauthenticated — missing, malformed, or expired token |
| `403` | Forbidden — authenticated but lacks required role or permission |
| `404` | Resource not found |
| `409` | Conflict — duplicate or already-completed action |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `503` | Service unavailable (health check only) |
