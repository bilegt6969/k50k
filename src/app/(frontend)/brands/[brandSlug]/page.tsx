// 'use client';

// // Necessary React hooks and Next.js components
// import React, { useState, useEffect, useCallback, useRef, memo, use } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// // Import the FilterPanel component (adjust path if necessary)
// import FilterPanel from '../../../../components/filters/FiltersPanel';

// // --- Reusable Cache Logic ---
// interface HomeCache {
//   mntRate: number | null;
//   timestamp: number | null;
// }
// // Define cache object OUTSIDE the component scope
// const homeCache: HomeCache = { mntRate: null, timestamp: null };
// const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour for currency cache

// /**
//  * Checks if the currency cache is still valid.
//  * @param cacheTimestamp - The timestamp when the cache was last updated.
//  * @returns True if the cache is valid, false otherwise.
//  */
// const isCacheValid = (cacheTimestamp: number | null): boolean => {
//   if (!cacheTimestamp) return false;
//   return Date.now() - cacheTimestamp < CACHE_DURATION_MS;
// };
// // --- End Cache Logic ---

// // --- Interface Definitions ---
// interface ItemData {
//   id: string;
//   slug: string;
//   image_url: string;
//   lowest_price_cents: number; // USD cents
// }

// interface Item {
//   data: ItemData;
//   value: string; // Product name
// }

// // Interfaces for the Constructor.io Brand API Response structure
// interface ApiBrandResultData {
//   id: string;
//   image_url: string;
//   lowest_price_cents: number;
//   slug: string;
// }

// interface ApiBrandResult {
//   data: ApiBrandResultData;
//   value: string; // Product name
// }

// interface ApiFacetOption {
//   status?: string;
//   count: number;
//   display_name: string;
//   value: string;
//   data?: Record<string, unknown>; // Changed from any to Record<string, unknown>
// }

// interface ApiFacet {
//   display_name: string;
//   name: string;
//   type: string;
//   options: ApiFacetOption[];
//   hidden: boolean;
//   data: Record<string, unknown>; // Changed from any to Record<string, unknown>
// }

// interface ApiBrandResponse {
//   response?: {
//     results?: ApiBrandResult[];
//     total_num_results?: number;
//     facets?: ApiFacet[]; // Available filters for the current query/brand
//   };
//   error?: { message: string }; // API-level error message
// }

// // Type definition for the state holding selected filter values
// // e.g., { gender: ['Men'], product_category: ['Shoes'] }
// type SelectedFilters = Record<string, string[]>;

// // --- Constants ---
// const NUM_RESULTS_PER_PAGE = 24; // Number of products to fetch per API call
// const API_BASE_URL = 'https://ac.cnstrc.com/browse/brand'; // Base URL for the brand API endpoint
// // Static query parameters common to all brand API calls
// const API_STATIC_PARAMS =
//   'c=ciojs-client-2.54.0&key=key_XT7bjdbvjgECO5d8&i=c1a92cc3-02a4-4244-8e70-bee6178e8209&s=103&num_results_per_page=' +
//   NUM_RESULTS_PER_PAGE +
//   '&sort_by=relevance&sort_order=descending&fmt_options%5Bhidden_fields%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_fields%5D=gp_instant_ship_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_lowest_price_cents_223&fmt_options%5Bhidden_facets%5D=gp_instant_ship_lowest_price_cents_223&variations_map=%7B%22group_by%22%3A%5B%7B%22name%22%3A%22product_condition%22%2C%22field%22%3A%22data.product_condition%22%7D%2C%7B%22name%22%3A%22box_condition%22%2C%22field%22%3A%22data.box_condition%22%7D%5D%2C%22values%22%3A%7B%22min_regional_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_lowest_price_cents_223%22%7D%2C%22min_regional_instant_ship_price%22%3A%7B%22aggregation%22%3A%22min%22%2C%22field%22%3A%22data.gp_instant_ship_lowest_price_cents_223%22%7D%7D%2C%22dtype%22%3A%22object%22%7D&qs=%7B%22features%22%3A%7B%22display_variations%22%3Atrue%7D%2C%22feature_variants%22%3A%7B%22display_variations%22%3A%22matched%22%7D%7D';
// // Note: Dynamic parameters like page, filters, and _dt are added in fetch functions

