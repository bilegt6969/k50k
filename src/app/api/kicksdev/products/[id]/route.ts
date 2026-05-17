import { NextRequest } from 'next/server'

import { jsonWithAdminCors } from '@/lib/admin-api-cors'

import type { AdminKickProduct } from '../../search/route'

type KickGoatVariant = {
  product_id: number
  size: string
  lowest_ask: number
  available: boolean
  currency: string
  updated_at: string
}

type KickGoatProduct = {
  id: number
  sku: string
  slug: string
  name: string
  brand: string
  model: string
  description: string
  colorway: string
  season: string
  category: string
  product_type: string
  image_url: string
  images?: string[]
  sizes: Array<{ presentation: string; value: number }>
  variants?: KickGoatVariant[]
}

type KickStockXVariant = {
  id: string
  size: string
  size_type: string
  lowest_ask: number
  total_asks: number
  currency: string
  market: string
}

type KickStockXProduct = {
  id: string
  title: string
  brand: string
  model: string
  gender: string
  description: string
  image: string
  gallery?: string[]
  slug: string
  product_type: string
  category: string
  variants?: KickStockXVariant[]
}

function unwrapProduct<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null
  // Common Kicksdev patterns: {data: {...}} or {data: {data: {...}}}
  const anyJson = json as any
  if (anyJson?.data && typeof anyJson.data === 'object') {
    if (anyJson.data?.data && typeof anyJson.data.data === 'object') return anyJson.data.data as T
    return anyJson.data as T
  }
  return json as T
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const marketplace = (request.nextUrl.searchParams.get('marketplace') || 'goat') as
    | 'goat'
    | 'stockx'

  const apiKey = process.env.KICKS_DEV_API_KEY
  if (!apiKey) {
    return jsonWithAdminCors(
      request,
      { success: false, error: 'KICKS_DEV_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const baseUrl =
    marketplace === 'stockx'
      ? `https://api.kicks.dev/v3/stockx/products/${encodeURIComponent(id)}`
      : `https://api.kicks.dev/v3/goat/products/${encodeURIComponent(id)}`

  try {
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) {
      return jsonWithAdminCors(
        request,
        { success: false, error: `Kicksdev product detail failed (${res.status})` },
        { status: 502 }
      )
    }

    if (marketplace === 'stockx') {
      const raw = (await res.json()) as unknown
      const product = unwrapProduct<KickStockXProduct>(raw)
      if (!product) {
        return jsonWithAdminCors(
          request,
          { success: false, error: 'Unexpected StockX product response shape' },
          { status: 502 }
        )
      }
      const sizes =
        (product.variants || []).map((v) => ({
          size: v.size,
          available: (v.total_asks || 0) > 0,
          lowestAsk: typeof v.lowest_ask === 'number' ? v.lowest_ask : null,
          currency: v.currency || null,
          totalAsks: typeof v.total_asks === 'number' ? v.total_asks : null,
        })) || []

      const out: AdminKickProduct = {
        marketplace: 'stockx',
        kickProductId: String(product.id),
        kickSlug: product.slug,
        name: product.title,
        brand: product.brand,
        category: product.category,
        productType: product.product_type,
        imageUrl: product.image || null,
        imageUrls: Array.isArray(product.gallery) && product.gallery.length ? product.gallery : (product.image ? [product.image] : []),
        sizes,
      }

      return jsonWithAdminCors(request, { success: true, data: out })
    }

    const raw = (await res.json()) as unknown
    const product = unwrapProduct<KickGoatProduct>(raw)
    if (!product) {
      return jsonWithAdminCors(
        request,
        { success: false, error: 'Unexpected GOAT product response shape' },
        { status: 502 }
      )
    }
    const variants = (product.variants || []).slice()
    const variantBySize = new Map<string, KickGoatVariant>()
    for (const v of variants) variantBySize.set(v.size, v)

    const sizes =
      Array.isArray(product.sizes) && product.sizes.length > 0
        ? product.sizes.map((s) => {
            const v = variantBySize.get(s.presentation)
            return {
              size: s.presentation,
              available: v ? !!v.available : false,
              lowestAsk: v ? v.lowest_ask : null,
              currency: v ? v.currency : null,
              totalAsks: null as number | null,
            }
          })
        : variants.map((v) => ({
            size: v.size,
            available: !!v.available,
            lowestAsk: typeof v.lowest_ask === 'number' ? v.lowest_ask : null,
            currency: v.currency || null,
            totalAsks: null as number | null,
          }))

    const out: AdminKickProduct = {
      marketplace: 'goat',
      kickProductId: String(product.id),
      kickSlug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      productType: product.product_type,
      imageUrl: product.image_url || null,
      imageUrls: Array.isArray(product.images) && product.images.length ? product.images : (product.image_url ? [product.image_url] : []),
      sizes,
    }

    return jsonWithAdminCors(request, { success: true, data: out })
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      return jsonWithAdminCors(
        request,
        { success: false, error: 'Kicksdev request timed out. Check API key and network.' },
        { status: 504 }
      )
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonWithAdminCors(request, { success: false, error: message }, { status: 500 })
  }
}

