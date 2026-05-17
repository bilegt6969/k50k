// app/api/search/kream/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { Product } from '../../../../../types/product';

const RESULTS_PER_PAGE = 24;

// Kream API Interfaces
interface KreamReleasePrice {
  currency: string;
  price: number;
}

interface KreamVariant {
  id: number;
  size: string;
  converted_sizes?: Array<{
    type: string;
    size: string;
  }> | null;
  lowest_ask: number;
  lowest_ask_converted: number;
  highest_bid: number;
  highest_bid_converted: number;
  currency: string;
  available: boolean;
}

interface KreamProduct {
  id: number;
  name: string;
  translated_name: string;
  brand: string;
  translated_brand: string;
  sku: string;
  colorway: string;
  category: string;
  gender: string;
  release_date: string;
  images: string[] | null;
  total_sales: number;
  release_price: KreamReleasePrice;
  release_price_converted: KreamReleasePrice;
  variants: KreamVariant[] | null;
}

interface KreamApiResponse {
  data?: KreamProduct[] | null;
  meta: {
    current_page?: number;
    per_page?: number;
    total?: number;
  };
}

// Valid sort options for Kream
type KreamSortOption = 'id:asc' | 'id:desc' | 'release_date:asc' | 'release_date:desc';

// Valid currency options
type CurrencyOption = 'USD' | 'EUR' | 'GBP';

/**
 * Validates and returns a valid sort option
 */
function getSortOption(sortParam: string | null): KreamSortOption {
  const validSorts: KreamSortOption[] = ['id:asc', 'id:desc', 'release_date:asc', 'release_date:desc'];
  
  if (sortParam && validSorts.includes(sortParam as KreamSortOption)) {
    return sortParam as KreamSortOption;
  }
  
  return 'id:desc'; // Default: newest first
}

/**
 * Validates and returns a valid currency option
 */
function getCurrencyOption(currencyParam: string | null): CurrencyOption {
  const validCurrencies: CurrencyOption[] = ['USD', 'EUR', 'GBP'];
  
  if (currencyParam && validCurrencies.includes(currencyParam as CurrencyOption)) {
    return currencyParam as CurrencyOption;
  }
  
  return 'USD'; // Default currency
}

/**
 * Builds a filter string for the Kream API
 * Format: "brand = 'Nike' AND category = 'Sneakers'"
 */
