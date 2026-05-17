'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from 'react';
import { useProductContext } from '../../context/ProductContext';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, AlertCircle, Heart } from 'lucide-react';

// ────────────────────────────────────────────────
//  Constants
// ────────────────────────────────────────────────
const INITIAL_SECTIONS_TO_LOAD = 3;
const INTERSECTION_THRESHOLD = 0.05;
const INTERSECTION_ROOT_MARGIN = '100px';

function normalizePriceToMnt(rawPrice: number): number {
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return 0;
  // Guard for mixed legacy units (MNT and MNT*100).
  if (rawPrice >= 10_000_000 && rawPrice % 100 === 0) {
    return Math.round(rawPrice / 100);
  }
  return Math.round(rawPrice);
}

// ────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────
type SectionRefs = Record<string, React.RefObject<HTMLDivElement | null>>;

interface ApiProduct {
  id: string;
  name: string;
  brand?: string;
  image: string;
  slug: string;
  collection?: string;
  price?: number;
}

interface ApiResponse {
  products: ApiProduct[];
  collectionName: string;
  collectionSlug: string;
  hasMore: boolean;
  total: number;
  currentPage: number;
  totalPages: number;
  error?: string;
}

interface ItemData {
  id: string;
  slug: string;
  pictureUrl: string;
  title: string;
  brand?: string;
  category?: string;
  inStock: boolean;
  price?: number;
}

interface Item {
  data: ItemData;
  category: string;
  categoryUrl: string;
  collection: string;
}

interface CategoryImage {
  url: string;
  alt: string;
}

interface SanityCollectionDoc {
  _id: string;
  name: string;
  order: number;
  slug: string;
}

interface ProcessedSanityCategory {
  id: string;
  label: string;
  categoryUrl: string;
  images: CategoryImage[];
}

interface SanityProductCategoryUrlDoc {
  category?: string;
  order: number;
  el1?: { url1: string; url2?: string; url3?: string; label: string };
  el2?: { url1: string; url2?: string; url3?: string; label: string };
  el3?: { url1: string; url2?: string; url3?: string; label: string };
  el4?: { url1: string; url2?: string; url3?: string; label: string };
}

interface ProductScrollerProps {
  items: Item[];
  ItemComponent: React.ElementType;
  renderPrice: (priceCents: number) => { default: string; hover: string };
  replaceText: (text: string) => string;
  itemBaseClassName: string;
  priorityStartIndex?: number;
}

interface HomeProps {
  trendingSectionDisplay?: React.ReactNode;
}

interface SectionState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

// ────────────────────────────────────────────────
//  Error Boundary
// ────────────────────────────────────────────────
class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionName: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; sectionName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Section error:', this.props.sectionName, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700 text-sm">Failed to load section</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ────────────────────────────────────────────────
//  Skeleton Components
// ────────────────────────────────────────────────
const SkeletonCard = memo(() => (
  <div className="h-full flex flex-col animate-pulse rounded-sm border border-neutral-200 bg-white">
    <div className="bg-neutral-200" style={{ aspectRatio: '1 / 1' }} />
    <div className="space-y-2 p-3">
      <div className="h-3.5 w-16 bg-neutral-200 rounded" />
      <div className="h-3 w-full bg-neutral-200 rounded" />
      <div className="flex justify-between pt-1">
        <div className="h-4 w-24 bg-neutral-200 rounded" />
        <div className="h-4 w-4 bg-neutral-200 rounded" />
      </div>
    </div>
  </div>
));
SkeletonCard.displayName = 'SkeletonCard';

const SkeletonCategoryCard = memo(() => (
  <div className="text-black rounded tracking-tight relative bg-neutral-100 border border-neutral-200 animate-pulse h-fit">
    <div className="w-full flex justify-between items-center text-xl font-bold bg-neutral-50 p-4 border-b border-neutral-200">
      <div className="h-6 bg-neutral-300 rounded w-1/2"></div>
      <div className="h-5 w-5 bg-neutral-300 rounded"></div>
    </div>
    <div className="relative overflow-hidden border border-neutral-200 bg-neutral-100" style={{ aspectRatio: '1 / 1' }}>
      <div className="absolute w-full h-full bg-neutral-300 rounded"></div>
    </div>
  </div>
));
SkeletonCategoryCard.displayName = 'SkeletonCategoryCard';

