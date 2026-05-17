'use client';

import { ChartBarIcon, ClockIcon, GlobeAltIcon, UserIcon } from '@heroicons/react/24/solid';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TruckIcon } from '@heroicons/react/24/solid';
import { toast, Toaster } from 'sonner';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NotificationCard } from '@/components/NotificationCard';
import useCartStore from '@/app/store/cartStore';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import type { Product, PriceData, SaleItem, DailySaleItem } from '@/types/product';
import { formatReleaseDate } from './productViewUtils';
import { CURRENCY_FETCH_TIMEOUT, PLACEHOLDER_IMAGE } from './productViewUtils';
import { ProductPageSkeleton } from './ProductViewSkeleton';
import { AccordionItem } from './ProductViewAccordion';
import { ImageZoomModal } from './ProductViewImageZoomModal';
import { SalesHistoryContent } from './ProductViewSalesHistory';
import { DailySalesContent } from './ProductViewDailySales';
import { ImageGallery } from './ProductViewImageGallery';
import { SizeSelector } from './ProductViewSizeSelector';
import { PriceDisplay } from './ProductViewPriceDisplay';
import { ProductViewAccordionSections } from './ProductViewAccordionSections';
import { ProductViewRecommended } from './ProductViewProductGrid';

export interface EbaySpecificData {
  itemWebUrl?: string;
  condition?: string;
  conditionDescription?: string;
  seller?: {
    username?: string;
    feedbackPercentage?: string;
    feedbackScore?: number;
  };
  shipping?: {
    shippingCost?: string;
    shippingType?: string;
    handlingTime?: string;
  };
  returnPolicy?: {
    returnsAccepted?: boolean;
    returnPeriod?: string;
    returnShippingCostPayer?: string;
  };
  watchCount?: number;
  quantityAvailable?: number;
  itemLocation?: string;
}

export interface ProductViewProps {
  product: Product;
  priceData: PriceData[];
  recommendedProducts: Product[];
  salesData: SaleItem[] | null;
  dailySalesData: DailySaleItem[] | null;
  ebayData?: EbaySpecificData | null;
}

