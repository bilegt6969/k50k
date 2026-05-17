import { createClient, type SanityClient } from '@sanity/client'

let _write: SanityClient | null = null

export function getSanityWriteClient(): SanityClient {
  if (_write) return _write
  const token = process.env.SANITY_WRITE_TOKEN
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  if (!token) {
    throw new Error('SANITY_WRITE_TOKEN is not set')
  }
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
  }
  _write = createClient({
    projectId,
    dataset,
    apiVersion: '2023-05-03',
    token,
    useCdn: false,
  })
  return _write
}