// // --- Helper Utility Functions ---

// /**
//  * Converts a URL slug (e.g., "nike-air-max") to a Title Case Brand Name ("Nike Air Max").
//  * @param slug - The input slug string.
//  * @returns The formatted brand name string.
//  */
// const slugToBrandName = (slug: string): string => {
//   if (!slug) return '';
//   return slug
//     .split('-')
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ');
// };

// /**
//  * Generates a URL-friendly slug from a given text string.
//  * @param text - The input text.
//  * @returns The generated slug string.
//  */

// /**
//  * Formats a price in USD cents to Mongolian Tögrög (MNT) using the provided exchange rate.
//  * @param priceCentsUSD - The price in USD cents.
//  * @param mntRate - The current USD to MNT exchange rate.
//  * @returns A formatted currency string (e.g., "₮150,000") or '...'/'N/A'.
//  */
// const renderPrice = (priceCentsUSD: number, mntRate: number | null): string => {
//     // Current time is Friday, April 25, 2025 at 5:03 AM +08 (Ulaanbaatar time)
//   if (typeof priceCentsUSD !== 'number' || isNaN(priceCentsUSD)) {
//     return 'N/A'; // Not Available if price is invalid
//   }
//   // If rate is not yet loaded or invalid, show loading indicator
//   if (mntRate === null || typeof mntRate !== 'number' || isNaN(mntRate)) {
//     return '...';
//   }

//   const priceDollarsUSD = priceCentsUSD / 100;
//   const priceMNT = priceDollarsUSD * mntRate;

//   // Format using Mongolian Tögrög (MNT) currency settings
//   return priceMNT.toLocaleString('mn-MN', { // Use Mongolian locale for potential specific formatting
//     style: 'currency',
//     currency: 'MNT',
//     maximumFractionDigits: 0, // No decimal places for Tögrög
//   });
// };

// /**
//  * Placeholder function for text replacement (e.g., trademark symbols).
//  * Can be expanded later if needed.
//  * @param text - The input text.
//  * @returns The processed text.
//  */
// const replaceText = (text: string): string => {
//   // Example: return text.replace(/®/g, '');
//   return text;
// };

// // --- Skeleton Loading Component ---
// /**
//  * Renders a placeholder card with pulsing animation while product data is loading.
//  */
// const SkeletonCard = () => (
//   <div className="text-white bg-neutral-800 border border-neutral-700 rounded tracking-tight relative h-full flex flex-col animate-pulse">
//     {/* Image Placeholder */}
//     <div
//       className="overflow-hidden rounded rounded-b-none relative flex-grow bg-neutral-700"
//       style={{ aspectRatio: '1 / 1' }} // Maintain square aspect ratio
//     ></div>
//     {/* Text/Button Placeholders */}
//     <div className="w-full text-xs font-bold flex items-center p-4 border-t border-neutral-700 justify-between relative">
//       <div className="h-4 bg-neutral-600 rounded w-3/4 mr-4"></div> {/* Name placeholder */}
//       <div className="h-8 w-[90px] bg-neutral-600 rounded-full"></div> {/* Price/Button placeholder */}
//     </div>
//   </div>
// );

// // --- Memoized Product Card Component ---
// interface ProductCardProps {
//   item: Item;
//   priority: boolean; // Hint for prioritizing image loading (LCP)
//   mntRate: number | null; // Current MNT exchange rate
// }

// /**
//  * Renders a single product card, displaying image, name, and price.
//  * Memoized for performance optimization.
//  */
// const ProductCard = memo(({ item, priority, mntRate }: ProductCardProps) => {
//   // Construct the link URL using the slug from item data
//   const productLink = item.data.slug ? `/product/${item.data.slug}` : '#'; // Fallback if slug is missing

