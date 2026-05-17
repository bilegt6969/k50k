// src/types/product.ts

export interface Product {
  id: string;
  slug: string;
  pictureUrl: string;
  title: string;
  localizedRetailPriceCents: {
    amountCents: number;
    currency: string;
  };
  status: 'available' | 'unavailable' | 'pre-release'; // Example statuses
  inStock: boolean;
  category: string;
  brandName: string;
  activitiesList: string[]; // e.g., ['running', 'basketball']
  releaseDate?: {
    seconds: number; // Unix timestamp in seconds
    nanos: number;
  };
  seasonYear: string;
  productType: string;
  underRetail: boolean;
  gender: string; // e.g., 'men', 'women', 'unisex'
}