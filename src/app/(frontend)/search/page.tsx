'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense, useRef, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const RESULTS_PER_PAGE = 12;

// --- Interfaces ---
interface ProductVariant {
  id?: string;
  size?: string;
  lowest_ask?: number;
  currency?: string;
  available?: boolean;
  [key: string]: unknown;
}

interface Product {
  id: string | number;
  slug: string;
  image_url?: string;
  pictureUrl?: string;
  image?: string;
  title?: string;
  name?: string;
  brand?: string;
  /** When set (e.g. Sanity catalog), price is already in MNT — skip USD × rate conversion. */
  priceMnt?: number;
  sku?: string;
  colorway?: string;
  product_type?: string;
  category?: string;
  description?: string;
  release_date?: string;
  retail_prices?: any;
  variants?: ProductVariant[];
  rank?: number;
  weekly_orders?: number;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
  link?: string;
  [key: string]: unknown;
}

interface ApiResponse {
  success: boolean;
  data?: {
    products: Product[];
    hasMore: boolean;
    totalCount: number;
    marketplace?: string;
    currentPage?: number;
    perPage?: number;
  };
  meta?: {
    query: string | null;
    filters: string | null;
    sort: string;
    market: string;
  };
  error?: string;
}

interface FetchDataResponse {
  results: Product[];
  hasMore: boolean;
  totalResults: number;
}

// --- Editable Query Component ---
interface EditableQueryProps {
  initialQuery: string;
  onCommit: (newQuery: string) => void;
}

const EditableQuery = ({ initialQuery, onCommit }: EditableQueryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && trimmedValue !== initialQuery) {
      onCommit(trimmedValue);
    } else {
      setValue(initialQuery);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setValue(initialQuery);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0"
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </motion.div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="text-[56px] sm:text-[72px] font-semibold tracking-tight text-gray-900 outline-none bg-transparent border-b-2 border-blue-500 px-2"
          style={{ 
            minWidth: '2ch',
            letterSpacing: '-0.022em',
            width: `${Math.max(value.length, 2)}ch`
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className="inline-flex items-center gap-3 group cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20
        }}
        className="flex-shrink-0"
      >
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-400 group-hover:text-gray-600 transition-colors"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </motion.div>

      <motion.div
        whileHover={{
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          scale: 1.01,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25
        }}
        className="relative rounded-2xl px-4 py-2 -mx-4 -my-2 border-2 border-transparent group-hover:border-gray-200"
      >
        <span
          className="text-[56px] sm:text-[72px] font-semibold tracking-tight text-gray-900"
          style={{ letterSpacing: '-0.022em' }}
        >
          {initialQuery}
        </span>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium"
        >
          Click to edit
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- Skeleton Components ---
const ProductCardSkeleton = () => (
  <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 backdrop-blur-sm">
    <div className="w-full bg-gray-100 animate-pulse" style={{ aspectRatio: '1 / 1' }}></div>
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded-full w-4/5 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded-full w-2/5 animate-pulse" style={{ animationDelay: '75ms' }}></div>
    </div>
  </div>
);

const SearchResultsSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} style={{ animationDelay: `${index * 50}ms` }}>
        <ProductCardSkeleton />
      </div>
    ))}
  </div>
);

// --- Product Card Component ---
interface ProductCardProps {
  product: Product;
  mntRate: number | null;
  index: number;
}