// ────────────────────────────────────────────────
//  Collection product card (homepage)
// ────────────────────────────────────────────────
interface CollectionProductCardProps {
  item: Item;
  renderPrice: (priceMnt: number) => { default: string; hover: string };
  replaceText: (text: string) => string;
  priority: boolean;
}

const CollectionProductCard = memo(
  ({ item, renderPrice, replaceText, priority }: CollectionProductCardProps) => {
    const priceInMnt = normalizePriceToMnt(Number(item.data.price));
    const prices = renderPrice(priceInMnt);
    const brandLabel = replaceText(item.data.brand || '').trim();

    return (
      <Link
        href={`/shop-all/${item.data.slug}`}
        passHref
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <div className="group flex h-full flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-md">
          <div className="relative overflow-hidden bg-white" style={{ aspectRatio: '1 / 1' }}>
            <Image
              className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              src={item.data.pictureUrl}
              alt={replaceText(item.data.title)}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-3">
            {brandLabel ? (
              <p className="text-sm font-bold uppercase leading-tight tracking-wide text-black">
                {brandLabel}
              </p>
            ) : null}
            <p className="truncate text-xs font-normal leading-snug text-black">
              {replaceText(item.data.title)}
            </p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="text-sm font-bold tabular-nums tracking-tight text-black">
                {prices.default}
              </span>
              <Heart className="h-4 w-4 shrink-0 stroke-[1.75] text-black" aria-hidden />
            </div>
          </div>
        </div>
      </Link>
    );
  }
);
CollectionProductCard.displayName = 'CollectionProductCard';

const DesktopItem = CollectionProductCard;
const MobileItem = CollectionProductCard;

// ────────────────────────────────────────────────
//  Category Card
// ────────────────────────────────────────────────
interface CategoryCardProps {
  label: string;
  categoryUrl: string;
  images: CategoryImage[];
  replaceText: (text: string) => string;
  priority: boolean;
}