//   return (
//     <Link href={productLink} passHref legacyBehavior>
//       <a className="block text-white bg-black border border-neutral-700 rounded tracking-tight relative cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-neutral-600  h-full flex flex-col group">
//         {/* Image Container */}
//         <div className="overflow-hidden rounded-t-lg relative flex-grow" style={{ aspectRatio: '1 / 1' }}>
//           <Image
//             className="rounded-t-lg mx-auto transition-transform duration-500 group-hover:scale-110 object-cover"
//             src={item.data.image_url || 'https://placehold.co/300x300/333/ccc?text=No+Image'} // Fallback image
//             alt={replaceText(item.value)}
//             fill
//             sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 25vw, 20vw" // Responsive image sizes
//             priority={priority} // Load high-priority images eagerly
//             loading={priority ? 'eager' : 'lazy'} // Lazy load other images
//             onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300/333/ccc?text=Load+Error'; }} // Handle image load errors
//           />
//         </div>
//         {/* Bottom Info Bar */}
//         <div className="w-full text-xs font-bold flex items-center p-4 border-t border-neutral-700 justify-between relative transition-colors duration-300 group-hover:border-neutral-500">
//           {/* Product Name (truncated) */}
//           <span className="truncate pr-2">{replaceText(item.value)}</span>
//           {/* Price/View Button */}
//           <div className="bg-neutral-800 backdrop-brightness-90 border border-neutral-700 group-hover:bg-neutral-600 group-hover:border-neutral-500 py-2 px-2 rounded-full whitespace-nowrap transition-all duration-300 ease-out min-w-[90px] text-center relative overflow-hidden">
//             {/* Price (visible by default) */}
//             <span className="block group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300">
//               {renderPrice(item.data.lowest_price_cents, mntRate)}
//             </span>
//             {/* "View" text (visible on hover) */}
//             <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
//               View
//             </span>
//           </div>
//         </div>
//       </a>
//     </Link>
//   );
// });
// ProductCard.displayName = 'ProductCard'; // Set display name for React DevTools

// // --- Main Page Component ---

// /**
//  * Renders the brand page, displaying products for a specific brand,
//  * including filtering and infinite scrolling capabilities.
//  */
// export default function BrandPage({ params }: { params: Promise<{ brandSlug: string }> }) {
//   // Asynchronously resolve the brand slug from the route parameters
//   const resolvedParams = use(params);
//   const { brandSlug } = resolvedParams;

//   // --- State Hooks ---
//   const [displayBrandName, setDisplayBrandName] = useState<string>(''); // Formatted brand name for display
//   const [products, setProducts] = useState<Item[]>([]); // Array of product items
//   const [page, setPage] = useState(1); // Current page number for pagination/infinite scroll
//   const [isLoading, setIsLoading] = useState(false); // General loading state (products/filters)
//   const [isCurrencyLoading, setIsCurrencyLoading] = useState(false); // Specific loading state for currency rate
//   const [hasMore, setHasMore] = useState(true); // Flag indicating if more products can be loaded
//   const [error, setError] = useState<string | null>(null); // Stores error messages
//   const [isInitialLoad, setIsInitialLoad] = useState(true); // Tracks if it's the very first load or filter change load
//   const [mntRate, setMntRate] = useState<number | null>(null); // USD to MNT exchange rate
//   const [availableFilters, setAvailableFilters] = useState<ApiFacet[]>([]); // Filters returned by the API
//   const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({}); // User's selected filters
//   const loadingRef = useRef<HTMLDivElement | null>(null); // Ref for the infinite scroll trigger element
//   const isFetchingProducts = useRef(false); // Ref to prevent concurrent product fetch calls

//   // --- Fetch Currency Data ---
//   /**
//    * Fetches the USD to MNT exchange rate from an external API.
//    * Uses caching to avoid redundant calls.
//    * @param forceRefetch - If true, bypasses the cache.
//    * @returns The fetched MNT rate or null if failed.
//    */
//   const fetchCurrencyData = useCallback(
//     async (forceRefetch = false): Promise<number | null> => {
//       // Use cached rate if valid and not forcing refetch
//       if (!forceRefetch && isCacheValid(homeCache.timestamp) && homeCache.mntRate !== null) {
//         if (mntRate !== homeCache.mntRate) setMntRate(homeCache.mntRate); // Update state if cache differs
//         return homeCache.mntRate;
//       }

