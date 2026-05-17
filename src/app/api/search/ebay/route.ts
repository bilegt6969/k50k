import { type NextRequest, NextResponse } from 'next/server';
import { Product } from '../../../../../types/product'; // Adjust path if needed

//---!!!IMPORTANT!!!---
//---ADD YOUR EBAY API CREDENTIALS HERE---
const EBAY_CLIENT_ID = process.env.EBAY_PRODUCTION_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_PRODUCTION_CLIENT_SECRET;
//----------------------------------------

const RESULTS_PER_PAGE = 24;

//---Ebay API Interfaces---
interface EbayItemSummary {
  itemId: string;
  title: string;
  image?: { imageUrl: string };
  price: { value: string; currency: string };
  itemHref: string;
}

interface EbayCategoryRefinement {
  categoryId: string;
  categoryName: string;
  count: number;
  refinementHref: string;
}

interface EbayAspectValue {
  localizedValue: string;
  count: number;
  refinementHref: string;
}

interface EbayAspect {
  localizedName: string;
  aspectValues: EbayAspectValue[];
}

interface EbayRefinement {
  aspectRefinements?: EbayAspect[];
  categoryRefinements?: EbayCategoryRefinement[];
}

interface EbaySearchResponse {
  total?: number;
  href: string;
  next?: string;
  itemSummaries?: EbayItemSummary[];
  refinement?: EbayRefinement;
}

//---In-memory token cache---
let tokenCache = {
  token: null as string | null,
  expiresAt: 0,
};

/***Takes an Ebay thumbnail URL and converts it to high-resolution.*/
function getHighResEbayImage(url: string | undefined): string {
  if (!url) {
    return 'https://placehold.co/1600x1600/333333/ffffff?text=No+Image';
  }
  return url.replace(/s-l[0-9]+/, 's-l1600');
}