const CategoryCard = memo(({ label, categoryUrl, images, replaceText, priority }: CategoryCardProps) => {
  const firstImage = images?.[0];
  const secondImage = images?.[1];
  const thirdImage = images?.[2];

  if (!firstImage) return null;

  return (
    <Link href={categoryUrl} passHref>
      <div className="text-black rounded-lg shadow-sm tracking-tight relative bg-white cursor-pointer transition-all duration-300 hover:shadow-md h-fit flex flex-col group">
        <div className="w-full flex justify-between items-center text-lg md:text-xl font-bold bg-gray-100 p-4 border-b border-neutral-200 group-hover:bg-neutral-100 transition-colors">
          <span className="truncate pr-2">{replaceText(label)}</span>
          <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 text-neutral-500 flex-shrink-0" />
        </div>
        <div className="relative overflow-hidden bg-black group-hover:bg-neutral-50 transition-colors duration-300" style={{ aspectRatio: '1 / 1' }}>
          {firstImage && (
            <div className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-start" style={{ zIndex: 1 }}>
              <div className="relative transition-transform duration-300 group-hover:scale-105" style={{ width: '130%', height: '130%' }}>
                <Image
                  className="object-contain w-full h-full"
                  src={firstImage.url}
                  alt={firstImage.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 30vw, 15vw"
                  priority={priority}
                  loading={priority ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          )}
          {secondImage && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
              <div className="relative transition-transform duration-300 group-hover:scale-110" style={{ width: '75%', height: '75%' }}>
                <Image
                  className="object-contain w-full h-full drop-shadow-md"
                  src={secondImage.url}
                  alt={secondImage.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 40vw, 20vw"
                  priority={priority}
                  loading={priority ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          )}
          {thirdImage && (
            <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end" style={{ zIndex: 1 }}>
              <div className="relative transition-transform duration-300 group-hover:scale-105" style={{ width: '130%', height: '130%' }}>
                <Image
                  className="object-contain w-full h-full"
                  src={thirdImage.url}
                  alt={thirdImage.alt}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 30vw, 15vw"
                  priority={priority}
                  loading={priority ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});
CategoryCard.displayName = 'CategoryCard';

// ────────────────────────────────────────────────
//  Product Scroller
// ────────────────────────────────────────────────
const ProductScroller = memo(
  ({
    items,
    ItemComponent,
    renderPrice,
    replaceText,
    itemBaseClassName,
    priorityStartIndex = 4,
  }: ProductScrollerProps) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollability = useCallback(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const tolerance = 2;
      const hasOverflowNow = el.scrollWidth > el.clientWidth + tolerance;
      setHasOverflow(hasOverflowNow);
      setCanScrollLeft(el.scrollLeft > tolerance);
      setCanScrollRight(
        hasOverflowNow && el.scrollLeft < el.scrollWidth - el.clientWidth - tolerance
      );
    }, []);

    useEffect(() => {
      const el = scrollerRef.current;
      if (!el) return;
      checkScrollability();
      const ro = new ResizeObserver(checkScrollability);
      ro.observe(el);
      el.addEventListener('scroll', checkScrollability, { passive: true });
      return () => {
        ro.unobserve(el);
        el.removeEventListener('scroll', checkScrollability);
      };
    }, [checkScrollability, items]);

    const scroll = (dir: 'left' | 'right') => {
      const el = scrollerRef.current;
      if (el) el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.5 : el.clientWidth * 0.5, behavior: 'smooth' });
    };

    if (items.length === 0) {
      return <p className="text-neutral-500 text-center py-4 col-span-full">No items found.</p>;
    }

    return (
      <div className="relative">
        {hasOverflow && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute top-1/2 left-4 -translate-y-1/2 z-20 p-2 rounded-full bg-neutral-100/80 backdrop-blur-lg border border-neutral-200 text-neutral-700 shadow-md hover:bg-neutral-200 hover:scale-105 active:scale-95 transition"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items
            .filter((i) => i?.data?.pictureUrl)
            .map((item, idx) => (
              <div
                key={item.data.id}
                className={`${itemBaseClassName} flex-shrink-0 snap-start p-0.5 md:p-1`}
              >
                <ItemComponent
                  item={item}
                  renderPrice={renderPrice}
                  replaceText={replaceText}
                  priority={idx < priorityStartIndex}
                />
              </div>
            ))}
        </div>

        {hasOverflow && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute top-1/2 right-4 -translate-y-1/2 z-20 p-2 rounded-full bg-neutral-100/80 backdrop-blur-lg border border-neutral-200 text-neutral-700 shadow-md hover:bg-neutral-200 hover:scale-105 active:scale-95 transition"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    );
  }
);
ProductScroller.displayName = 'ProductScroller';

// ────────────────────────────────────────────────
//  Skeleton Grid
// ────────────────────────────────────────────────
interface SkeletonGridProps {
  count: number;
  className: string;
  sectionId: string;
  isMobile?: boolean;
}

const SkeletonGrid = memo(({ count, className, sectionId, isMobile = false }: SkeletonGridProps) => (
  <div className="flex overflow-hidden pl-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={`${isMobile ? 'mob' : 'desk'}-${sectionId}-${i}`} className={`${className} p-1.5 flex-shrink-0`}>
        <SkeletonCard />
      </div>
    ))}
  </div>
));
SkeletonGrid.displayName = 'SkeletonGrid';

// ────────────────────────────────────────────────
//  MAIN HOME COMPONENT
// ────────────────────────────────────────────────
const Home = ({ trendingSectionDisplay }: HomeProps) => {
  const [sectionStates, setSectionStates] = useState<Record<string, SectionState>>({});
  const [categoryData, setCategoryData] = useState<ProcessedSanityCategory[]>([]);
  const [collections, setCollections] = useState<SanityCollectionDoc[]>([]);
  const [mntRate, setMntRate] = useState<number | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setPageData } = useProductContext();
  const sectionRefs = useRef<SectionRefs>({});
  const fetchedSections = useRef(new Set<string>());
  const loadingPromises = useRef(new Map<string, Promise<void>>());
  const [skeletonCount, setSkeletonCount] = useState(6);

  // Responsive skeleton count
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1536) setSkeletonCount(6);
      else if (w >= 1024) setSkeletonCount(5);
      else if (w >= 768) setSkeletonCount(4);
      else if (w >= 640) setSkeletonCount(3);
      else setSkeletonCount(2);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const replaceText = useMemo(
    () => (text: string): string => {
      if (!text) return '';
      const formatted = String(text)
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
      return formatted.replace(/GOAT/gi, 'SAINTO').replace(/Canada/gi, 'MONGOLIA');
    },
    []
  );

  const renderPrice = useMemo(
    () => (priceMnt: number): { default: string; hover: string } => {
      // Debug logging
      console.log(`[FRONTEND] renderPrice input:`, priceMnt);
      
      // Handle null/undefined/0/invalid prices
      if (!priceMnt || priceMnt === 0 || priceMnt === 9999) {
        console.log(`[FRONTEND] renderPrice: returning Unavailable (price=${priceMnt})`);
        return { default: 'Unavailable', hover: 'Unavailable' };
      }
      if (mntRate === null) 
        return { default: '...', hover: '...' };
      
      // Admin inputs and collection API values are in direct MNT.
      const mntPrice = priceMnt;
      const usdPrice = mntPrice / mntRate;
      
      const result = {
        default: `MNT ${Math.ceil(mntPrice).toLocaleString('en-US')}`,
        hover: `$${usdPrice.toFixed(2)}`
      };
      
      console.log(`[FRONTEND] renderPrice output:`, result.default);
      return result;
    },
    [mntRate]
  );

  const processCategoryData = useCallback((docs: SanityProductCategoryUrlDoc[]): ProcessedSanityCategory[] => {
    const result: ProcessedSanityCategory[] = [];
    docs.forEach((doc) => {
      [doc.el1, doc.el2, doc.el3, doc.el4].forEach((el) => {
        if (el?.label && el.url1) {
          const images: CategoryImage[] = [];
          if (el.url1) images.push({ url: el.url1, alt: `${el.label} 1` });
          if (el.url2) images.push({ url: el.url2, alt: `${el.label} 2` });
          if (el.url3) images.push({ url: el.url3, alt: `${el.label} 3` });

          if (images.length > 0) {
            result.push({
              id: `${doc.category || 'default'}-${el.label}`,
              label: el.label,
              categoryUrl: `/collections/${el.label.toLowerCase().replace(/\s+/g, '-')}`,
              images,
            });
          }
        }
      });
    });
    return result;
  }, []);

  const fetchCollectionData = useCallback(async (slug: string): Promise<Item[]> => {
    try {
      const res = await fetch(`/api/collections/${slug}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      if (data.error) throw new Error(data.error);

      console.log(`[FRONTEND] Collection ${slug}: ${data.products.length} products`);
      data.products.forEach((p) => {
        if (p.price === 0 || !p.price) {
          console.log(`[FRONTEND] ZERO PRICE: ${p.name} (id: ${p.id}) - price: ${p.price}`);
        }
      });

      const seen = new Set<string>()
      const items: Item[] = []
      for (const p of data.products) {
        const key = p.id || p.slug
        if (!key || seen.has(key)) continue
        seen.add(key)
        items.push({
          data: {
            id: p.id,
            slug: p.slug,
            pictureUrl: p.image,
            title: p.name,
            brand: p.brand || '',
            price: p.price,
            inStock: true,
          },
          category: p.collection || data.collectionName,
          categoryUrl: `/collections/${slug}`,
          collection: data.collectionName,
        })
      }
      return items
    } catch (e) {
      throw e;
    }
  }, []);

  const loadSection = useCallback(
    async (sectionId: string, slug: string) => {
      if (fetchedSections.current.has(sectionId)) return;
      if (loadingPromises.current.has(sectionId)) {
        await loadingPromises.current.get(sectionId);
        return;
      }

      fetchedSections.current.add(sectionId);

      setSectionStates((prev) => ({
        ...prev,
        [sectionId]: { items: [], isLoading: true, error: null },
      }));

      const promise = (async () => {
        try {
          const items = await fetchCollectionData(slug);
          setSectionStates((prev) => ({
            ...prev,
            [sectionId]: { items, isLoading: false, error: null },
          }));
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Failed to load';
          setSectionStates((prev) => ({
            ...prev,
            [sectionId]: { items: [], isLoading: false, error: errorMsg },
          }));
        } finally {
          loadingPromises.current.delete(sectionId);
        }
      })();

      loadingPromises.current.set(sectionId, promise);
      await promise;
    },
    [fetchCollectionData]
  );

  // ─── Initial data load ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsInitialLoading(true);
      setError(null);

      try {
        const [colsRes, cats, rateRes] = await Promise.all([
          fetch('/api/collections/list')
            .then((r) => {
              if (!r.ok) throw new Error(`Collections API: ${r.status}`);
              return r.json();
            })
            .catch((err) => {
              console.error('Collections fetch failed:', err);
              return [];
            }),

          fetch('/api/payload/categories').then((r) => (r.ok ? r.json() : [])),

          fetch('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT')
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);

        // Flexible parsing of collections response
        const rawCols = Array.isArray(colsRes)
          ? colsRes
          : Array.isArray(colsRes?.collections)
          ? colsRes.collections
          : Array.isArray(colsRes?.data)
          ? colsRes.data
          : [];

        if (rawCols.length === 0) {
          console.warn('Collections came back empty. Raw response was:', colsRes);
        }

        setCollections(rawCols);

        // Rate is now optional
        const rate = rateRes?.data?.mid ?? null;
        setMntRate(rate);

        if (cats.length > 0) {
          setCategoryData(processCategoryData(cats));
        }

        // Preload first few sections
        const firstSections = rawCols.slice(0, INITIAL_SECTIONS_TO_LOAD) as Array<{
          name: string;
          slug: string;
        }>;
        await Promise.all(
          firstSections.map((c: { name: string; slug: string }, i: number) => {
            const id = `${c.name}-${i}`;
            return loadSection(id, c.slug);
          })
        );

        // Optional context update
        if (setPageData && rawCols[0]) {
          const firstId = `${rawCols[0].name}-0`;
          const firstState = sectionStates[firstId];
          if (firstState?.items?.length) {
            setPageData({ [firstId]: firstState.items });
          }
        }
      } catch (e) {
        console.error('Critical initial load failure:', e);
        setError(e instanceof Error ? e.message : 'Failed to load page data');
      } finally {
        setIsInitialLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processCategoryData, setPageData, loadSection]);

  // Lazy-load remaining sections on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        (async () => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.getAttribute('data-section-index'));
              const col = collections[idx];
              if (col) {
                const id = `${col.name}-${idx}`;
                await loadSection(id, col.slug);
              }
            }
          }
        })();
      },
      {
        threshold: INTERSECTION_THRESHOLD,
        rootMargin: INTERSECTION_ROOT_MARGIN,
      }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [collections, loadSection]);

  // Cleanup stale refs
  useEffect(() => {
    const currentSectionIds = new Set(collections.map((c, i) => `${c.name}-${i}`));

    Object.keys(sectionRefs.current).forEach((key) => {
      if (!currentSectionIds.has(key)) {
        delete sectionRefs.current[key];
      }
    });
  }, [collections]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 mb-4">Oops! Something went wrong.</h2>
        <pre className="text-sm bg-neutral-100 p-4 rounded max-w-2xl overflow-auto whitespace-pre-wrap">
          {error}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      {trendingSectionDisplay}

      {collections.length > 0 ? (
        collections.map((collection, index) => {
          const sectionId = `${collection.name}-${index}`;
          const sectionState = sectionStates[sectionId] || {
            items: [],
            isLoading: false,
            error: null,
          };
          const showCategories = index === 0 ? categoryData : [];

          if (!sectionRefs.current[sectionId]) {
            sectionRefs.current[sectionId] = React.createRef();
          }

          const isLoaded = fetchedSections.current.has(sectionId);

          return (
            <SectionErrorBoundary key={sectionId} sectionName={collection.name}>
              <section
                ref={sectionRefs.current[sectionId]}
                data-section-index={index}
                className="mb-20 md:mb-24"
                aria-label={replaceText(collection.name)}
              >
                <header className="flex justify-between items-center mb-4 md:mb-6 px-4">
                  <h2 className="text-xl md:text-2xl font-semibold truncate pr-4 text-neutral-700">
                    {collection.name
                      .replace(/-/g, ' ')
                      .split(' ')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </h2>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="text-xs md:text-sm font-semibold underline text-neutral-600 hover:text-black transition-colors"
                  >
                    View All
                  </Link>
                </header>

                {sectionState.error ? (
                  <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200 mx-4">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-700 text-sm">{sectionState.error}</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile view */}
                    <div className="block lg:hidden">
                      {!isLoaded || sectionState.isLoading ? (
                        <SkeletonGrid
                          count={skeletonCount}
                          className="w-1/2 sm:w-[45%]"
                          sectionId={sectionId}
                          isMobile
                        />
                      ) : sectionState.items.length > 0 ? (
                        <ProductScroller
                          items={sectionState.items}
                          ItemComponent={MobileItem}
                          renderPrice={renderPrice}
                          replaceText={replaceText}
                          itemBaseClassName="w-1/2 sm:w-[45%]"
                          priorityStartIndex={2}
                        />
                      ) : (
                        <p className="text-neutral-500 text-center py-4">No items available</p>
                      )}
                    </div>

                    {/* Desktop view */}
                    <div className="hidden lg:block">
                      {!isLoaded || sectionState.isLoading ? (
                        <SkeletonGrid
                          count={skeletonCount}
                          className="w-1/5 2xl:w-1/6"
                          sectionId={sectionId}
                        />
                      ) : sectionState.items.length > 0 ? (
                        <ProductScroller
                          items={sectionState.items}
                          ItemComponent={DesktopItem}
                          renderPrice={renderPrice}
                          replaceText={replaceText}
                          itemBaseClassName="lg:w-1/4 xl:w-1/5 2xl:w-1/6"
                          priorityStartIndex={5}
                        />
                      ) : (
                        <p className="text-neutral-500 text-center py-4">No items available</p>
                      )}
                    </div>
                  </>
                )}

                {/* Categories – only on first section */}
                {showCategories.length > 0 && !sectionState.error && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 mt-16">
                    {showCategories.map((cat, i) => (
                      <CategoryCard
                        key={cat.id}
                        label={cat.label}
                        images={cat.images}
                        categoryUrl={cat.categoryUrl}
                        replaceText={replaceText}
                        priority={i < 4}
                      />
                    ))}
                  </div>
                )}
              </section>
            </SectionErrorBoundary>
          );
        })
      ) : isInitialLoading ? (
        <section className="mb-20">
          <header className="flex justify-between items-center mb-6 px-4">
            <div className="h-8 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
            <div className="h-6 w-1/6 bg-neutral-200 rounded animate-pulse"></div>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 px-4">
            {Array.from({ length: skeletonCount }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex items-center justify-center p-8">
          <p className="text-neutral-500">No collections available</p>
        </div>
      )}
    </div>
  );
};

export default memo(Home);