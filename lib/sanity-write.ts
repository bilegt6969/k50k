// lib/sanity-write.ts
// This file configures and exports the Sanity write client with authentication.

import { createClient } from '@sanity/client'

/**
 * Get a Sanity client with write permissions.
 * Uses environment variables for authentication. Set in .env.local:
 * SANITY_PROJECT_ID, SANITY_DATASET, SANITY_WRITE_TOKEN
 */
export function getSanityWriteClient() {
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN

  if (!projectId) throw new Error('Missing SANITY_PROJECT_ID')
  if (!token) throw new Error('Missing SANITY_WRITE_TOKEN')

  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    token,
  })
}
