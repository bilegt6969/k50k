'use client';

// Import 'use' hook from React for resolving promises in Client Components
import React, { useState, useEffect, useCallback, useRef, memo, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Import the response types defined in the API route - FIXED PATH
import type { ApiResponse, ApiProduct } from '../../../api/collections/[slug]/route';

// --- Interface Definitions ---

// Interface for product data stored in the page's state
interface ItemData {
  id: string;
  slug: string; // Product-specific slug for linking
  image_url: string;
  lowest_price_cents: number; // Changed to cents to match search page
}

// Interface for the item structure used in the page's state
interface Item {
  data: ItemData;
  value: string; // Product name
}

// --- Define PageProps Interface for Next.js 15+ ---
// Params is now a Promise containing the actual parameters object
interface PageProps {
  params: Promise<{ slug: string }>;
  // searchParams would also be a Promise if used
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// --- In-Memory Cache for Currency Rate ---
interface HomeCache {
  mntRate: number | null;
  timestamp: number | null;
}

const homeCache: HomeCache = { mntRate: null, timestamp: null };
const CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes
const RESULTS_PER_PAGE = 24; // Match search page

const isCacheValid = (cacheTimestamp: number | null): boolean => {
  if (!cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_DURATION_MS;
};

// --- Helper Utility Functions ---

// Updated to match search page price rendering
const renderPriceHelper = (
  priceCents: number | null | undefined,
  mntRate: number | null,
): string => {
  if (priceCents === null || priceCents === undefined) return 'N/A';
  if (mntRate === null) return '...';
  if (priceCents === 0) return 'Unavailable';
  const price = (priceCents * mntRate) / 100;
  return `₮${Math.ceil(price).toLocaleString('en-US')}`;
};

// Text replacer to match search page
const replaceText = (text: string): string => {
  try {
    return String(text || '')
      .replace(/GOAT/gi, 'sainto')
      .replace(/Canada/gi, 'MONGOLIA');
  } catch (e) {
    console.error('Error replacing text:', text, e);
    return text || '';
  }
};

// --- Skeleton Components (from Search Page) ---

const ProductCardSkeleton = () => (
  <div className="text-white bg-black border border-neutral-700 rounded tracking-tight relative h-full flex flex-col animate-pulse group">
    {/* Mobile-like top bar placeholder for price */}
    <div className="block md:hidden p-2 bg-neutral-800 border-b border-neutral-700">
      <div className="h-4 w-1/2 mx-auto bg-neutral-700 rounded"></div>
    </div>

    {/* Image Area */}
    <div
      className="overflow-hidden relative flex-grow bg-neutral-800 md:rounded-none rounded-b-lg"
      style={{ aspectRatio: '1 / 1' }}
    ></div>

    {/* Bottom Info Bar */}
    {/* Desktop Bottom Bar */}
    <div className="hidden md:flex w-full text-xs font-bold items-center p-4 border-t border-neutral-700 justify-between relative">
      <div className="h-4 bg-neutral-700 rounded w-2/3 mr-4"></div>
      <div className="h-8 w-[90px] bg-neutral-700 rounded-full"></div>
    </div>

    {/* Mobile Bottom Bar */}
    <div className="block md:hidden w-full text-xs font-bold p-3 border-t border-neutral-700 text-center">
      <div className="h-4 bg-neutral-700 rounded w-3/4 mx-auto"></div>
    </div>
  </div>
);

const CollectionSkeleton = ({ count = 24 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-2">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

// --- Product Card Components (from Search Page) ---

interface ProductCardProps {
  product: Item;
  mntRate: number | null;
  replaceText: (text: string) => string;
  index: number;
}

// --- Desktop Product Card ---
const DesktopProductCard = memo(
  ({ product, mntRate, replaceText, index }: ProductCardProps) => {
    const priority = index < 5; // Prioritize first 5 images for LCP

    const productLink = product.data.slug ? `/product/${product.data.slug}` : '#';
    const productName = product.value || 'Untitled Product';
    const productImageUrl = product.data.image_url;
    const priceDisplay = renderPriceHelper(product.data.lowest_price_cents, mntRate);
    const isUnavailable = product.data.lowest_price_cents === 0;

    return (
      <Link
        href={productLink}
        passHref
        className={`block h-full ${!product.data.slug ? 'pointer-events-none' : ''}`}
      >
        <div className="text-white bg-black border border-neutral-700 rounded tracking-tight relative cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-neutral-600  h-full flex flex-col group">
          <div
            className="overflow-hidden relative flex-grow"
            style={{ aspectRatio: '1 / 1' }}
          >
            {productImageUrl ? (
              <Image
                className="mx-auto transition-transform duration-500 group-hover:scale-110 object-contain"
                src={productImageUrl}
                alt={replaceText(productName)}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, (max-width: 1536px) 25vw, 20vw"
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500 text-xs';
                    placeholder.innerText = 'Image Error';
                    parent.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500 text-xs">
                No Image
              </div>
            )}
          </div>
          <div className="w-full text-xs font-bold flex items-center p-4 border-t border-neutral-700 justify-between relative transition-colors duration-300 group-hover:border-neutral-500">
            <span className="truncate pr-2">{replaceText(productName)}</span>
            <div
              className={`py-2 px-2 rounded-full whitespace-nowrap transition-all duration-300 ease-out min-w-[90px] text-center relative overflow-hidden ${
                isUnavailable
                  ? 'bg-neutral-800 border border-neutral-700 text-neutral-400'
                  : 'bg-neutral-800 backdrop-brightness-90 border border-neutral-700 group-hover:bg-neutral-600 group-hover:border-neutral-500'
              }`}
            >
              {isUnavailable ? (
                <span className="block">Unavailable</span>
              ) : (
                <>
                  <span className="block group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300">
                    {priceDisplay}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    View
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  },
);
DesktopProductCard.displayName = 'DesktopProductCard';

// --- Mobile Product Card ---
const MobileProductCard = memo(
  ({ product, mntRate, replaceText, index }: ProductCardProps) => {
    const priority = index < 4; // Prioritize first 4 for mobile (2 rows)

    const productLink = product.data.slug ? `/product/${product.data.slug}` : '#';
    const productName = product.value || 'Untitled Product';
    const productImageUrl = product.data.image_url;
    const priceDisplay = renderPriceHelper(product.data.lowest_price_cents, mntRate);
    const isUnavailable = product.data.lowest_price_cents === 0;

    return (
      <Link
        href={productLink}
        passHref
        className={`block h-full ${!product.data.slug ? 'pointer-events-none' : ''}`}
      >
        <div className="text-white bg-black border border-neutral-700 rounded tracking-tight relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-neutral-600 h-full flex flex-col group">
          {/* Top bar for price on mobile */}
          <div className="block w-full text-xs font-bold flex items-center p-2 bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-700">
            <span className="block w-full text-center">
              {isUnavailable ? 'Unavailable' : priceDisplay}
            </span>
          </div>
          <div
            className="overflow-hidden rounded-b-lg relative flex-grow"
            style={{ aspectRatio: '1 / 1' }}
          >
            {productImageUrl ? (
              <Image
                className="rounded-b-lg mx-auto transition-transform duration-500 group-hover:scale-110 object-contain"
                src={productImageUrl}
                alt={replaceText(productName)}
                fill
                unoptimized
                sizes="50vw"
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500 text-xs rounded-b-lg';
                    placeholder.innerText = 'Image Error';
                    parent.appendChild(placeholder);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500 text-xs rounded-b-lg">
                No Image
              </div>
            )}
          </div>
          {/* Bottom bar for name on mobile */}
          <div className="w-full text-xs font-bold flex items-center p-3 border-t border-neutral-700 justify-center text-center relative group-hover:border-neutral-500 transition-colors duration-300">
            <span className="truncate">{replaceText(productName)}</span>
          </div>
        </div>
      </Link>
    );
  },
);
MobileProductCard.displayName = 'MobileProductCard';

// --- Main Collection Page Component ---

// Accept props according to the PageProps interface (params is a Promise)
export default function CollectionPage(props: PageProps) {
  // Use the 'use' hook to resolve the params Promise in a Client Component
  const resolvedParams = use(props.params);
  const { slug: collectionSlug } = resolvedParams;

  // State management
  const [products, setProducts] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [mntRate, setMntRate] = useState<number | null>(null);
  const [totalResults, setTotalResults] = useState<number | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  // --- Fetch Currency Data Function ---
  const fetchCurrencyData = useCallback(async () => {
    // Check cache first
    if (isCacheValid(homeCache.timestamp) && homeCache.mntRate !== null) {
      if (mntRate !== homeCache.mntRate) {
        setMntRate(homeCache.mntRate);
      }
      return homeCache.mntRate;
    }

    try {
      const res = await fetch('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const currencyResult = await res.json();
      if (currencyResult.status_code === 200 && currencyResult.data?.mid) {
        const rate = currencyResult.data.mid;
        setMntRate(rate);
        homeCache.mntRate = rate;
        homeCache.timestamp = Date.now();
        return rate;
      } else {
        console.warn('MNT rate not available or invalid format from API');
      }
    } catch (err) {
      console.error('Currency fetch error:', err);
      setError((prevError) =>
        prevError
          ? `${prevError}\nFailed to load currency rate.`
          : 'Failed to load currency rate.',
      );
    }
  }, [mntRate]);

  // --- Fetch Products Function ---
  const fetchProducts = useCallback(
    async (pageNum: number): Promise<{ results: Item[]; hasMore: boolean; totalResults?: number } | null> => {
      if (!collectionSlug) {
        setError('Collection identifier is missing.');
        return null;
      }

      const apiUrl = `/api/collections/${collectionSlug}?page=${pageNum}`;
      try {
        const res = await fetch(apiUrl);
        const data: ApiResponse = await res.json();

        if (!res.ok || data.error) {
          const message = data.error || `API Error: ${res.status}`;
          throw new Error(message);
        }

        // Map ApiProduct to Item and convert dollars to cents
        const newItems: Item[] = data.products.map((product: ApiProduct): Item => ({
          value: product.name,
          data: {
            id: product.id,
            slug: product.slug,
            image_url: product.image,
            lowest_price_cents: Math.round(product.price * 100), // Convert dollars to cents
          },
        }));

        return {
          results: newItems,
          hasMore: data.hasMore,
          totalResults: data.total, // FIXED: Use 'total' instead of 'totalResults'
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during fetch';
        console.error('Fetch Products Error:', message);
        setError(message);
        return null;
      }
    },
    [collectionSlug],
  );

  const loadMoreProducts = useCallback(async () => {
    if (!collectionSlug || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const response = await fetchProducts(nextPage);

    if (response) {
      if (response.results.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map(p => p.data.id));
          const uniqueNewItems = response.results.filter(item => !existingIds.has(item.data.id));
          return [...prev, ...uniqueNewItems];
        });
        setPage(nextPage);
        setError(null);
      }
      setHasMore(response.hasMore && response.results.length > 0);
    }
    setIsLoadingMore(false);
  }, [collectionSlug, page, hasMore, fetchProducts, isLoadingMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isInitialLoad || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMoreProducts();
          }
        },
        { threshold: 0.5 },
      );

      if (node) observer.current.observe(node);
    },
    [isInitialLoad, isLoadingMore, hasMore, loadMoreProducts],
  );

  // --- Initial Data Load Effect ---
  useEffect(() => {
    const loadInitialData = async () => {
      if (!collectionSlug) {
        setProducts([]);
        setIsInitialLoad(false);
        setHasMore(false);
        setTotalResults(0);
        setError('Collection identifier is missing.');
        return;
      }

      setIsInitialLoad(true);
      setProducts([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setTotalResults(null);

      const response = await fetchProducts(1);

      if (response) {
        setProducts(response.results);
        setHasMore(response.hasMore && response.results.length > 0);
        if (response.totalResults !== undefined) {
          setTotalResults(response.totalResults);
        }
      } else {
        setHasMore(false);
      }
      setIsInitialLoad(false);
    };

    loadInitialData();
    fetchCurrencyData();
  }, [collectionSlug, fetchProducts, fetchCurrencyData]);

  // Generate collection title
  const collectionTitle = collectionSlug ? collectionSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Collection';

  // Results count text
  let resultsCountText = '';
  if (!isInitialLoad && totalResults !== null) {
    resultsCountText = `${totalResults.toLocaleString()} product${totalResults !== 1 ? 's' : ''}`;
  } else if (!isInitialLoad && products.length > 0 && !totalResults) {
    resultsCountText = `${products.length.toLocaleString()}${hasMore ? '+' : ''} products`;
  }

  return (
    <div className="min-h-screen text-white p-0 md:p-0">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-6 md:mb-8">
          {collectionTitle}
        </h1>

        {isInitialLoad && (
          <>
            {/* Skeleton for results count */}
            <div className="h-4 w-1/3 md:w-1/4 bg-neutral-700 rounded mb-4 animate-pulse"></div>
            <CollectionSkeleton count={RESULTS_PER_PAGE} />
          </>
        )}

        {!isInitialLoad && error && products.length === 0 && (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Collection</h2>
            <p className="text-neutral-400">{error}</p>
          </div>
        )}

        {!isInitialLoad && !error && products.length === 0 && (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold text-neutral-300 mb-2">No Products Found</h2>
            <p className="text-neutral-500">
              This collection appears to be empty or unavailable.
            </p>
          </div>
        )}

        {!isInitialLoad && products.length > 0 && (
          <>
            {resultsCountText && (
              <p className="text-neutral-400 text-sm mb-4">{resultsCountText}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-2">
              {products.map((item, idx) => (
                <div key={item.data.id || `product-${idx}`}>
                  <div className="block md:hidden h-full">
                    <MobileProductCard
                      product={item}
                      mntRate={mntRate}
                      replaceText={replaceText}
                      index={idx}
                    />
                  </div>
                  <div className="hidden md:block h-full">
                    <DesktopProductCard
                      product={item}
                      mntRate={mntRate}
                      replaceText={replaceText}
                      index={idx}
                    />
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div
                ref={sentinelRef}
                style={{ height: '50px', width: '100%' }}
                aria-hidden="true"
              ></div>
            )}
          </>
        )}

        {isLoadingMore && (
          <div className="text-center my-8 flex justify-center items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-300"></div>
            <p className="text-neutral-400">Loading more...</p>
          </div>
        )}

        {!isLoadingMore && error && products.length > 0 && !error.includes('currency rate') && (
          <div className="text-center my-8">
            <p className="text-red-400">Error loading more: {error.replace('API Error: ', '')}</p>
          </div>
        )}

        {!isInitialLoad && !isLoadingMore && !hasMore && products.length > 0 && (
          <div className="text-center my-8">
            <p className="text-neutral-500">You&apos;ve reached the end of the collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}