function buildFilterString(searchParams: URLSearchParams): string | null {
  const filters: string[] = [];

  // Brand filter
  const brand = searchParams.get('brand');
  if (brand) {
    filters.push(`brand = '${brand.replace(/'/g, "''")}'`);
  }

  // Category filter
  const category = searchParams.get('category');
  if (category) {
    filters.push(`category = '${category.replace(/'/g, "''")}'`);
  }

  // Gender filter
  const gender = searchParams.get('gender');
  if (gender) {
    filters.push(`gender = '${gender.replace(/'/g, "''")}'`);
  }

  // Colorway filter
  const colorway = searchParams.get('colorway');
  if (colorway) {
    filters.push(`colorway = '${colorway.replace(/'/g, "''")}'`);
  }

  return filters.length > 0 ? filters.join(' AND ') : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Basic search parameters
  const query = searchParams.get('query') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('page_limit') || String(RESULTS_PER_PAGE);
  
  // Advanced parameters
  const sort = getSortOption(searchParams.get('sort'));
  const currency = getCurrencyOption(searchParams.get('currency'));

  if (!query) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Query parameter is required.' 
      },
      { status: 400 }
    );
  }

  // Validate API Key
  const apiKey = process.env.KICKS_DEV_API_KEY;
  if (!apiKey) {
    console.error('Missing KICKS_DEV_API_KEY environment variable.');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error: API key not configured.' 
      },
      { status: 500 }
    );
  }

  // Build API URL
  const apiURL = new URL('https://api.kicks.dev/v3/kream/products');

  // Add search query
  apiURL.searchParams.set('query', query);

  // Add pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || RESULTS_PER_PAGE));
  
  apiURL.searchParams.set('page', String(pageNum));
  apiURL.searchParams.set('limit', String(limitNum));

  // Add sorting
  apiURL.searchParams.set('sort', sort);

  // Add currency
  apiURL.searchParams.set('currency', currency);

  // Build and add filters
  const filterString = buildFilterString(searchParams);
  if (filterString) {
    apiURL.searchParams.set('filters', filterString);
    console.log('Applied Kream filters:', filterString);
  }

  try {
    console.log('Fetching from Kicks.dev Kream API:', apiURL.toString());

    const myHeaders = new Headers();
    myHeaders.append("Authorization", apiKey);
    myHeaders.append("Content-Type", "application/json");

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      cache: 'no-store',
    };

    const res = await fetch(apiURL.toString(), requestOptions);

    // Enhanced error handling
    if (!res.ok) {
      const errorBodyText = await res.text();
      let errorMsg = `Kicks.dev Kream API Error: ${res.status}`;
      
      try {
        const errorJson = JSON.parse(errorBodyText);
        errorMsg += ` - ${errorJson?.error || errorJson?.message || errorJson?.detail || errorBodyText}`;
        
        if (errorJson?.errors) {
          console.error('Detailed API errors:', errorJson.errors);
        }
      } catch (parseError) {
        errorMsg += ` - ${errorBodyText}`;
      }

      console.error(errorMsg);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch search results from Kicks.dev Kream API.',
          details: errorMsg 
        },
        { status: res.status }
      );
    }

    const result: KreamApiResponse = await res.json();

    // Process the response
    const fetchedProducts = result?.data || [];
    const totalNumResults = result?.meta?.total || 0;
    const currentPage = result?.meta?.current_page || pageNum;
    const perPage = result?.meta?.per_page || limitNum;

    console.log(`Found ${fetchedProducts.length} Kream products (${totalNumResults} total)`);

    // Map KreamProduct to Product interface
    const productsForFrontend = fetchedProducts.map((p): Product => {
      // Get the first image or fallback
      const imageUrl = (Array.isArray(p.images) && p.images.length > 0) 
        ? p.images[0] 
        : 'https://via.placeholder.com/400x400?text=No+Image';

      // Calculate lowest ask price from available variants
      let lowestAskCents = Infinity;
      let hasAvailableVariant = false;

      if (Array.isArray(p.variants) && p.variants.length > 0) {
        for (const variant of p.variants) {
          if (variant.available && variant.lowest_ask_converted && variant.lowest_ask_converted > 0) {
            hasAvailableVariant = true;
            // Kream returns prices in the target currency (USD/EUR/GBP), not cents
            const askCents = Math.round(variant.lowest_ask_converted * 100);
            if (askCents < lowestAskCents) {
              lowestAskCents = askCents;
            }
          }
        }
      }

      // Get retail price (already converted to target currency)
      const retailPriceCents = p.release_price_converted?.price 
        ? Math.round(p.release_price_converted.price * 100)
        : 0;

      // Use market price if available, otherwise retail price
      const finalPriceCents = lowestAskCents !== Infinity ? lowestAskCents : retailPriceCents;
      const isAvailable = finalPriceCents > 0;

      // Parse release date (format: YYYY-MM-DD)
      let releaseDate = undefined;
      if (p.release_date) {
        try {
          const date = new Date(p.release_date);
          
          if (!isNaN(date.getTime())) {
            releaseDate = {
              seconds: Math.floor(date.getTime() / 1000),
              nanos: 0
            };
          }
        } catch (err) {
          console.warn(`Failed to parse release date for product ${p.id}:`, p.release_date);
        }
      }

      // Create slug from product name and ID
      const slug = `${p.translated_name || p.name}`
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .concat('-', String(p.id));

      return {
        id: String(p.id),
        slug: slug,
        pictureUrl: imageUrl,
        title: p.translated_name || p.name,
        localizedRetailPriceCents: {
          amountCents: finalPriceCents,
          currency: currency,
        },
        status: isAvailable ? 'available' : 'unavailable',
        inStock: hasAvailableVariant,
        category: p.category || '',
        brandName: p.translated_brand || p.brand || '',
        activitiesList: [],
        releaseDate: releaseDate,
        seasonYear: p.release_date ? p.release_date.split('-')[0] : '',
        productType: p.category || '',
        underRetail: retailPriceCents > 0 && lowestAskCents !== Infinity && lowestAskCents < retailPriceCents,
        gender: p.gender || '',
      };
    });

    // Calculate if more results exist
    const hasMore = (currentPage * perPage) < totalNumResults;

    // Return data in the format expected by the frontend
    return NextResponse.json({
      success: true,
      data: {
        products: productsForFrontend,
        totalCount: totalNumResults,
        hasMore: hasMore,
        currentPage: currentPage,
        perPage: perPage,
      },
      meta: {
        query: query,
        filters: filterString,
        sort: sort,
        currency: currency,
      }
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown server error occurred';
    console.error('API Route Error (Kream):', message, err);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error during Kream search.', 
        details: message 
      },
      { status: 500 }
    );
  }
}