//       console.log('Fetching currency data...');
//       setIsCurrencyLoading(true);
//       try {
//         const res = await fetch('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT');
//         if (!res.ok) throw new Error(`Currency API error! status: ${res.status}`);
//         const currencyData = await res.json();

//         if (currencyData.status_code === 200 && currencyData.data?.mid) {
//           const rate = currencyData.data.mid;
//           console.log('Currency rate fetched:', rate);
//           setMntRate(rate);
//           // Update cache
//           homeCache.mntRate = rate;
//           homeCache.timestamp = Date.now();
//           // Clear only currency-related errors
//           setError((prev) => prev?.replace(/Failed to fetch currency:[^\n]*/g, '').trim() || null);
//           return rate;
//         } else {
//           throw new Error(currencyData.message || 'MNT rate not available in response');
//         }
//       } catch (error: unknown) {
//         const message = error instanceof Error ? error.message : 'An unknown currency error occurred';
//         console.error('Failed to fetch currency data:', message);
//         const currencyError = `Failed to fetch currency: ${message}`;
//         // Append or set the currency error message
//         setError((prev) =>
//           prev ? `${prev.split('\n').filter((line) => !line.includes('Failed to fetch currency:')).join('\n')}\n${currencyError}`.trim() : currencyError
//         );
//         setMntRate(null); // Ensure price shows loading/error state
//         return null;
//       } finally {
//         setIsCurrencyLoading(false);
//       }
//     },
//     [mntRate] // Dependency ensures we use current mntRate for comparison check
//   );

//   // --- Fetch Brand Products ---
//   /**
//    * Fetches products for the current brand, page, and selected filters.
//    * @param slug - The brand slug.
//    * @param pageNum - The page number to fetch.
//    * @param currentFilters - The currently selected filters.
//    * @returns A promise resolving to the fetched items, facets, and total results count.
//    */
//    const fetchBrandProducts = useCallback(async (slug: string, pageNum: number, currentFilters: SelectedFilters): Promise<{
//     newItems: Item[];
//     facets?: ApiFacet[];
//     totalResults: number;
//   }> => {
//     if (!slug) return { newItems: [], totalResults: 0 };
  
//     // Build filter query parameters string
//     let filterParams = '';
//     Object.entries(currentFilters).forEach(([facetName, values]) => {
//       values.forEach((value) => {
//         filterParams += `&filters[${encodeURIComponent(facetName)}]=${encodeURIComponent(value)}`;
//       });
//     });
  
//     // Construct the full API URL
//     const encodedBrandSlug = encodeURIComponent(slug.toLowerCase());
//     const url = `${API_BASE_URL}/${encodedBrandSlug}?${API_STATIC_PARAMS}&page=${pageNum}${filterParams}&_dt=${Date.now()}`;
  
//     try {
//       const res = await fetch(url);
//       if (!res.ok) {
//         const errorBody = await res.text();
//         throw new Error(`Product API error! status: ${res.status}. Response: ${errorBody.slice(0, 500)}`);
//       }
//       const data: ApiBrandResponse = await res.json();
  
//       if (data.error) {
//         throw new Error(`API Error: ${data.error.message}`);
//       }
  
//       if (!data.response) {
//         console.warn('No response object found in API data:', data);
//         return { newItems: [], totalResults: 0 };
//       }
  
//       const results = data.response.results ?? [];
//       const totalResults = data.response.total_num_results ?? 0;
//       const facets = data.response.facets?.filter(f => !f.hidden && f.options?.length > 0);
  
//       // INSIDE fetchBrandProducts function
// // ...
// const newItems: Item[] = results.map((result): Item => {
//   // Defines generateSlug locally as it's simple and used here
//   const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
//   const productSlug = result.data.slug || generateSlug(result.value) || result.data.id;
//   return {
//       value: result.value,
//       data: {
//           id: result.data.id,
//           slug: productSlug,
//           image_url: result.data.image_url,
//           lowest_price_cents: result.data.lowest_price_cents,
//       },
//   };
// });
// // ...
  
