'use client';

// 1. ADD 'use' to the React import
import React, { useState, useEffect, useCallback, useRef, memo, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// --- Reusable Cache Logic ---
interface HomeCache {
  mntRate: number | null;
  timestamp: number | null;
}
// Define cache object OUTSIDE the component scope (or import from a shared module)
// FIX: Use const as homeCache itself is not reassigned
const homeCache: HomeCache = { mntRate: null, timestamp: null };
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour for currency
const isCacheValid = (cacheTimestamp: number | null): boolean => {
  if (!cacheTimestamp) return false;
  // Use current date for comparison
  return Date.now() - cacheTimestamp < CACHE_DURATION_MS;
};
// --- End Cache Logic ---

// --- Interface Definitions ---
interface ItemData {
  id: string;
  slug: string; // Slug for linking to product page
  image_url: string;
  lowest_price_cents: number; // USD cents from API
}

interface Item {
  data: ItemData;
  value: string; // Product name
}

// Interfaces for the Constructor.io Brand API Response
interface ApiBrandResultData {
  id: string;
  image_url: string;
  lowest_price_cents: number;
  slug: string; // Assuming API provides slug, otherwise use generateSlug
}

interface ApiBrandResult {
  data: ApiBrandResultData;
  value: string; // Product name
}

interface ApiBrandResponse {
  response?: {
    results?: ApiBrandResult[];
    total_num_results?: number;
  };
  error?: { message: string };
}

// --- Constants ---
const NUM_RESULTS_PER_PAGE = 24;
const API_BASE_URL = 'https://ac.cnstrc.com/browse/group_id';
// Static query parameters from the example URL
const API_STATIC_PARAMS =
  'c=ciojs-client-2.54.0&key=key_XT7bjdbvjgECO5d8&i=c1a92cc3-02a4-4244-8e70-bee6178e8209&s=103&num_results_per_page=' +
  NUM_RESULTS_PER_PAGE +
  '&sort_by=relevance&sort_order=descending&fmt_options%5Bhidden_fields%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_fields%5D=gp_instant_ship_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_instant_ship_lowest_price_cents_223&variations_map=%7B%22group_by%22%3A%5B%7B%22name%22%3A%22product_condition%22%2C%22field%22%3A%22data.product_condition%22%7D%2C%7B%22name%22%3A%22box_condition%22%2C%22field%22%3A%22data.box_condition%22%7D%5D%2C%22values%22%3A%7B%22min_regional_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_lowest_price_cents_223%22%7D%2C%22min_regional_instant_ship_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_instant_ship_lowest_price_cents_223%22%7D%7D%2C%22dtype%22%3A%22object%22%7D&qs=%7B%22features%22%3A%7B%22display_variations%22%3Atrue%7D%2C%22feature_variants%22%3A%7B%22display_variations%22%3A%22matched%22%7D%7D';
// Note: Adding dynamic _dt=${Date.now()} in fetch function

// --- Helper Utility Functions ---

// Converts URL slug to Title Case Brand Name (approximation)
const slugToBrandName = (slug: string): string => {
  if (!slug) return '';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Generates a slug from text (simple version)
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except space/hyphen
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

// Price formatter - price is stored as MNT cents
const renderPrice = (priceCents: number, mntRate: number | null): string => {
  if (typeof priceCents !== 'number' || isNaN(priceCents)) {
    return 'N/A';
  }
  if (mntRate === null || typeof mntRate !== 'number' || isNaN(mntRate)) {
    return '...'; // Loading price
  }

  // priceCents is stored as MNT cents (admin input * 100)
  const priceMNT = priceCents / 100;

  // Format to MNT currency
  return `₮${Math.ceil(priceMNT).toLocaleString('en-US')}`;
};

// Basic text replacer (can be expanded if needed)
const replaceText = (text: string): string => {
  return text;
};

// --- Skeleton Loading Component (Reused) ---
const SkeletonCard = () => (
  <div className="text-white bg-neutral-800 border border-neutral-700 rounded tracking-tight relative h-full flex flex-col animate-pulse">
    <div
      className="overflow-hidden rounded rounded-b-none relative flex-grow bg-neutral-700"
      style={{ aspectRatio: '1 / 1' }}
    ></div>
    <div className="w-full text-xs font-bold flex items-center p-4 border-t border-neutral-700 justify-between relative">
      <div className="h-4 bg-neutral-600 rounded w-3/4 mr-4"></div>
      <div className="h-8 w-[90px] bg-neutral-600 rounded-full"></div>
    </div>
  </div>
);

// --- Memoized Product Card Component (Reused) ---
interface ProductCardProps {
  item: Item;
  priority: boolean;
  mntRate: number | null;
}

const ProductCard = memo(({ item, priority, mntRate }: ProductCardProps) => {
  // Ensure link uses the slug from item.data
  const productLink = item.data.slug ? `/product/${item.data.slug}` : '#'; // Fallback link

  return (
    <Link href={productLink} passHref>
      <div className="text-white bg-black border border-neutral-700 rounded tracking-tight relative cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-neutral-600  h-full flex flex-col group">
        {/* Image Container */}
        <div className="overflow-hidden rounded-t-lg relative flex-grow" style={{ aspectRatio: '1 / 1' }}>
          <Image
            className="rounded-t-lg mx-auto transition-transform duration-500 group-hover:scale-110 object-contain"
            src={item.data.image_url}
            alt={replaceText(item.value)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 25vw, 20vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        </div>
        {/* Bottom Info Bar */}
        <div className="w-full text-xs font-bold flex items-center p-4 border-t border-neutral-700 justify-between relative transition-colors duration-300 group-hover:border-neutral-500">
          <span className="truncate pr-2">{replaceText(item.value)}</span>
          <div className="bg-neutral-800 backdrop-brightness-90 border border-neutral-700 group-hover:bg-neutral-600 group-hover:border-neutral-500 py-2 px-2 rounded-full whitespace-nowrap transition-all duration-300 ease-out min-w-[90px] text-center relative overflow-hidden">
            <span className="block group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300">
              {renderPrice(item.data.lowest_price_cents, mntRate)}
            </span>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              View
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});
ProductCard.displayName = 'ProductCard';

// --- Main Page Component ---

// 2. UPDATE the type hint for params to indicate it's a Promise
export default function BrandPage({ params }: { params: Promise<{ brandSlug: string }> }) {
  // 3. USE React.use() to unwrap the params Promise
  const resolvedParams = use(params);
  const { brandSlug } = resolvedParams; // Now destructure from the resolved object

  // --- State Hooks ---
  const [displayBrandName, setDisplayBrandName] = useState<string>('');
  const [products, setProducts] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mntRate, setMntRate] = useState<number | null>(null);
  const loadingRef = useRef(null);

  // --- Fetch Currency Data (Reused) ---
  const fetchCurrencyData = useCallback(
    async (forceRefetch = false) => {
      if (!forceRefetch && isCacheValid(homeCache.timestamp) && homeCache.mntRate !== null) {
        if (mntRate !== homeCache.mntRate) setMntRate(homeCache.mntRate);
        return homeCache.mntRate;
      }
      setIsCurrencyLoading(true);
      try {
        // API endpoint for USD to MNT rate
        const res = await fetch('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT');
        if (!res.ok) throw new Error(`Currency API error! status: ${res.status}`);
        const currencyData = await res.json();
        if (currencyData.status_code === 200 && currencyData.data?.mid) {
          const rate = currencyData.data.mid;
          setMntRate(rate);
          homeCache.mntRate = rate;
          homeCache.timestamp = Date.now();
          setError((prev) => prev?.replace(/Failed to fetch currency:[^\n]*/g, '').trim() || null); // Clear only currency error
          return rate;
        } else {
          throw new Error(currencyData.message || 'MNT rate not available');
        }
      } catch (error: unknown) { // FIX: Use unknown instead of any
        console.error('Failed to fetch currency data:', error);
        // FIX: Check if error is an instance of Error before accessing message
        const message = error instanceof Error ? error.message : 'An unknown currency error occurred';
        const currencyError = `Failed to fetch currency: ${message}`;
        setError((prev) =>
          prev ? `${prev.split('\n').filter((line) => !line.includes('Failed to fetch currency:')).join('\n')}\n${currencyError}`.trim() : currencyError
        );
        setMntRate(null); // Ensure price shows loading/error state
        return null;
      } finally {
        setIsCurrencyLoading(false);
      }
    },
    [mntRate]
  ); // Dependency ensures we use current mntRate for comparison check

  // --- Fetch Brand Products ---
  const fetchBrandProducts = useCallback(
    async (slug: string, pageNum: number) => {
      if (!slug) return; // Don't fetch if slug is not available yet

      setIsLoading(true);
      // Ensure the slug is lowercase and URL-encode it for the path segment.
      const encodedBrandSlug = encodeURIComponent(slug.toLowerCase());
      // Construct the dynamic API URL using the lowercase, encoded slug
      const url = `${API_BASE_URL}/${encodedBrandSlug}?${API_STATIC_PARAMS}&page=${pageNum}&_dt=${Date.now()}`; // Added dynamic timestamp

      // Use the display name (derived separately) for logging purposes if needed
      const brandNameForDisplay = slugToBrandName(slug);
      console.log(`Workspaceing brand products: ${brandNameForDisplay} (using slug: ${slug}) - Page ${pageNum}`);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errorBody = await res.text(); // Try reading error body
          throw new Error(`Product API error! status: ${res.status}. Response: ${errorBody.slice(0, 500)}`);
        }

        const data: ApiBrandResponse = await res.json();

        // Check for API-level errors in the response body
        if (data.error) {
          throw new Error(`API Error: ${data.error.message}`);
        }
        if (!data.response?.results) {
          console.warn('No results found in API response structure:', data);
          setHasMore(false);
          setProducts((prev) => (pageNum === 1 ? [] : prev)); // Clear if page 1, else keep previous
          if (pageNum === 1) setIsInitialLoad(false);
          return;
        }

        const results = data.response.results;
        const totalResults = data.response.total_num_results ?? 0;

        // --- Data Transformation ---
        const newItems: Item[] = results.map((result): Item => {
          // Use slug from API if available, otherwise generate one
          const productSlug = result.data.slug || generateSlug(result.value) || result.data.id;
          return {
            value: result.value,
            data: {
              id: result.data.id,
              slug: productSlug,
              image_url: result.data.image_url,
              lowest_price_cents: result.data.lowest_price_cents, // USD cents
            },
          };
        });
        // --- End Data Transformation ---

        // Clear only product-related errors on successful fetch
        setError((prev) => prev?.replace(/Failed to fetch products:[^\n]*/g, '').trim() || null);

        setProducts((prev) => (pageNum === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(pageNum * NUM_RESULTS_PER_PAGE < totalResults);

        if (isInitialLoad && (newItems.length > 0 || totalResults === 0)) {
          setIsInitialLoad(false);
        }
        if (pageNum === 1 && newItems.length === 0) {
          setHasMore(false); // No products found
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unknown product error occurred';
        console.error('Fetch Brand Products Error:', err);
        const productError = `Failed to fetch products: ${message}`;
        setError((prev) =>
          prev ? `${prev.split('\n').filter((line) => !line.includes('Failed to fetch products:')).join('\n')}\n${productError}`.trim() : productError
        );
        if (pageNum === 1) {
          setIsInitialLoad(false);
          setHasMore(false); // Stop loading more if initial fetch fails
        }
      } finally {
        setIsLoading(false); // Stop product loading indicator
      }
    },
    [isInitialLoad] // isInitialLoad needed to correctly set state after first fetch
  );

  // --- Effects ---

  // Effect to set display name from slug and reset state on slug change
  useEffect(() => {
    setDisplayBrandName(slugToBrandName(brandSlug));
    setProducts([]);
    setPage(1);
    setIsInitialLoad(true);
    setHasMore(true);
    setError(null);
    // Note: fetchCurrencyData is called in the next effect
  }, [brandSlug]); // Rerun only when the slug changes

  // Effect for initial data load (products page 1 + currency)
  useEffect(() => {
    // Only run if brandSlug is available (implicitly handled by dependency array)
    // and we have a display name derived (to avoid potential race condition before display name is set)
    if (displayBrandName) {
      console.log('Initial load effect running for:', displayBrandName);
      fetchBrandProducts(brandSlug, 1); // Fetch page 1
      fetchCurrencyData(); // Fetch currency (uses cache)
    }
  }, [brandSlug, displayBrandName, fetchBrandProducts, fetchCurrencyData]); // Dependencies

  // Effect to fetch subsequent pages for infinite scroll
  useEffect(() => {
    // Fetch next product page only if it's not the initial load (page > 1)
    // and brandSlug is available
    if (page > 1 && brandSlug) {
      console.log('Fetching next page effect running for:', displayBrandName, 'Page:', page);
      fetchBrandProducts(brandSlug, page);
    }
  }, [page, brandSlug, displayBrandName, fetchBrandProducts]); // Dependencies

  // Effect for Intersection Observer
  useEffect(() => {
    if (!loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // Load next page only if intersecting, not currently loading products, and more exist
        if (entry.isIntersecting && !isLoading && hasMore) {
          console.log('Intersection observer triggered: loading next page');
          setPage((prevPage) => prevPage + 1);
        }
      },
      { rootMargin: '400px' } // Load when 400px away from viewport bottom
    );

    const currentRef = loadingRef.current;
    if (currentRef) {
      // Check if ref is still valid before observing
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLoading, hasMore]); // Depends on product loading state and availability

  // --- Render Logic ---

  return (
    <div className="text-white p-4 md:p-6 lg:p-8 min-h-screen ">
      {/* Page Title */}
      <h1 className="text-2xl md:text-3xl font-bold mb-6 animate-fade-in-up capitalize" style={{ animationDelay: '0.1s' }}>
        {displayBrandName || 'Brand'} Products {/* Show display name */}
      </h1>

      {/* Persistent Error Display Area */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm whitespace-pre-line">
          <p className="font-semibold">Error encountered:</p>
          {error}
          {/* Specific Retry Buttons */}
          {error.includes('currency') && (
            <button
              onClick={() => fetchCurrencyData(true)} // Force refetch on retry
              className="mt-2 ml-2 px-3 py-1 text-xs bg-red-700 rounded hover:bg-red-600 transition-colors duration-200 text-white"
            >
              Retry Currency
            </button>
          )}
          {error.includes('products') && (
            <button
              // Retry the *last attempted* page or page 1 if products array is empty
              onClick={() => fetchBrandProducts(brandSlug, products.length > 0 ? page : 1)}
              className="mt-2 ml-2 px-3 py-1 text-xs bg-red-700 rounded hover:bg-red-600 transition-colors duration-200 text-white"
            >
              Retry Products
            </button>
          )}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4 text-xs">
        {/* Initial Loading State Skeletons */}
        {isInitialLoad &&
          isLoading &&
          !error && // Show skeletons only on initial load without error
          Array.from({ length: NUM_RESULTS_PER_PAGE }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}

        {/* Render Products */}
        {products.map((item, index) => (
          <ProductCard
            key={`${item.data.id}-${index}`} // Add index for potential duplicate IDs across pages if API isn't perfect
            item={item}
            priority={index < 10} // Prioritize first ~10 images
            mntRate={mntRate}
          />
        ))}
      </div>

      {/* Message when no products are found for the brand */}
      {!isLoading && !isInitialLoad && products.length === 0 && !error && (
        <div className="text-center text-neutral-400 mt-10">
            {/* FIX: Use &quot; for double quotes */}
          <p>No products found for &quot;{displayBrandName}&quot;.</p>
        </div>
      )}

      {/* Loading/Error/End Indicators & Observer Trigger */}
      {/* Ensure ref div is always rendered (conditionally show content inside) */}
      <div ref={loadingRef} className="h-20 flex justify-center items-center mt-8">
        {/* Loading more products indicator */}
        {isLoading && !isInitialLoad && (
          <div className="flex items-center space-x-2 text-neutral-400">
            <svg className="animate-spin h-5 w-5 text-neutral-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading more {displayBrandName} products...</span>
          </div>
        )}

        {/* End of List Message */}
        {!hasMore && !isLoading && products.length > 0 && !error && (
          <div className="text-center text-neutral-500">
            {/* FIX: Use &apos; for single quote */}
            <p>You&apos;ve reached the end!</p>
          </div>
        )}

        {/* Currency Loading Indicator (Subtle) */}
        {isCurrencyLoading && (
          <div className="text-xs text-neutral-500 fixed bottom-2 right-2" title="Updating currency exchange rate">
            <span>Rate updating...</span>
          </div>
        )}
      </div>

      {/* Minimal Global Styles */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
