'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface PriceDisplayProps {
  selectedSize: string | null;
  selectedVariantPrice: number | null | undefined;
  lowestPrice: number | null;
  mntRate: number | null;
  canAddToCart: boolean;
  onAddToCart: () => void;
}

export function PriceDisplay({
  selectedSize,
  selectedVariantPrice,
  lowestPrice,
  mntRate,
  canAddToCart,
  onAddToCart,
}: PriceDisplayProps) {
  const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
  const MOTION_DURATION = 0.2;

  const cardClassName =
    'w-full mt-5 rounded-3xl border border-white/15 bg-black/35 backdrop-blur-2xl p-4 sm:p-5 shadow-xl';

  const ctaClassName = `w-full h-12 rounded-2xl font-semibold text-base transition-all duration-200 ${
    canAddToCart
      ? 'bg-white text-black hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0'
      : 'bg-white/10 text-white/45 border border-white/10 cursor-not-allowed'
  }`;

  if (mntRate === null) {
    return (
      <div className={cardClassName}>
        <p className="text-sm font-medium text-yellow-300">Loading price information...</p>
      </div>
    );
  }

  if (selectedSize) {
    if (
      selectedVariantPrice === null ||
      selectedVariantPrice === undefined ||
      selectedVariantPrice <= 0
    ) {
      return (
        <div className={cardClassName}>
          <p className="text-sm font-medium text-yellow-300">Selected size is currently unavailable.</p>
        </div>
      );
    }

    const displayPrice = (selectedVariantPrice * mntRate) / 100;
    const formattedPrice = displayPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return (
      <div className={cardClassName}>
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Selected Size</p>
            <p className="text-white text-base font-semibold mb-3">US {selectedSize}</p>
            <h2 className="text-white/75 text-sm font-medium mb-1">Buy now for</h2>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${selectedSize}-${formattedPrice}`}
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
                transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
                className="block text-4xl md:text-5xl font-bold text-white"
              >
                ₮{formattedPrice}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={canAddToCart ? { y: -2, scale: 1.01 } : undefined}
            whileTap={canAddToCart ? { y: 0, scale: 0.985 } : undefined}
            transition={{ type: 'spring', stiffness: 360, damping: 25 }}
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className={ctaClassName}
          >
            {canAddToCart ? 'Add to Cart' : 'Unavailable'}
          </motion.button>
        </div>
      </div>
    );
  }

  if (lowestPrice !== null) {
    const formattedLowestPrice = lowestPrice.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return (
      <div className={cardClassName}>
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-white/60 mb-1">From</p>
            <h2 className="text-white/75 text-sm font-medium mb-1">Lowest price</h2>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={formattedLowestPrice}
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
                transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
                className="block text-4xl md:text-5xl font-bold text-white"
              >
                ₮{formattedLowestPrice}
              </motion.span>
            </AnimatePresence>
            <p className="text-white/55 text-sm mt-2">Price shown across available sizes.</p>
          </div>

          <button
            disabled
            className="w-full h-12 rounded-2xl font-semibold text-base bg-white/10 text-white/45 border border-white/10 cursor-not-allowed"
          >
            Select Size to Add to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClassName}>
      <div className="text-center py-6">
        <p className="text-white/70 text-base font-medium mb-1">Select a size to see your final price.</p>
        <p className="text-white/45 text-sm">
          All sizes include authentication and buyer protection
        </p>
      </div>
    </div>
  );
}