//       setError((prev) => prev?.replace(/Failed to fetch products:[^\n]*/g, '').trim() || null);
//       return { newItems, facets, totalResults };
//     } catch (err: unknown) {
//       const message = err instanceof Error ? err.message : 'An unknown product error occurred';
//       console.error('FetchBrandProductsError:', err);
//       const productError = `Failed to fetch products: ${message}`;
//       setError((prev) => prev ? `${prev.split('\n').filter(line => !line.includes('Failed to fetch products:')).join('\n')}\n${productError}`.trim() : productError);
//       return { newItems: [], totalResults: 0 };
//     }
//   }, []); // Removed dependencies since we moved the helper functions inside

//   // --- Filter Change Handler ---
//   /**
//    * Updates the selected filters state when a filter checkbox is toggled.
//    * Resets pagination and triggers a refetch of products with the new filters.
//    * @param facetName - The name (key) of the facet being changed.
//    * @param optionValue - The value of the option being toggled.
//    */
//   const handleFilterChange = useCallback((facetName: string, optionValue: string) => {
//     console.log(`Filter change: Facet=${facetName}, Value=${optionValue}`);
//     setSelectedFilters(prevFilters => {
//         const currentValues = prevFilters[facetName] || [];
//         const valueIndex = currentValues.indexOf(optionValue);
//         let newValues;

//         // Toggle the value in the array for the specific facet
//         if (valueIndex > -1) {
//             newValues = currentValues.filter(v => v !== optionValue); // Remove value
//         } else {
//             newValues = [...currentValues, optionValue]; // Add value
//         }

//         // Create a new filters object to update state immutably
//         const newSelectedFilters = { ...prevFilters };
//         if (newValues.length > 0) {
//             newSelectedFilters[facetName] = newValues; // Update facet with new values
//         } else {
//             delete newSelectedFilters[facetName]; // Remove facet key if no values are selected
//         }

//         // Reset state for a fresh filtered fetch
//         setProducts([]); // Clear existing products
//         setPage(1); // Reset to page 1
//         setHasMore(true); // Assume there might be results with new filters
//         setIsInitialLoad(true); // Treat filter change like an initial load for loading indicators
//         setError(null); // Clear previous errors
//         isFetchingProducts.current = false; // Reset fetch lock to allow immediate fetch

//         // Return the new state; the useEffect watching selectedFilters will trigger the fetch
//         return newSelectedFilters;
//     });
//   }, []); // No dependencies needed, only uses setters

//   // --- Clear All Filters Handler ---
//   /**
//    * Resets all selected filters, clears products, and triggers a refetch.
//    */
//   const clearFilters = useCallback(() => {
//       // Only proceed if there are active filters
//       if (Object.keys(selectedFilters).length === 0) return;

//       console.log('Clearing all filters');
//       setSelectedFilters({}); // Reset selected filters to empty object
//       // Reset state similar to handleFilterChange
//       setProducts([]);
//       setPage(1);
//       setHasMore(true);
//       setIsInitialLoad(true);
//       setError(null);
//       isFetchingProducts.current = false;
//       // The useEffect watching selectedFilters will trigger the fetch
//   }, [selectedFilters]); // Depends on selectedFilters to know if clearing is possible

//   // --- Effects ---

//   // Effect 1: Handle Brand Slug Change
//   // Resets page state whenever the brandSlug parameter changes.
//   useEffect(() => {
//     console.log("Brand slug changed:", brandSlug);
//     setDisplayBrandName(slugToBrandName(brandSlug)); // Update display name
//     // Reset all relevant state
//     setProducts([]);
//     setPage(1);
//     setIsInitialLoad(true);
//     setHasMore(true);
//     setError(null);
//     setSelectedFilters({}); // Clear filters when brand changes
//     setAvailableFilters([]); // Clear available filters display
//     isFetchingProducts.current = false; // Reset fetch lock
//     // Note: Currency and initial products are fetched by the next effect
//   }, [brandSlug]); // Rerun only when the brandSlug changes

