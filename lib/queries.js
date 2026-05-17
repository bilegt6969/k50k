// web/lib/queries.js

import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// This query is now corrected to match your NEW schema.
export const heroQuery = `*[_type == "hero"][0]{
  carouselSettings,
  
  "slides": slides[]{
    _key,
    backgroundImage // We just need to fetch the single image field
  }
}`;


// --- The rest of the file remains the same ---

export const client = createClient({
  // Make sure these environment variables are set
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2023-05-03', // Use a recent API version
  useCdn: true, // `false` if you want to ensure fresh data
})

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}