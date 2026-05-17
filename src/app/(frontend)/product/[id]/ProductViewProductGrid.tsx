'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PLACEHOLDER_IMAGE, handleImageError } from './productViewUtils';
import type { Product } from '@/types/product';

interface ProductGridItem {
  id: string;
  name: string;
  mainPictureUrl: string;
  slug: string;
  brandName: string;
  productTemplateExternalPictures?: { mainPictureUrl: string }[];
  localizedSpecialDisplayPriceCents?: { amountUsdCents: number | null | undefined };
}

interface ProductGridProps {
  products: Product[] | ProductGridItem[];
  mntRate: number | null;
  title: string;
  showPrice?: boolean;
}

function ProductCard({
  product,
  mntRate,
  showPrice = true,
}: {
  product: ProductGridItem;
  mntRate: number | null;
  showPrice?: boolean;
}) {
  const mainImage =
    product.productTemplateExternalPictures?.[0]?.mainPictureUrl ||
    product.mainPictureUrl ||
    PLACEHOLDER_IMAGE;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group text-white bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg relative h-full flex flex-col transition-all duration-300 hover:bg-black/50 hover:border-white/30 hover:scale-105 hover:shadow-xl"
    >
      <div
        className="overflow-hidden rounded-t-lg relative bg-white/95 backdrop-blur-sm group-hover:bg-white transition-all duration-300"
        style={{ aspectRatio: '1 / 1' }}
      >
        <Image
          src={mainImage}
          alt={product.name}
          fill
          style={{ objectFit: 'contain' }}
          className="w-full h-full transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
          onError={(e) => handleImageError(e)}
        />
      </div>
      <div className="w-full border-t p-3 md:p-4 border-white/20 mt-auto flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm md:text-base leading-tight mb-2 line-clamp-2 group-hover:text-white/90 transition-colors duration-300">
            {product.name}
          </h3>
          <p className="text-xs md:text-sm text-white/60 group-hover:text-white/80 transition-colors duration-300">
            {product.brandName}
          </p>
        </div>
        {showPrice && product.localizedSpecialDisplayPriceCents?.amountUsdCents && mntRate && (
          <div className="mt-2">
            <p className="text-white font-semibold text-sm md:text-base">
              ₮
              {(
                (product.localizedSpecialDisplayPriceCents.amountUsdCents *
                  mntRate) /
                100
              ).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProductViewRecommended({
  products,
  mntRate,
  title,
  showPrice = true,
}: ProductGridProps) {
  if (!products?.length) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 drop-shadow-lg">
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            mntRate={mntRate}
            showPrice={showPrice}
          />
        ))}
      </div>
    </div>
  );
}
