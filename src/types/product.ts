/**
 * Shared product-related types used across the app
 */

export interface ProductImage {
  mainPictureUrl: string;
}

export interface Product {
  id: string;
  name: string;
  productCategory: string;
  productType: string;
  color: string;
  brandName: string;
  details: string;
  gender: string[];
  midsole: string;
  mainPictureUrl: string;
  releaseDate: string;
  slug: string;
  upperMaterial: string;
  singleGender: string;
  story: string;
  productTemplateExternalPictures?: ProductImage[];
  localizedSpecialDisplayPriceCents?: {
    amountUsdCents: number | null | undefined;
  };
}

export interface PriceData {
  sizeOption?: {
    presentation: string;
  };
  lastSoldPriceCents?: {
    amount: number | null | undefined;
  };
  stockStatus: string;
  shoeCondition: string;
  boxCondition: string;
}

export interface SaleItem {
  amount: number;
  currency: string;
  location: string;
  product_id: number;
  purchased_at: string;
  size_us: string;
  type: string;
}

export interface DailySaleItem {
  date: string;
  count: number;
  total_amount: number;
  currency: string;
}

/** Search/Navbar product shape (from API) */
export interface SearchProduct {
  id: string;
  title?: string;
  slug?: string;
  pictureUrl?: string;
  localizedRetailPriceCents?: {
    amountCents?: number | null;
  };
}

/** Full search API response product shape */
export interface SearchApiProduct {
  id: string;
  slug: string;
  pictureUrl: string;
  title: string;
  localizedRetailPriceCents?: {
    amountCents: number;
    currency?: string;
  };
  status?: string;
  inStock?: boolean;
  category?: string;
  brandName?: string;
  activitiesList?: unknown[];
  seasonYear?: string;
  productType?: string;
  underRetail?: boolean;
  gender?: string;
  releaseDate?: { seconds: number; nanos: number };
}