/***---MODIFIED---*Gets a new OAuth token from Ebay.*Includes retry logic for network errors/timeouts.*/
async function getEbayAuthToken(): Promise<string | null> {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  if (!EBAY_CLIENT_ID || EBAY_CLIENT_ID === 'YOUR_EBAY_CLIENT_ID') {
    console.error('Ebay API Client ID/Secret not set.');
    return null;
  }

  const credentials = btoa(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`);
  const url = 'https://api.ebay.com/identity/v1/oauth2/token';

  //---Add Retry Logic---
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      //Add AbortController for timeout
      const controller = new AbortController();
      //Set timeout to 15 seconds (15000ms)
      timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
          Connection: 'keep-alive', //Add keep-alive
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        cache: 'no-store',
        signal: controller.signal, //Pass signal to fetch
      });

      clearTimeout(timeoutId); //Clear timeout if fetch succeeds or fails gracefully

      if (!res.ok) {
        const errorBody = await res.text();
        lastError = new Error(`EbayAuthError: ${res.status} - ${errorBody}`);
        console.error(
          `Failed to get Ebay auth token (Attempt ${attempt}/${MAX_RETRIES}):`,
          res.status,
          errorBody,
        );
        //Don't retry on client errors (e.g., 401 Unauthorized)
        if (res.status >= 400 && res.status < 500) {
          break; //Break loop, will return null
        }
        //For 5xx server errors, continue loop to retry
      } else {
        //Success!
        const data = await res.json();
        const expiresIn = (data.expires_in || 3600) * 1000;
        tokenCache = {
          token: data.access_token,
          expiresAt: now + expiresIn - 60000, //Refresh 1 min before expiry
        };
        return tokenCache.token; //Return successful token
      }
    } catch (error: unknown) {
      if (timeoutId) clearTimeout(timeoutId); //Clear timeout if fetch throws
      lastError = error instanceof Error ? error : new Error('Unknown error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;
      const errorName = error instanceof Error ? error.name : 'Error';
      
      console.error(
        `Error fetching Ebay token (Attempt ${attempt}/${MAX_RETRIES}):`,
        errorMessage,
        errorCode,
        errorName,
      );
      //Only retry on specific network errors like timeout
      if (
        errorName === 'AbortError' ||
        errorCode === 'UND_ERR_CONNECT_TIMEOUT' ||
        errorCode === 'ECONNRESET'
      ) {
        if (attempt < MAX_RETRIES) {
          const waitTime = attempt * 1000; //1s, 2s
          console.log(
            `Connection error/timeout. Retrying in ${waitTime / 1000}s...`,
          );
          await new Promise((res) => setTimeout(res, waitTime));
        }
      } else {
        //For other unexpected errors, don't retry
        break;
      }
    }
  }
  //If loop finished without returning, we failed
  console.error(
    'Error fetching Ebay token after all retries:',
    lastError?.message,
  );
  return null; //Return null after all retries fail
}

/***Parses filter params from frontend into a Map.*/
function getFilterMap(params: URLSearchParams): Map<string, string[]> {
  const filterMap = new Map<string, string[]>();
  //Add any other known non-filter params (like 'sort') to this list
  //We add 'categoryIds' here so the frontend param is ignored, as we set it manually
  const reserved = ['query', 'page', 'page_limit', 'categoryIds', 'sort'];
  params.forEach((value, key) => {
    if (!reserved.includes(key)) {
      const values = filterMap.get(key) || [];
      values.push(value);
      filterMap.set(key, values);
    }
  });
  return filterMap;
}

/***---MODIFIED---*Converts a filter Map into an Ebay aspect_filter string.*Uses {...} for multiple values, but not for single values.*/
function buildEbayFilterString(
  filterMap: Map<string, string[]>,
): string | null {
  if (filterMap.size === 0) return null;

  const aspectFilters = Array.from(filterMap.entries()).map(([key, values]) => {
    if (values.length > 1) {
      //e.g., Color=Blue&Color=Red -> Color:{Blue|Red}
      return `${key}:{${values.join('|')}}`;
    }
    //e.g., Brand:Nike -> Brand:Nike
    //This matches the format in your example.
    return `${key}:${values[0]}`;
  });

  return aspectFilters.join(',');
}

/***Maps EbayItemSummary to our internal Product interface*/
function mapEbayToProduct(item: EbayItemSummary): Product {
  let priceCents = 0;
  try {
    const priceFloat = parseFloat(item.price.value);
    priceCents = Math.round(priceFloat * 100);
  } catch {
    //leave as 0
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
    inStock: true,
    brandName: '',
    category: '',
    productType: 'Pre-owned',
    // Add missing required properties
    status: 'available',
    activitiesList: [],
    seasonYear: '',
    underRetail:false,
    gender: '',
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(
    searchParams.get('page_limit') || String(RESULTS_PER_PAGE),
    10,
  );
  const offset = (page - 1) * limit;

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Query parameter is required.' },
      { status: 400 },
    );
  }

  try {
    const token = await getEbayAuthToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ebay API credentials not configured or authentication failed.',
        },
        { status: 500 },
      );
    }

    //---START: REVISED FILTER LOGIC---
    //Base URL for the API call
    const apiURL = new URL(
      'https://api.ebay.com/buy/browse/v1/item_summary/search',
    );
    apiURL.searchParams.set('q', query);
    apiURL.searchParams.set('limit', String(limit));
    apiURL.searchParams.set('offset', String(offset));

    // 1. Get all *other* aspect filters from the URL into a Map
    const filterMap = getFilterMap(searchParams);

    // 2. --- REMOVED BUG ---
    // The `filterMap.set('Brand', ['']);` line has been removed.

    // 3. --- MODIFICATION ---
    // Hardcode the allowed categories into the *aspect filter map*.
    // 11450 = Clothing, Shoes & Accessories
    // 281 = Jewelry & Watches
    // 220 = Toys & Hobbies (Action Figures, Vinyl, etc.)
    // 15032 = Sports Mem, Cards & Fan Shop (Trading Cards)
    // 172008 = Art (Prints, Posters, etc.)
    filterMap.set('categoryId', ['11450', '281', '220', '15032', '172008']);
    // --- END MODIFICATION ---

    // 4. Convert the finalized Map into the API filter string
    const combinedAspectFilter = buildEbayFilterString(filterMap);

    // 5. Set the final, combined filter string (if it's not empty)
    if (combinedAspectFilter) {
      apiURL.searchParams.set('aspect_filter', combinedAspectFilter);
    }
    //---END: REVISED FILTER LOGIC---

    apiURL.searchParams.set(
      'fieldgroups',
      'MATCHING_ITEMS,ASPECT_REFINEMENTS,CATEGORY_REFINEMENTS',
    );

    console.log('eBay API URL:', apiURL.toString()); // This URL will now look correct

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
      console.error('Ebay API Error:', res.status, errorBody);
      console.error('Request URL:', apiURL.toString());
      throw new Error(`Ebay API Error: ${res.status}`);
    }

    const result: EbaySearchResponse = await res.json();

    const fetchedProducts = result.itemSummaries || [];
    const totalNumResults = result.total || 0;
    const productsForFrontend = fetchedProducts.map(mapEbayToProduct);
    const hasMore = !!result.next;

    const filters = {
      aspectRefinements:
        result.refinement?.aspectRefinements?.map((a) => ({
          name: a.localizedName,
          id: a.localizedName.replace(/\s+/g, '_'),
          values:
            a.aspectValues?.map((v) => ({
              value: v.localizedValue,
              count: v.count,
              refinementHref: v.refinementHref,
            })) || [],
        })) || [],
      categoryRefinements:
        result.refinement?.categoryRefinements?.map((c) => ({
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
        filters: filters,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown server error occurred';
    console.error('API Route Error (Ebay):', message, err);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error during Ebay search.',
        details: message,
      },
      { status: 500 },
    );
  }
}