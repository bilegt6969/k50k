// lib/sanity.ts
// This file configures and exports the Sanity client and an image URL builder.

import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

/**
 * The configured Sanity client (read-only, for browser/server).
 * Uses environment variables only (no hardcoded fallbacks). Set in .env.local:
 * NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 */
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2023-05-03',
  useCdn: true,
})

/**
 * Server-side Sanity client with write token (for API routes only).
 * Requires SANITY_WRITE_TOKEN environment variable with write permissions.
 */
export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2023-05-03',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// Create an image URL builder instance
const builder = imageUrlBuilder(client)

/**
 * A helper function to generate image URLs from Sanity image sources.
 * This is the standard way to render images from Sanity in a Next.js app.
 * @param source - The Sanity image source object.
 * @returns A URL builder instance for the given image source.
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format').quality(90) // <-- Added .quality(90) for better image quality
}
// GROQ query to fetch a single product collection by slug
export const getProductCollectionQuery = `
  *[_type == "productCollection" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    mode,
    autoType,
    autoCategoryKeyword,
    "products": products[]->{
      _id,
      title,
      brand,
      category,
      productType,
      kickProductId,
      "slug": slug.current,
      imageUrl,
      imageUrls,
      published,
      publishedAt,
      updatedAt,
      viewCount,
      searchCount,
      "sizes": sizes[]{
        sizeUS,
        sizeEU,
        "priceCents": coalesce(priceCents, price, 0),
        stock
      }
    },
    limit,
    enabled,
    order
  }
`;

// GROQ query to fetch all product collections metadata (for listing)
export const getAllProductCollectionsQuery = `
  *[_type == "productCollection" && enabled == true] | order(order asc) {
    _id,
    name,
    "slug": slug.current,
    mode,
    autoType,
    autoCategoryKeyword,
    limit,
    order
  }
`;

// GROQ query to fetch all product collections with full data (for reference)
export const getAllProductCollectionsWithDataQuery = `
  *[_type == "productCollection"] | order(order asc) {
    _id,
    name,
    "slug": slug.current,
    mode,
    autoType,
    autoCategoryKeyword,
    products[]->{
      _id,
      title,
      "slug": slug.current
    },
    limit,
    enabled,
    order
  }
`;