//   // Effect 2: Initial Data Load & Filter Change Load
//   // Fetches page 1 products and filters when the component mounts,
//   // the brand changes, or the selected filters change.
// //Effect3:InfiniteScroll-FetchSubsequentPages
// //Fetchesthenextpageofproductswhenthe`page`stateincreases.
// useEffect(()=>{
//   //Conditionstofetchnextpage:
//   //-Nottheinitialloadanymore(page>1)
//   //-brandSlugisavailable
//   //-hasMoreindicatesmoreproductsexist
//   //-Notcurrentlyfetchingproducts
//   if(page>1&&brandSlug&&hasMore&&!isFetchingProducts.current){
//       console.log('Effect:Triggeringinfinitescrollfetchforpage:',page,'Filters:',selectedFilters);
//       isFetchingProducts.current=true;//Setfetchlock
//       setIsLoading(true);//Showloadingindicatorforsubsequentpages
//       //Fetchthenextpage,passingcurrentfilters
//       fetchBrandProducts(brandSlug,page,selectedFilters).then(({newItems,totalResults})=>{
//           //Facetsusuallynotneeded/updatedforsubsequentpages
//           setProducts((prevProducts)=>{
//               const updatedProducts = [...prevProducts,...newItems];
//               //UpdatehasMorebasedonthenewtotalcount, using the length of the updated array
//               setHasMore(updatedProducts.length < totalResults);
//               return updatedProducts; //Appendnewproducts
//           });
//       }).catch((err)=>{
//           //ErrorstateissetwithinfetchBrandProducts
//           console.error(`Errorfetchingpage${page}:`,err);
//           //Optional:Stoptryingtoloadmoreifapagefetchfails
//           //setHasMore(false);
//       }).finally(()=>{
//           setIsLoading(false);//Hideloadingindicator
//           isFetchingProducts.current=false;//Releasefetchlock
//       });
//   }
// //Dependencies:RunwhenpagechangesorconditionslikehasMore/brandSlugchange
// },[page,brandSlug,hasMore,selectedFilters,fetchBrandProducts]);


//   // Effect 3: Infinite Scroll - Fetch Subsequent Pages
//   // Fetches the next page of products when the `page` state increases.
// // ... (Imports and other code) ...

// // REMOVED the first duplicate Effect3

// // Effect3: InfiniteScroll - Fetch Subsequent Pages (FIXED)
// useEffect(() => {
//   // Conditions to fetch next page:
//   // - Not the initial load anymore (page > 1)
//   // - brandSlug is available
//   // - hasMore indicates more products exist
//   // - Not currently fetching products
//   if (page > 1 && brandSlug && hasMore && !isFetchingProducts.current) {
//     console.log('Effect: Triggering infinite scroll fetch for page:', page, 'Filters:', selectedFilters);
//     isFetchingProducts.current = true; // Set fetch lock
//     setIsLoading(true); // Show loading indicator

//     // Fetch the next page, passing current filters
//     fetchBrandProducts(brandSlug, page, selectedFilters).then(({ newItems, totalResults }) => {
//         // Use functional updates to ensure we work with the latest state
//         setProducts((prevProducts) => {
//             const updatedProducts = [...prevProducts, ...newItems];
//             // We can now correctly calculate if there's more based on the new length
//             setHasMore(updatedProducts.length < totalResults);
//             return updatedProducts; // Return the updated array
//         });
//     }).catch((err) => {
//       // Error state is set within fetchBrandProducts
//       console.error(`Error fetching page ${page}:`, err);
//       // Optional: Stop trying to load more if a page fetch fails
//       // setHasMore(false);
//     }).finally(() => {
//       setIsLoading(false); // Hide loading indicator
//       isFetchingProducts.current = false; // Release fetch lock
//     });
//   }
//   // ✅ FIX: No `products.length` is needed here anymore because we calculate
//   //    `hasMore` *inside* the `setProducts` functional update (or rather,
//   //    we update both based on the result, ensuring consistency).
//   //    The original code had a flaw; the *best* fix is to avoid needing it.
//   //    If ESLint *still* complains, it's a false positive, but the *safest*
//   //    approach if `setHasMore` was *outside* the `setProducts` callback
//   //    would be to add `products.length`. Given the improved structure above,
//   //    it's likely not needed.
//   //    Let's stick to the cleanest version:
// }, [page, brandSlug, hasMore, selectedFilters, fetchBrandProducts]);


