// app/api/search/route.ts
import { type NextRequest, NextResponse } from 'next/server';

const RESULTS_PER_PAGE = 24;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Frontend Product Interface
interface SearchApiProduct {
  id: string | number;
  slug: string;
  pictureUrl?: string;
  title: string;
  localizedRetailPriceCents: {
    amountCents: number;
    currency: string;
  };
  status: string;
  inStock: boolean;
  category: string;
  brandName: string;
  activitiesList: any[];
  releaseDate?: {
    seconds: number;
    nanos: number;
  };
  seasonYear: string;
  productType: string;
  underRetail: boolean;
  gender: string;
}

// KicksDB GOAT Product
interface KicksDevGoatProduct {
  id: number;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  description: string;
  colorway: string;
  season: string;
  category: string;
  product_type: string;
  image_url: string;
  release_date: string;
  release_date_year: string;
  retail_prices: {
    retail_price_cents_usd?: number;
    [key: string]: number | undefined;
  };
  link: string;
  sizes: Array<{
    presentation: string;
    value: number;
  }>;
  variants?: Array<{
    product_id: number;
    size: string;
    lowest_ask: number;
    available: boolean;
    currency: string;
    updated_at: string;
  }>;
  rank?: number;
  weekly_orders?: number;
}

// KicksDB StockX Product
interface KicksDevStockXProduct {
  id: string;
  title: string;
  brand: string;
  model: string;
  gender: string;
  description: string;
  image: string;
  sku: string;
  slug: string;
  product_type: string;
  category: string;
  secondary_category: string;
  categories: string[];
  gallery: string[];
  link: string;
  rank: number;
  weekly_orders: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  upcoming: boolean;
  release_date: string;
  updated_at: string;
  created_at: string;
  variants?: Array<{
    id: string;
    size: string;
    size_type: string;
    lowest_ask: number;
    total_asks: number;
    currency: string;
    market: string;
  }>;
}

// KicksDB API Response
interface KicksDevApiResponse<T> {
  status: string;
  query?: { query: string };
  data?: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
  };
  error?: string;
}

// eBay Types
interface EbayItemSummary {
  itemId: string;
  title: string;
  image?: { imageUrl: string };
  price: { value: string; currency: string };
  itemHref: string;
}

interface EbaySearchResponse {
  total?: number;
  href: string;
  next?: string;
  itemSummaries?: EbayItemSummary[];
  refinement?: any;
}

// ============================================================================
// EBAY AUTHENTICATION & HELPERS
// ============================================================================

const EBAY_CLIENT_ID = process.env.EBAY_PRODUCTION_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_PRODUCTION_CLIENT_SECRET;

let ebayTokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

function getHighResEbayImage(url: string | undefined): string {
  if (!url) {
    return 'https://placehold.co/1600x1600/333333/ffffff?text=No+Image';
  }
  return url.replace(/s-l[0-9]+/, 's-l1600');
}