export default function ProductView({
  product,
  priceData,
  recommendedProducts,
  salesData,
  dailySalesData,
  ebayData,
}: ProductViewProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [mntRate, setMntRate] = useState<number | null>(null);
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(true);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const { addToRecentlyViewed, recentlyViewed } = useRecentlyViewed();

  // Detect if this is an eBay product
  const isEbayProduct = useMemo(() => {
    return product?.productCategory === 'eBay' || product?.brandName === 'eBay Listing' || !!ebayData;
  }, [product, ebayData]);

  // Sanity shop products already store MNT prices. Treat conversion rate as 1.
  const isSanityShopProduct = useMemo(() => product?.productCategory === 'Sanity', [product]);

  const imagesForPagination = useMemo(() => {
    const images =
      product?.productTemplateExternalPictures
        ?.map((img) => img.mainPictureUrl)
        .filter(Boolean) || [];
    if (images.length === 0 && product?.mainPictureUrl) {
      images.push(product.mainPictureUrl);
    }
    return images;
  }, [product]);

  const sizeOptions = useMemo(() => {
    return [...new Set(priceData?.map((item) => item.sizeOption?.presentation))]
      .filter((size): size is string => typeof size === 'string')
      .sort((a, b) => {
        const sizeA = parseFloat(a);
        const sizeB = parseFloat(b);
        if (isNaN(sizeA) || isNaN(sizeB)) return a.localeCompare(b);
        return sizeA - sizeB;
      });
  }, [priceData]);

  const selectedVariantData = useMemo(
    () =>
      priceData.find((item) => item.sizeOption?.presentation === selectedSize),
    [priceData, selectedSize]
  );

  const normalizeDisplayPriceCents = useCallback(
    (rawAmount: number | null | undefined) => {
      if (rawAmount === null || rawAmount === undefined || rawAmount <= 0) return null;
      if (!isSanityShopProduct) return rawAmount;

      // Some legacy Sanity items were saved in MNT (e.g. 580000) instead of cents.
      // If converting to MNT yields an unrealistically tiny value, treat it as direct MNT.
      const asMntFromCents = rawAmount / 100;
      if (rawAmount >= 50_000 && asMntFromCents < 10_000) {
        return rawAmount * 100;
      }

      return rawAmount;
    },
    [isSanityShopProduct]
  );

  const isVariantInStock = useCallback((variant: PriceData | null | undefined) => {
    if (!variant) return false;
    const status = (variant.stockStatus || '').toLowerCase();
    return status !== 'out_of_stock' && status !== 'sold_out';
  }, []);

  const selectedVariantPrice = normalizeDisplayPriceCents(
    selectedVariantData?.lastSoldPriceCents?.amount
  );

  const canAddToCart = useMemo(
    () =>
      !!(
        selectedVariantData &&
        isVariantInStock(selectedVariantData) &&
        selectedVariantPrice &&
        selectedVariantPrice > 0 &&
        mntRate !== null
      ),
    [selectedVariantData, selectedVariantPrice, mntRate, isVariantInStock]
  );

  const lowestPriceData = useMemo(() => {
    if (!priceData?.length || mntRate === null) return null;
    const validPriceItems = priceData.filter(
      (item) =>
        normalizeDisplayPriceCents(item.lastSoldPriceCents?.amount) &&
        isVariantInStock(item) &&
        item.sizeOption?.presentation
    );
    if (validPriceItems.length === 0) return null;
    const lowestPriceItem = validPriceItems.reduce((lowest, current) => {
      const currentPrice = normalizeDisplayPriceCents(current.lastSoldPriceCents?.amount) || 0;
      const lowestPrice = normalizeDisplayPriceCents(lowest.lastSoldPriceCents?.amount) || 0;
      return currentPrice < lowestPrice ? current : lowest;
    });
    const normalizedLowestPrice = normalizeDisplayPriceCents(
      lowestPriceItem.lastSoldPriceCents?.amount
    );
    if (!normalizedLowestPrice) return null;
    return {
      price: normalizedLowestPrice,
      size: lowestPriceItem.sizeOption?.presentation,
      data: lowestPriceItem,
    };
  }, [priceData, mntRate, isVariantInStock, normalizeDisplayPriceCents]);

  const lowestPrice = useMemo(() => {
    if (!lowestPriceData || !mntRate) return null;
    return (lowestPriceData.price! * mntRate) / 100;
  }, [lowestPriceData, mntRate]);

  const formattedDate = useMemo(
    () => formatReleaseDate(product.releaseDate),
    [product.releaseDate]
  );

  useEffect(() => {
    if (product?.id) {
      addToRecentlyViewed({
        id: product.id,
        name: product.name,
        mainPictureUrl: product.mainPictureUrl,
        slug: product.slug,
        brandName: product.brandName,
      });
    }
  }, [product?.id, addToRecentlyViewed]);

  useEffect(() => {
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const fetchCurrencyData = async () => {
      try {
        if (isSanityShopProduct) {
          setMntRate(1);
          setCurrencyError(null);
          setIsCurrencyLoading(false);
          return;
        }
        setIsCurrencyLoading(true);
        timeoutId = setTimeout(
          () => abortController.abort(),
          CURRENCY_FETCH_TIMEOUT
        );
        const res = await fetch('/api/getcurrencydata', {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error('Failed to fetch currency data');
        const currencyResult = await res.json();
        if (currencyResult.mnt) {
          setMntRate(currencyResult.mnt);
          setCurrencyError(null);
        } else {
          throw new Error('MNT rate not available');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setCurrencyError('Request timed out');
        } else {
          setCurrencyError(
            err instanceof Error ? err.message : 'Failed to fetch currency'
          );
        }
      } finally {
        setIsCurrencyLoading(false);
        clearTimeout(timeoutId);
      }
    };

    fetchCurrencyData();
    return () => {
      abortController.abort();
      clearTimeout(timeoutId);
    };
  }, [isSanityShopProduct]);

  const handleAccordionToggle = useCallback((accordionId: string) => {
    setOpenAccordion((prev) => (prev === accordionId ? null : accordionId));
  }, []);

  const handleImageClick = useCallback(() => setShowImageZoom(true), []);
  const handleCloseZoom = useCallback(() => setShowImageZoom(false), []);

  const handleAddToCart = useCallback(async () => {
    if (!product || !selectedSize || mntRate === null) {
      toast.error('Cannot add to cart. Missing product data, size, or currency rate.');
      return;
    }
    const selectedProductVariant = priceData.find(
      (item) => item.sizeOption?.presentation === selectedSize
    );
    if (selectedProductVariant) {
      if (!isVariantInStock(selectedProductVariant)) {
        toast.error('Selected size is out of stock.');
        return;
      }
      const priceCents = normalizeDisplayPriceCents(
        selectedProductVariant.lastSoldPriceCents?.amount
      );
      if (
        priceCents === null ||
        priceCents === undefined ||
        priceCents <= 0
      ) {
        toast.error('Price is unavailable for the selected size.');
        return;
      }
      const price = (priceCents * mntRate) / 100;
      const imageUrl =
        imagesForPagination[0] || product.mainPictureUrl || PLACEHOLDER_IMAGE;
      addToCart(product, selectedSize, price, imageUrl);
      toast.custom(
        (t) => (
          <NotificationCard
            title="Added to cart"
            description={`${product.name} — Size: ${selectedSize}`}
            variant="product-added"
            onDismiss={() => toast.dismiss(t)}
            dismissible
          />
        ),
        { duration: 4000 }
      );
    } else {
      toast.error('Selected size is not available for purchase.');
    }
  }, [product, selectedSize, mntRate, priceData, imagesForPagination, addToCart, isVariantInStock, normalizeDisplayPriceCents]);

  if (!product) return <ProductPageSkeleton />;

  if (currencyError && !isCurrencyLoading) {
    return (
      <div className="text-red-500 text-center p-10">
        Error loading currency data: {currencyError}
      </div>
    );
  }

  const recentlyViewedFiltered = recentlyViewed
    .filter((item) => item.id !== product?.id)
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-0 min-h-screen">
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl">
        <div className="h-fit w-full flex flex-col lg:flex-row gap-8">
          <ImageGallery
            images={imagesForPagination}
            productName={product.name}
            onImageClick={handleImageClick}
          />

          <div className="text-white flex flex-col justify-start items-start w-full lg:w-1/2 lg:p-4">
            <span className="flex space-x-1 text-xs text-white/70 mb-2">
              <Link href="/" className="hover:underline hover:text-white transition-colors duration-200">
                Home
              </Link>
              <span className="text-white/50">/</span>
              <Link
                href={`/category/${product.productCategory.toLowerCase()}`}
                className="hover:underline capitalize hover:text-white transition-colors duration-200"
              >
                {product.productCategory}
              </Link>
              {!isEbayProduct && (
                <>
                  <span className="text-white/50">/</span>
                  <Link
                    href={`/type/${product.productType.toLowerCase()}`}
                    className="hover:underline capitalize hover:text-white transition-colors duration-200"
                  >
                    {product.productType}
                  </Link>
                  <span className="text-white/50">/</span>
                  <Link
                    href={`/type/${product.brandName.toLowerCase()}`}
                    className="hover:underline capitalize hover:text-white transition-colors duration-200"
                  >
                    {product.brandName}
                  </Link>
                </>
              )}
            </span>
            
            {/* eBay Badge */}
            {isEbayProduct && (
              <div className="mb-3 inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-400/30">
                <GlobeAltIcon className="h-4 w-4 text-blue-300" />
                <span className="text-blue-200 text-sm font-semibold">eBay Marketplace</span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-[30px] tracking-tight leading-tight font-semibold mb-4 text-white drop-shadow-lg">
              {product.name}
            </h1>

            {/* eBay-specific quick info */}
            {isEbayProduct && ebayData && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-400/20 rounded-xl p-4 mb-4 w-full">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {ebayData.condition && (
                    <div>
                      <span className="text-white/60 block mb-1">Condition</span>
                      <span className="text-white font-semibold">{ebayData.condition}</span>
                    </div>
                  )}
                  {ebayData.itemLocation && (
                    <div>
                      <span className="text-white/60 block mb-1">Location</span>
                      <span className="text-white font-semibold">{ebayData.itemLocation}</span>
                    </div>
                  )}
                  {ebayData.quantityAvailable !== undefined && (
                    <div>
                      <span className="text-white/60 block mb-1">Available</span>
                      <span className="text-white font-semibold">{ebayData.quantityAvailable} unit(s)</span>
                    </div>
                  )}
                  {ebayData.watchCount !== undefined && ebayData.watchCount > 0 && (
                    <div>
                      <span className="text-white/60 block mb-1">Watchers</span>
                      <span className="text-white font-semibold">{ebayData.watchCount} watching</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <TruckIcon className="h-4 w-4 text-white" />
              <span className="text-sm text-neutral-100">
                <span className="font-semibold">
                  {isEbayProduct && ebayData?.shipping?.shippingType 
                    ? ebayData.shipping.shippingType 
                    : 'XpressShip'}
                </span> 
                {' '}Delivery in {isEbayProduct ? '1-2' : '2'} weeks. 
                {isEbayProduct && ebayData?.shipping?.shippingCost && (
                  <span className="ml-1 text-blue-300">
                    Shipping: {ebayData.shipping.shippingCost}
                  </span>
                )}
              </span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm w-full h-[1px] my-6 md:my-10" />

            <SizeSelector
              sizeOptions={sizeOptions}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
            />

            <PriceDisplay
              selectedSize={selectedSize}
              selectedVariantPrice={selectedVariantPrice}
              lowestPrice={lowestPrice}
              mntRate={mntRate}
              canAddToCart={canAddToCart}
              onAddToCart={handleAddToCart}
            />

            {/* eBay View on eBay button */}
            {isEbayProduct && ebayData?.itemWebUrl && (
              <a
                href={ebayData.itemWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full bg-blue-600/80 hover:bg-blue-600 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
              >
                <GlobeAltIcon className="h-5 w-5" />
                View on eBay
              </a>
            )}
          </div>
        </div>

        {/* Product Details - Different for eBay */}
        <div className="w-full bg-black/30 backdrop-blur-xl border border-white/20 mt-8 p-6 md:p-8 rounded-4xl shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 drop-shadow-lg">
            Product Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-white">
            {!isEbayProduct ? (
              <>
                <div>
                  <span className="text-white/60 text-sm block mb-1">SKU</span>
                  <span className="text-white font-medium">{product.details || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Color</span>
                  <span className="text-white font-medium">{product.color || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Gender</span>
                  <span className="text-white font-medium">
                    {product.gender?.join(', ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Upper Material</span>
                  <span className="text-white font-medium">
                    {product.upperMaterial || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Midsole</span>
                  <span className="text-white font-medium">{product.midsole || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Release Date</span>
                  <span className="text-white font-medium">{formattedDate}</span>
                </div>
              </>
            ) : (
              <>
                {/* eBay-specific details */}
                <div>
                  <span className="text-white/60 text-sm block mb-1">Item ID</span>
                  <span className="text-white font-medium">{product.details || product.id}</span>
                </div>
                {ebayData?.condition && (
                  <div>
                    <span className="text-white/60 text-sm block mb-1">Condition</span>
                    <span className="text-white font-medium">{ebayData.condition}</span>
                  </div>
                )}
                {ebayData?.conditionDescription && (
                  <div className="sm:col-span-2">
                    <span className="text-white/60 text-sm block mb-1">Condition Details</span>
                    <span className="text-white font-medium">{ebayData.conditionDescription}</span>
                  </div>
                )}
                {ebayData?.itemLocation && (
                  <div>
                    <span className="text-white/60 text-sm block mb-1">Item Location</span>
                    <span className="text-white font-medium">{ebayData.itemLocation}</span>
                  </div>
                )}
                {ebayData?.quantityAvailable !== undefined && (
                  <div>
                    <span className="text-white/60 text-sm block mb-1">Quantity Available</span>
                    <span className="text-white font-medium">{ebayData.quantityAvailable}</span>
                  </div>
                )}
              </>
            )}

            {selectedSize && selectedVariantData && (
              <>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Stock Status</span>
                  <span className="text-white font-medium">
                    {selectedVariantData.stockStatus || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Shoe Condition</span>
                  <span className="text-white font-medium">
                    {selectedVariantData.shoeCondition || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-white/60 text-sm block mb-1">Box Condition</span>
                  <span className="text-white font-medium">
                    {selectedVariantData.boxCondition || 'N/A'}
                  </span>
                </div>
              </>
            )}
            {product.story && (
              <div className="sm:col-span-2 mt-4">
                <span className="text-white/60 text-sm block mb-1">
                  {isEbayProduct ? 'Description' : 'Story'}
                </span>
                <p className="text-white font-medium leading-relaxed">
                  {product.story}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* eBay Seller Information */}
        {isEbayProduct && ebayData?.seller && (
          <div className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-400/20 mt-8 p-6 md:p-8 rounded-4xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserIcon className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                Seller Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {ebayData.seller.username && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <span className="text-white/60 text-sm block mb-2">Seller</span>
                  <span className="text-white font-bold text-lg">{ebayData.seller.username}</span>
                </div>
              )}
              {ebayData.seller.feedbackPercentage && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <span className="text-white/60 text-sm block mb-2">Positive Feedback</span>
                  <span className="text-green-400 font-bold text-lg">{ebayData.seller.feedbackPercentage}</span>
                </div>
              )}
              {ebayData.seller.feedbackScore !== undefined && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <span className="text-white/60 text-sm block mb-2">Feedback Score</span>
                  <span className="text-blue-300 font-bold text-lg">{ebayData.seller.feedbackScore.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {/* Show sales data only for non-eBay products */}
          {!isEbayProduct && salesData && salesData.length > 0 && (
            <AccordionItem
              title="Sales History"
              isOpen={openAccordion === 'sales-history'}
              onToggle={() => handleAccordionToggle('sales-history')}
              icon={<ClockIcon className="h-5 w-5" />}
            >
              <SalesHistoryContent salesData={salesData} mntRate={mntRate} />
            </AccordionItem>
          )}

          {!isEbayProduct && dailySalesData && dailySalesData.length > 0 && (
            <AccordionItem
              title="Daily Sales Trend"
              isOpen={openAccordion === 'daily-sales'}
              onToggle={() => handleAccordionToggle('daily-sales')}
              icon={<ChartBarIcon className="h-5 w-5" />}
            >
              <DailySalesContent
                dailySalesData={dailySalesData}
                mntRate={mntRate}
              />
            </AccordionItem>
          )}

          <ProductViewAccordionSections
            openAccordion={openAccordion}
            onToggle={handleAccordionToggle}
            selectedSize={selectedSize}
            isEbayProduct={isEbayProduct}
            ebayData={ebayData}
          />
        </div>

        {!isEbayProduct && (
          <ProductViewRecommended
            products={recommendedProducts}
            mntRate={mntRate}
            title="You Might Also Like"
          />
        )}
      </div>

      {recentlyViewedFiltered.length > 0 && (
        <ProductViewRecommended
          products={recentlyViewedFiltered}
          mntRate={mntRate}
          title="Recently Viewed"
          showPrice={false}
        />
      )}

      <AnimatePresence>
        {showImageZoom && (
          <ImageZoomModal
            images={imagesForPagination}
            initialIndex={0}
            onClose={handleCloseZoom}
          />
        )}
      </AnimatePresence>

      <Toaster
        position="bottom-right"
        className="sonner-toast-smooth"
        toastOptions={{
          style: {
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
          },
        }}
      />
    </div>
  );
}