// // Effect4: IntersectionObserver for Infinite Scroll Trigger
// useEffect(() => {
//   // Don't setup observer if the target ref isn't set or if already fetching
//   // ✅ FIX: Check `isLoading` as well, as `isFetchingProducts` might be reset slightly before.
//   if (!loadingRef.current || isLoading) return;

//   const observer = new IntersectionObserver((entries) => {
//       const [entry] = entries;
//       // Trigger next page load if intersecting, not currently loading, and more products exist
//       // ✅ FIX: Check `isLoading` instead of `isFetchingProducts` for a safer trigger
//       if (entry.isIntersecting && !isLoading && hasMore) {
//           console.log('Intersection observer triggered: loading next page');
//           // Increment page state, which triggers Effect3
//           setPage((prevPage) => prevPage + 1);
//       }
//   }, {
//       rootMargin: '400px' // Load when the trigger is 400px below the viewport
//   });

//   const currentRef = loadingRef.current;
//   if (currentRef) {
//       observer.observe(currentRef); // Start observing
//   }

//   // Cleanup function: disconnect observer
//   return () => {
//       if (currentRef) {
//           observer.unobserve(currentRef);
//       }
//   };
//   // ✅ FIX: Add `isLoading` to dependencies, so the observer re-evaluates
//   //    when loading finishes, allowing it to re-attach/trigger if needed.
// }, [hasMore, isLoading]);

// // ... (The rest of the component) ...

//   // --- Render Logic ---

//   // Determine if the filter panel should be shown
//   const showFilterPanel = availableFilters.length > 0 || (isInitialLoad && isLoading);
//   // Determine if the "No products found" message should be shown
//   const showNoProductsMessage = !isLoading && !isInitialLoad && products.length === 0 && !error;

//   return (
//     <div className="min-h-screen text-white bg-black">
//       {/* Page Header Section */}
//       <div className="p-4 md:p-6 lg:p-8 pb-0">
//           <h1 className="text-2xl md:text-3xl font-bold mb-6 animate-fade-in-up capitalize" style={{ animationDelay: '0.1s' }}>
//             {displayBrandName || 'Brand'} Products {/* Display formatted brand name */}
//           </h1>
//       </div>

//       {/* Main Content Area: Filters + Product Grid */}
//       <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 lg:p-8 pt-2">

//         {/* Filter Panel Container (Sidebar on medium+ screens) */}
//         {showFilterPanel && (
//            <div className="w-full md:w-64 lg:w-72 flex-shrink-0"> {/* Prevents filter panel from growing */}
//                <FilterPanel
//                    filters={availableFilters}
//                    selectedFilters={selectedFilters}
//                    onFilterChange={handleFilterChange} // Pass filter toggle handler
//                    onClearFilters={clearFilters} // Pass clear all handler
//                    isLoading={isLoading && isInitialLoad} // Indicate loading state to disable filter interactions
//                />
//            </div>
//         )}

//         {/* Product Grid and Loading/Status Area */}
//         <main className="flex-1 min-w-0"> {/* Takes remaining space, prevents overflow */}

//             {/* Persistent Error Display Area */}
//             {error && (
//               <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm whitespace-pre-line">
//                 <p className="font-semibold">Error encountered:</p>
//                 {error.split('\n').map((line, i) => <p key={i}>{line}</p>)} {/* Display multi-line errors */}

//                 {/* Retry Buttons */}
//                 <div className="mt-2 space-x-2">
//                     {error.includes('currency') && (
//                         <button
//                             onClick={() => fetchCurrencyData(true)} // Force refetch
//                             className="px-3 py-1 text-xs bg-red-700 rounded hover:bg-red-600 transition-colors duration-200 text-white"
//                         >
//                             Retry Currency
//                         </button>
//                     )}
//                     {error.includes('products') && (
//                         <button
//                             onClick={() => {
//                                 // Retry logic: Reset state and fetch page 1 with current filters
//                                 console.log("Retrying product fetch...");
//                                 setProducts([]);
//                                 setPage(1);
//                                 setHasMore(true);
//                                 setIsInitialLoad(true); // Re-trigger initial load logic
//                                 setError(null); // Clear error before retrying
//                                 isFetchingProducts.current = false; // Allow fetch
//                                 // Fetch will be triggered by useEffect watching selectedFilters/isInitialLoad
//                             }}
//                             className="px-3 py-1 text-xs bg-red-700 rounded hover:bg-red-600 transition-colors duration-200 text-white"
//                         >
//                             Retry Products
//                         </button>
//                     )}
//                  </div>
//               </div>
//             )}

