import { createClient } from 'next-sanity'

/** Read-only Sanity client for admin pages (drafts / private dataset reads). */
export function getAdminSanityReadClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
  })
}
