// sanity/lib/client.ts
import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01', // Use current date or your preferred API version
  useCdn: false, // Set to true for production for faster responses
  token: process.env.SANITY_API_TOKEN, // Optional: only needed for mutations/writes
});

// Alternative: If you need different clients for different purposes
export const clientWithCdn = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for faster cached reads
});

export const clientForWrites = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN, // Required for mutations
});

/**
 * Environment Variables needed (.env.local):
 * 
 * NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
 * NEXT_PUBLIC_SANITY_DATASET=production
 * SANITY_API_TOKEN=your-token-here (optional, only for writes)
 * 
 * Find your project ID and dataset in your Sanity project dashboard
 * Generate a token at: manage.sanity.io → Your Project → API → Tokens
 */