//           {/* Product Grid Layout */}
//           <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4 text-xs">
//             {/* Initial Loading Skeletons */}
//             {/* Show skeletons only during the initial load phase (page 1 or after filter change) */}
//             {isInitialLoad &&
//               isLoading &&
//               !error && // Don't show skeletons if there was an error
//               Array.from({ length: NUM_RESULTS_PER_PAGE }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}

//             {/* Render Product Cards */}
//             {products.map((item, index) => (
//               <ProductCard
//                 // Key needs to be unique, consider page/filter changes if IDs repeat across pages
//                 key={`${item.data.id}-${page}-${Object.keys(selectedFilters).join('-')}-${index}`}
//                 item={item}
//                 // Prioritize images only on the first page during initial load for LCP
//                 priority={index < 10 && page === 1 && isInitialLoad}
//                 mntRate={mntRate} // Pass the fetched MNT rate
//               />
//             ))}
//           </div>

//             {/* Message when no products are found */}
//             {showNoProductsMessage && (
//                 <div className="text-center text-neutral-400 mt-10">
//                     <p>No products found for &quot;{displayBrandName}&quot;{Object.keys(selectedFilters).length > 0 ? ' with the selected filters' : ''}.</p>
//                     {/* Show Clear Filters button only if filters are active */}
//                     {Object.keys(selectedFilters).length > 0 && (
//                         <button
//                             onClick={clearFilters}
//                             className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
//                         >
//                             Clear Filters
//                         </button>
//                     )}
//                 </div>
//             )}


//           {/* Infinite Scroll Trigger & Loading/End Indicators */}
//           {/* This div is observed by the Intersection Observer */}
//           <div ref={loadingRef} className="h-20 flex justify-center items-center mt-8" aria-hidden="true">
//             {/* Loading indicator for subsequent pages (infinite scroll) */}
//             {isLoading && !isInitialLoad && hasMore && (
//               <div className="flex items-center space-x-2 text-neutral-400">
//                 <svg className="animate-spin h-5 w-5 text-neutral-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//                 <span>Loading more {displayBrandName} products...</span>
//               </div>
//             )}

//             {/* End of List Message */}
//             {!hasMore && !isLoading && products.length > 0 && !error && (
//               <div className="text-center text-neutral-500">
//                 <p>You&apos;ve reached the end!</p>
//               </div>
//             )}
//           </div>
//         </main>

//       </div> {/* End Flex Container */}


//        {/* Subtle Currency Loading Indicator (fixed position) */}
//        {isCurrencyLoading && (
//          <div className="text-xs text-neutral-500 fixed bottom-2 right-2 bg-neutral-800 px-2 py-1 rounded shadow" title="Updating currency exchange rate">
//            <span>Rate updating...</span>
//          </div>
//        )}


//       {/* Minimal Global Styles for Animations */}
//       <style jsx global>{`
//         @keyframes fade-in-up {
//           from {
//             opacity: 0;
//             transform: translateY(15px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//         .animate-fade-in-up {
//           animation: fade-in-up 0.6s ease-out forwards;
//         }
//         /* Basic scrollbar styling for filter panel */
//         .md\\:overflow-y-auto::-webkit-scrollbar {
//             width: 6px;
//         }
//         .md\\:overflow-y-auto::-webkit-scrollbar-track {
//             background: transparent;
//         }
//         .md\\:overflow-y-auto::-webkit-scrollbar-thumb {
//             background-color: rgba(100, 116, 139, 0.5); /* neutral-500 with opacity */
//             border-radius: 3px;
//         }
//          .md\\:overflow-y-auto::-webkit-scrollbar-thumb:hover {
//             background-color: rgba(100, 116, 139, 0.7); /* darker on hover */
//         }
//       `}</style>
//     </div>
//   );
// }


import React from 'react'

function page() {
  return (
    <div>page</div>
  )
}

export default page