async function getEbayAuthToken(): Promise<string | null> {
  const now = Date.now();
  if (ebayTokenCache.token && now < ebayTokenCache.expiresAt) {
    return ebayTokenCache.token;
  }

  if (!EBAY_CLIENT_ID || EBAY_CLIENT_ID === 'YOUR_EBAY_CLIENT_ID') {
    console.error('eBay API Client ID/Secret not set.');
    return null;
  }

  const credentials = btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`);
  const url = 'https://api.ebay.com/identity/v1/oauth2/token';

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
          Connection: 'keep-alive',
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorBody = await res.text();
        lastError = new Error(`EbayAuthError: ${res.status} - ${errorBody}`);
        console.error(
          `Failed to get eBay auth token (Attempt ${attempt}/${MAX_RETRIES}):`,
          res.status,
          errorBody
        );
        if (res.status >= 400 && res.status < 500) break;
      } else {
        const data = await res.json();
        const expiresIn = (data.expires_in || 3600) * 1000;
        ebayTokenCache = {
          token: data.access_token,
          expiresAt: now + expiresIn - 60000,
        };
        return ebayTokenCache.token;
      }
    } catch (error: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;
      const errorName = error instanceof Error ? error.name : 'Error';

      console.error(
        `Error fetching eBay token (Attempt ${attempt}/${MAX_RETRIES}):`,
        errorMessage,
        errorCode,
        errorName
      );

      if (
        errorName === 'AbortError' ||
        errorCode === 'UND_ERR_CONNECT_TIMEOUT' ||
        errorCode === 'ECONNRESET'
      ) {
        if (attempt < MAX_RETRIES) {
          const waitTime = attempt * 1000;
          console.log(`Connection error/timeout. Retrying in ${waitTime / 1000}s...`);
          await new Promise((res) => setTimeout(res, waitTime));
        }
      } else {
        break;
      }
    }
  }
  console.error('Error fetching eBay token after all retries:', lastError?.message);
  return null;
}

function getFilterMap(params: URLSearchParams): Map<string, string[]> {
  const filterMap = new Map<string, string[]>();
  const reserved = ['query', 'page', 'page_limit', 'marketplace', 'categoryIds', 'sort'];
  params.forEach((value, key) => {
    if (!reserved.includes(key)) {
      const values = filterMap.get(key) || [];
      values.push(value);
      filterMap.set(key, values);
    }
  });
  return filterMap;
}

function buildEbayFilterString(filterMap: Map<string, string[]>): string | null {
  if (filterMap.size === 0) return null;

  const aspectFilters = Array.from(filterMap.entries()).map(([key, values]) => {
    if (values.length > 1) {
      return `${key}:{${values.join('|')}}`;
    }
    return `${key}:${values[0]}`;
  });

  return aspectFilters.join(',');
}

// ============================================================================
// PRODUCT MAPPERS
// ============================================================================

function mapGoatToProduct(p: KicksDevGoatProduct): SearchApiProduct {
  const hasAvailableVariant = Array.isArray(p.variants) && p.variants.some(v => v.available);
  const retailPriceUsdCents = p.retail_prices?.retail_price_cents_usd || 0;
  const lowestAskCents = Array.isArray(p.variants) && p.variants.length > 0
    ? p.variants.reduce((minAsk, v) => Math.min(minAsk, v.lowest_ask * 100), Infinity)
    : Infinity;

  const priceToDisplay = retailPriceUsdCents > 0
    ? retailPriceUsdCents
    : (lowestAskCents !== Infinity ? lowestAskCents : 0);

  return {
    id: String(p.id),
    slug: p.slug,
    pictureUrl: p.image_url,
    title: p.name,
    localizedRetailPriceCents: {
      amountCents: priceToDisplay,
      currency: 'USD',
    },
    status: 'available',
    inStock: hasAvailableVariant,
    category: p.category,
    brandName: p.brand,
    activitiesList: [],
    releaseDate: p.release_date
      ? {
          seconds: new Date(
            p.release_date.slice(0, 4) + '-' +
            p.release_date.slice(4, 6) + '-' +
            p.release_date.slice(6, 8)
          ).getTime() / 1000,
          nanos: 0
        }
      : undefined,
    seasonYear: p.release_date_year,
    productType: p.product_type,
    underRetail: retailPriceUsdCents > 0 && lowestAskCents !== Infinity && lowestAskCents < retailPriceUsdCents,
    gender: '',
  };
}

function mapStockXToProduct(p: KicksDevStockXProduct): SearchApiProduct {
  const hasAvailableVariant = Array.isArray(p.variants) && p.variants.some(v => v.total_asks > 0);
  const lowestAskCents = p.min_price ? p.min_price * 100 : 0;

  return {
    id: p.id,
    slug: p.slug,
    pictureUrl: p.image,
    title: p.title,
    localizedRetailPriceCents: {
      amountCents: lowestAskCents,
      currency: 'USD',
    },
    status: 'available',
    inStock: hasAvailableVariant,
    category: p.category,
    brandName: p.brand,
    activitiesList: [],
    seasonYear: '',
    productType: p.product_type,
    underRetail: false,
    gender: p.gender || '',
  };
}

function mapEbayToProduct(item: EbayItemSummary): SearchApiProduct {
  let priceCents = 0;
  try {
    const priceFloat = parseFloat(item.price.value);
    priceCents = Math.round(priceFloat * 100);
  } catch {
    // leave as 0
  }
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .concat('-', item.itemId.replace('v1|', ''));

  return {
    id: item.itemId,
    slug: slug,
    pictureUrl: getHighResEbayImage(item.image?.imageUrl),
    title: item.title,
    localizedRetailPriceCents: {
      amountCents: priceCents,
      currency: item.price.currency,
    },
    status: 'available',
    inStock: true,
    brandName: '',
    category: '',
    productType: 'Pre-owned',
    activitiesList: [],
    seasonYear: '',
    underRetail: false,
    gender: '',
  };
}

// ============================================================================
// MAIN SEARCH HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('page_limit') || String(RESULTS_PER_PAGE);
  const marketplace = searchParams.get('marketplace') || 'goat'; // 'goat', 'stockx', or 'ebay'

  // ========== HANDLE EBAY ==========
  if (marketplace === 'ebay') {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter is required.' },
        { status: 400 }
      );
    }

    try {
      const token = await getEbayAuthToken();
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            error: 'eBay API credentials not configured or authentication failed.',
          },
          { status: 500 }
        );
      }

      const apiURL = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
      apiURL.searchParams.set('q', `${query} preowned`);
      apiURL.searchParams.set('limit', String(limitNum));
      apiURL.searchParams.set('offset', String(offset));

      const filterMap = getFilterMap(searchParams);
      filterMap.set('categoryId', ['11450', '281', '220', '15032', '172008']);

      const combinedAspectFilter = buildEbayFilterString(filterMap);
      if (combinedAspectFilter) {
        apiURL.searchParams.set('aspect_filter', combinedAspectFilter);
      }

      apiURL.searchParams.set(
        'fieldgroups',
        'MATCHING_ITEMS,ASPECT_REFINEMENTS,CATEGORY_REFINEMENTS'
      );

      console.log('eBay API URL:', apiURL.toString());

      const res = await fetch(apiURL.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('eBay API Error:', res.status, errorBody);
        throw new Error(`eBay API Error: ${res.status}`);
      }

      const result: EbaySearchResponse = await res.json();

      const fetchedProducts = result.itemSummaries || [];
      const totalNumResults = result.total || 0;
      const productsForFrontend = fetchedProducts.map(mapEbayToProduct);
      const hasMore = !!result.next;

      const filters = {
        aspectRefinements:
          result.refinement?.aspectRefinements?.map((a: any) => ({
            name: a.localizedName,
            id: a.localizedName.replace(/\s+/g, '_'),
            values:
              a.aspectValues?.map((v: any) => ({
                value: v.localizedValue,
                count: v.count,
                refinementHref: v.refinementHref,
              })) || [],
          })) || [],
        categoryRefinements:
          result.refinement?.categoryRefinements?.map((c: any) => ({
            id: c.categoryId,
            name: c.categoryName,
            count: c.count,
            refinementHref: c.refinementHref,
          })) || [],
      };

      return NextResponse.json({
        success: true,
        data: {
          products: productsForFrontend,
          totalCount: totalNumResults,
          hasMore: hasMore,
          marketplace: 'ebay',
          filters: filters,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown server error occurred';
      console.error('API Route Error (eBay):', message, err);
      return NextResponse.json(
        {
          success: false,
          error: 'Server error during eBay search.',
          details: message,
        },
        { status: 500 }
      );
    }
  }

  // ========== HANDLE KICKSDB (GOAT & STOCKX) ==========
  const apiKey = process.env.KICKS_DEV_API_KEY;

  if (!apiKey) {
    console.error('Missing KICKS_DEV_API_KEY environment variable.');
    return NextResponse.json(
      { success: false, error: 'Internal Server Error: API key not configured.' },
      { status: 500 }
    );
  }

  console.log('API Key exists:', !!apiKey, 'Length:', apiKey?.length);

  // Construct API URL based on marketplace
  const baseUrl = marketplace === 'stockx'
    ? 'https://api.kicks.dev/v3/stockx/products'
    : 'https://api.kicks.dev/v3/goat/products';

  const apiURL = new URL(baseUrl);

  // Add common query parameters
  if (query) {
    apiURL.searchParams.set('query', query);
  }
  apiURL.searchParams.set('limit', limit);
  apiURL.searchParams.set('page', page);

  // Add marketplace-specific parameters
  if (marketplace === 'goat') {
    apiURL.searchParams.set('currency', 'USD');
  }

  // --- FILTERING SUPPORT ---
  const GOAT_FILTERS = ['brand', 'category', 'product_type', 'colorway', 'model', 'season'];
  const STOCKX_FILTERS = ['brand', 'gender', 'product_type', 'category', 'secondary_category', 'sku'];

  const supportedFilters = marketplace === 'stockx' ? STOCKX_FILTERS : GOAT_FILTERS;

  const filterParts: string[] = [];

  supportedFilters.forEach(filterKey => {
    const filterValue = searchParams.get(filterKey);
    if (filterValue) {
      filterParts.push(`${filterKey} = "${filterValue}"`);
    }
  });

  // Handle special filters for StockX
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');

  if (marketplace === 'stockx') {
    if (minPrice) {
      filterParts.push(`min_price >= ${minPrice}`);
    }
    if (maxPrice) {
      filterParts.push(`max_price <= ${maxPrice}`);
    }
  }

  // Combine all filters with AND
  if (filterParts.length > 0) {
    const filterString = filterParts.join(' AND ');
    apiURL.searchParams.set('filters', filterString);
  }

  try {
    console.log('Fetching from KicksDB:', apiURL.toString());

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      cache: 'no-store',
    };

    const res = await fetch(apiURL.toString(), requestOptions);

    if (!res.ok) {
      const errorBodyText = await res.text();
      let errorMsg = `KicksDB API Error: ${res.status}`;
      try {
        const errorJson = JSON.parse(errorBodyText);
        errorMsg += ` - ${errorJson?.error || errorBodyText}`;
      } catch (parseError) {
        console.debug('Failed to parse error response as JSON', parseError);
        errorMsg += ` - ${errorBodyText}`;
      }
      console.error(errorMsg);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch search results.', details: errorMsg },
        { status: res.status }
      );
    }

    let result: KicksDevApiResponse<KicksDevGoatProduct | KicksDevStockXProduct>;

    if (marketplace === 'stockx') {
      result = await res.json() as KicksDevApiResponse<KicksDevStockXProduct>;
    } else {
      result = await res.json() as KicksDevApiResponse<KicksDevGoatProduct>;
    }

    if (result.status === 'error') {
      console.error('KicksDB API returned error status:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'KicksDB API reported an error.' },
        { status: 500 }
      );
    }

    // Process the response
    const fetchedProducts = result?.data || [];
    const totalNumResults = result?.meta?.total || 0;
    const currentPage = result?.meta?.current_page || 0;
    const perPage = result?.meta?.per_page || RESULTS_PER_PAGE;

    // Map products to frontend interface based on marketplace
    let productsForFrontend: SearchApiProduct[];

    if (marketplace === 'stockx') {
      productsForFrontend = (fetchedProducts as KicksDevStockXProduct[]).map(mapStockXToProduct);
    } else {
      productsForFrontend = (fetchedProducts as KicksDevGoatProduct[]).map(mapGoatToProduct);
    }

    // Determine if more results exist
    const hasMore = (currentPage + 1) * perPage < totalNumResults;

    // Return data
    return NextResponse.json({
      success: true,
      data: {
        products: productsForFrontend,
        totalCount: totalNumResults,
        hasMore: hasMore,
        marketplace: marketplace,
        currentPage: currentPage,
        perPage: perPage,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown server error occurred';
    console.error('API Route Error:', message, err);
    return NextResponse.json(
      { success: false, error: 'Server error during search.', details: message },
      { status: 500 }
    );
  }
}