const ProductCard = memo(({ product, mntRate, index }: ProductCardProps) => {
  const priority = index < 6;
  const productLink = product.slug ? `/product/${product.slug}` : '#';
  const productName = product.title || product.name || 'Untitled Product';
  const productImageUrl = product.image_url || product.pictureUrl || product.image || '';

  const priceMntDirect =
    typeof product.priceMnt === 'number' && Number.isFinite(product.priceMnt) && product.priceMnt > 0
      ? Math.round(product.priceMnt)
      : null;

  // Kick API products: USD-style lowest ask
  let priceUSD = 0;
  if (priceMntDirect === null) {
    if (product.min_price && product.min_price > 0) {
      priceUSD = product.min_price;
    } else if (product.variants && product.variants.length > 0) {
      const lowestVariant = product.variants
        .filter((v) => v.lowest_ask && v.lowest_ask > 0)
        .sort((a, b) => (a.lowest_ask || 0) - (b.lowest_ask || 0))[0];
      if (lowestVariant?.lowest_ask) {
        priceUSD = lowestVariant.lowest_ask;
      }
    }
  }

  const formattedPrice =
    priceMntDirect !== null
      ? `₮ ${priceMntDirect.toLocaleString('en-US')}`
      : priceUSD > 0 && mntRate !== null
        ? `₮ ${Math.ceil(priceUSD * mntRate).toLocaleString('en-US')}`
        : mntRate === null && priceUSD > 0
          ? '...'
          : priceUSD === 0 && priceMntDirect === null
            ? 'Unavailable'
            : 'Unavailable';

  const rawPrice = priceUSD > 0 ? `$${priceUSD.toFixed(2)}` : '';

  const showHoverUsd = priceMntDirect === null && priceUSD > 0 && mntRate !== null;

  return (
    <Link 
      href={productLink} 
      passHref 
      target="_blank"
      rel="noopener noreferrer"
      className={`block ${!product.slug ? 'pointer-events-none' : ''}`}
    >
      <div className="text-black border bg-white border-neutral-200 rounded-xs shadow-xs tracking-tight relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-neutral-100/50 hover:border-neutral-300 h-full flex flex-col group">
        <div className="overflow-hidden bg-white rounded-t- relative flex-grow" style={{ aspectRatio: '1 / 1' }}>
          {productImageUrl ? (
            <Image
              className="rounded-t- mx-auto transition-transform bg-white duration-500 group-hover:scale-110 object-contain"
              src={productImageUrl}
              alt={productName}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100">
              <div className="text-neutral-300 text-sm font-medium">No Image</div>
            </div>
          )}
        </div>
        <div className="w-full text-xs font-bold flex items-start p-4 border-t border-neutral-200 justify-between transition-colors duration-300 group-hover:border-neutral-300">
          <span
            className="pr-2 leading-tight line-clamp-2 overflow-hidden text-ellipsis"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.2',
              maxHeight: '2.4em',
            }}
          >
            {productName}
          </span>

          {formattedPrice === 'Unavailable' || formattedPrice === '...' ? (
            formattedPrice === '...' ? (
              <div className="py-2 px-2 rounded-full whitespace-nowrap min-w-[90px] text-center bg-neutral-100 border border-neutral-200 flex-shrink-0">
                <span className="text-neutral-500">...</span>
              </div>
            ) : (
              <div className="py-2 px-2 rounded-full whitespace-nowrap min-w-[90px] text-center bg-neutral-100 border border-neutral-200 flex-shrink-0">
                <span className="text-neutral-500">Unavailable</span>
              </div>
            )
          ) : (
            <div className="relative py-2 px-2 rounded-full whitespace-nowrap transition-all duration-300 min-w-[90px] text-center bg-neutral-100 border border-neutral-200 group-hover:bg-neutral-200 group-hover:border-neutral-300 flex-shrink-0">
              <span
                className={`block transition-all duration-300 ${showHoverUsd ? 'group-hover:opacity-0 group-hover:-translate-y-2' : ''}`}
              >
                {formattedPrice}
              </span>
              {showHoverUsd ? (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {rawPrice}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});
ProductCard.displayName = 'ProductCard';

// --- Main Search Page Component ---
const SearchPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('query');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [mntRate, setMntRate] = useState<number | null>(null);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [tempFilters, setTempFilters] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterPosition, setFilterPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fadeIn {
        animation: fadeIn 0.6s ease-out;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      @media (prefers-reduced-motion: reduce) {
        .animate-fadeIn,
        .transition-all,
        .transition-colors,
        .transition-transform {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Sync tempFilters with appliedFilters when opening panel
  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters(appliedFilters);
    }
  }, [isFilterOpen, appliedFilters]);

  // Filter panel positioning
  useEffect(() => {
    if (isFilterOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const panelWidth = 360;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let leftPosition = rect.left + (rect.width / 2) - (panelWidth / 2);
      
      const padding = 16;
      if (leftPosition < padding) {
        leftPosition = padding;
      } else if (leftPosition + panelWidth > viewportWidth - padding) {
        leftPosition = viewportWidth - panelWidth - padding;
      }
      
      const maxPanelHeight = Math.min(600, viewportHeight - padding * 2);
      const spaceBelow = viewportHeight - rect.bottom - padding;
      const spaceAbove = rect.top - padding;
      
      let topPosition = rect.bottom + padding;
      
      if (spaceBelow < maxPanelHeight && spaceAbove > spaceBelow) {
        topPosition = Math.max(padding, rect.top - maxPanelHeight - padding);
      } else if (spaceBelow < maxPanelHeight) {
        topPosition = padding;
      }
      
      setFilterPosition({
        top: topPosition,
        left: leftPosition
      });
    }
  }, [isFilterOpen]);

  // Click outside handler for filter panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isFilterOpen &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const handleQueryCommit = useCallback((newQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('query', newQuery);
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const updateTempFilter = useCallback((key: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const removeTempFilter = useCallback((key: string) => {
    setTempFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(tempFilters);
    setIsFilterOpen(false);
  }, [tempFilters]);

  const clearAllFilters = useCallback(() => {
    setTempFilters({});
    setAppliedFilters({});
  }, []);

  const fetchData = useCallback(
    async (
      pageNum: number,
      currentQuery: string | null,
      filters: Record<string, string>,
    ): Promise<FetchDataResponse | null> => {
      const url = new URL('/api/search/library', window.location.origin);
      url.searchParams.set('query', (currentQuery ?? '').trim());
      url.searchParams.set('page', String(pageNum));
      url.searchParams.set('page_limit', String(RESULTS_PER_PAGE));

      const brand = (filters.brand || '').trim();
      if (brand) url.searchParams.set('brand', brand);
      const pt = (filters.product_type || '').trim();
      if (pt) url.searchParams.set('product_type', pt);
      const sku = (filters.sku || '').trim();
      if (sku) url.searchParams.set('sku', sku);
      const colorway = (filters.colorway || '').trim();
      if (colorway) url.searchParams.set('colorway', colorway);

      try {
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const result: ApiResponse = await response.json();
        if (!result.success) throw new Error(result.error || 'Search request failed');
        if (!result.data) throw new Error('No data received from search API');

        return {
          results: result.data.products as Product[],
          hasMore: result.data.hasMore,
          totalResults: result.data.totalCount,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during fetch';
        console.error('Fetch Data Error:', message);
        setError(message);
        return null;
      }
    },
    [],
  );

  const loadMoreProducts = useCallback(async () => {
    const q = (query ?? '').trim();
    const hasRefinement = Object.values(appliedFilters).some((v) => (v || '').trim().length > 0);
    if ((!q && !hasRefinement) || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    const response = await fetchData(nextPage, query, appliedFilters);
    if (response) {
      if (response.results.length > 0) {
        setProducts((prev) => [...prev, ...response.results]);
        setPage(nextPage);
        setError(null);
      }
      setHasMore(response.hasMore && response.results.length > 0);
    }
    setIsLoadingMore(false);
  }, [query, appliedFilters, page, hasMore, fetchData, isLoadingMore]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) loadMoreProducts();
        },
        { threshold: 0.5 },
      );
      if (node) observer.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore, loadMoreProducts],
  );

  useEffect(() => {
    const fetchCurrencyData = async () => {
      try {
        const res = await fetch('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const currencyResult = await res.json();
        if (currencyResult.status_code === 200 && currencyResult.data?.mid) {
          setMntRate(currencyResult.data.mid);
        }
      } catch (err) {
        console.error('Currency fetch error:', err);
      }
    };
    fetchCurrencyData();
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setProducts([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setTotalResults(null);
      const response = await fetchData(1, query, appliedFilters);
      if (response) {
        setProducts(response.results);
        setHasMore(response.hasMore && response.results.length > 0);
        if (response.totalResults !== undefined) setTotalResults(response.totalResults);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    };
    loadInitialData();
  }, [query, fetchData, appliedFilters]);

  const filterPanelContent = (
    <AnimatePresence>
      {isFilterOpen && (
        <motion.div
          ref={filterPanelRef}
          initial={{ opacity: 0, y: -20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 22,
            mass: 0.6,
            opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed z-[150] w-[360px] rounded-[28px] flex flex-col"
          style={{
            top: `${filterPosition.top}px`,
            left: `${filterPosition.left}px`,
            maxHeight: 'calc(100vh - 32px)',
            background: 'rgba(20, 20, 20, 0.78)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            {Object.keys(tempFilters).length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllFilters}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Clear all
              </motion.button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-4" style={{ maxHeight: '400px' }}>
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <label className="block text-sm font-semibold text-white/90 mb-2.5">
                  Brand
                </label>
                <input
                  type="text"
                  value={tempFilters.brand || ''}
                  onChange={(e) => updateTempFilter('brand', e.target.value)}
                  placeholder="e.g., Nike, Adidas"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40
                    focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all text-sm"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-semibold text-white/90 mb-2.5">
                  Product Type
                </label>
                <select
                  value={tempFilters.product_type || ''}
                  onChange={(e) => updateTempFilter('product_type', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white
                    focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all text-sm"
                >
                  <option value="" className="bg-gray-900">All Types</option>
                  <option value="sneakers" className="bg-gray-900">Sneakers</option>
                  <option value="apparel" className="bg-gray-900">Apparel</option>
                  <option value="accessories" className="bg-gray-900">Accessories</option>
                  <option value="collectibles" className="bg-gray-900">Collectibles</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-white/90 mb-2.5">
                  Colorway
                </label>
                <input
                  type="text"
                  value={tempFilters.colorway || ''}
                  onChange={(e) => updateTempFilter('colorway', e.target.value)}
                  placeholder="e.g., Black/White"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40
                    focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all text-sm"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="block text-sm font-semibold text-white/90 mb-2.5">
                  SKU
                </label>
                <input
                  type="text"
                  value={tempFilters.sku || ''}
                  onChange={(e) => updateTempFilter('sku', e.target.value)}
                  placeholder="e.g., DZ5485-612"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/40
                    focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all text-sm"
                />
              </motion.div>

              {Object.keys(tempFilters).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-5 border-t border-white/10"
                >
                  <p className="text-xs font-semibold text-white/60 mb-3">Active Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tempFilters).map(([key, value]) => (
                      <motion.button
                        key={key}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeTempFilter(key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                          bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors border border-blue-400/20"
                      >
                        {key}: {value}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="p-6 pt-4 flex-shrink-0 border-t border-white/10">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={applyFilters}
              className="w-full px-6 py-3 rounded-full font-semibold text-white text-sm
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                shadow-lg shadow-blue-500/30 transition-all"
            >
              Apply Filters
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="mb-14">
          {query ? (
            <div className="mb-12">
              <EditableQuery initialQuery={query} onCommit={handleQueryCommit} />
              {totalResults !== null && (
                <p className="text-gray-500 text-[17px] mt-4 font-medium">
                  {totalResults.toLocaleString()} {totalResults === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>
          ) : (
            <h1 className="text-[56px] sm:text-[72px] font-semibold tracking-tight text-gray-900 mb-8"
                style={{ letterSpacing: '-0.022em' }}>
              Search
            </h1>
          )}

          <div className="flex items-center gap-2 mb-8">
            <button 
              ref={filterButtonRef}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-[15px] font-medium
              text-gray-700 hover:bg-gray-100 hover:text-gray-900 
              transition-all duration-200 ease-out"
              style={{
                backgroundColor: isFilterOpen ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: isFilterOpen ? 'rgb(59, 130, 246)' : undefined,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="18" x2="14" y2="18"/>
              </svg>
              Filter
              {Object.keys(appliedFilters).length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold"
                >
                  {Object.keys(appliedFilters).length}
                </motion.span>
              )}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[15px] font-medium
              text-gray-700 hover:bg-gray-100 hover:text-gray-900 
              transition-all duration-200 ease-out">
              Sort
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="animate-fadeIn">
            <SearchResultsSkeleton count={RESULTS_PER_PAGE} />
          </div>
        )}

        {!isLoading && error && products.length === 0 && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-gray-600 text-[17px] font-medium">{error}</p>
          </div>
        )}

        {!isLoading && !error && products.length === 0 && query && (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h2 className="text-[28px] font-semibold text-gray-900 mb-2 tracking-tight">No results found</h2>
            <p className="text-gray-500 text-[17px]">Try adjusting your search or filters</p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fadeIn">
              {products.map((item, idx) => (
                <ProductCard
                  key={item.id || `product-${idx}`}
                  product={item}
                  mntRate={mntRate}
                  index={idx}
                />
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} style={{ height: '50px', width: '100%' }} aria-hidden="true"></div>}
          </>
        )}

        {isLoadingMore && (
          <div className="text-center my-16 flex justify-center items-center">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">
              <div className="w-5 h-5 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-gray-700 text-[15px] font-medium">Loading more</span>
            </div>
          </div>
        )}

        {!isLoading && !isLoadingMore && !hasMore && products.length > 0 && (
          <div className="text-center my-16">
            <div className="inline-block px-6 py-3 bg-gray-50 rounded-full">
              <p className="text-gray-500 text-[15px] font-medium">You've reached the end</p>
            </div>
          </div>
        )}
      </div>

      {isMounted && typeof window !== 'undefined' && createPortal(
        filterPanelContent,
        document.body
      )}

      {/* Catalog scope hint (Sanity published products only) */}
      <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
        <div className="rounded-full border border-neutral-200/80 bg-white/95 px-5 py-2.5 text-sm font-medium text-neutral-600 shadow-lg backdrop-blur-md">
          Searching store catalog
        </div>
      </div>
    </div>
  );
};

const SearchPageWithSuspense = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
          <div className="h-20 w-80 bg-gray-100 rounded-2xl mb-12 animate-pulse"></div>
          <div className="h-14 w-full bg-gray-100 rounded-full mb-16 animate-pulse"></div>
          <SearchResultsSkeleton count={RESULTS_PER_PAGE} />
        </div>
      </div>
    }
  >
    <SearchPage />
  </Suspense>
);

export default SearchPageWithSuspense;