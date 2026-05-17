import { NextRequest } from 'next/server'

import { jsonWithAdminCors } from '@/lib/admin-api-cors'

// Admin-only search endpoint: returns richer Kicksdev data (including sizes/availability)
// so the shop owner can curate prices + stock in Sanity.

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
  release_date: string
  release_date_year: string
  retail_prices: Record<string, number | undefined>
  link: string
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
  sku: string
  slug: string
  product_type: string
  category: string
  secondary_category: string
  categories: string[]
  gallery: string[]
  link: string
  rank: number
  weekly_orders: number
  min_price: number
  max_price: number
  avg_price: number
  upcoming: boolean
  release_date: string
  updated_at: string
  created_at: string
  variants?: KickStockXVariant[]
}

type KicksDevApiResponse<T> = {
  status: string
  data?: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
  error?: string
}

export type AdminKickProduct = {
  marketplace: 'goat' | 'stockx'
  kickProductId: string
  kickSlug: string
  name: string
  brand: string
  category: string
  productType: string
  imageUrl: string | null
  imageUrls?: string[]
  sizes: Array<{
    size: string
    available: boolean
    lowestAsk: number | null
    currency: string | null
    totalAsks: number | null
  }>
}

function buildFilterString(marketplace: 'goat' | 'stockx', params: URLSearchParams) {
  const goatFilters = ['brand', 'category', 'product_type', 'colorway', 'model', 'season']
  const stockxFilters = ['brand', 'gender', 'product_type', 'category', 'secondary_category', 'sku']

  const parts: string[] = []
  const keys = marketplace === 'stockx' ? stockxFilters : goatFilters

  keys.forEach((key) => {
    const value = params.get(key)
    if (!value) return
    parts.push(`${key} = "${value.replace(/"/g, '\\"')}"`)
  })

  if (marketplace === 'stockx') {
    const minPrice = params.get('min_price')
    const maxPrice = params.get('max_price')
    if (minPrice) parts.push(`min_price >= ${minPrice}`)
    if (maxPrice) parts.push(`max_price <= ${maxPrice}`)
  }

  return parts.length ? parts.join(' AND ') : null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query') || ''
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('page_limit') || '24')
  const marketplace = (searchParams.get('marketplace') || 'goat') as 'goat' | 'stockx'

  const apiKey = process.env.KICKS_DEV_API_KEY
  if (!apiKey) {
    return jsonWithAdminCors(
      request,
      { success: false, error: 'KICKS_DEV_API_KEY is not configured' },
      { status: 500 }
    )
  }

  if (!query.trim()) {
    return jsonWithAdminCors(request, { success: false, error: 'Missing `query` parameter' }, { status: 400 })
  }

  const baseUrl =
    marketplace === 'stockx'
      ? 'https://api.kicks.dev/v3/stockx/products'
      : 'https://api.kicks.dev/v3/goat/products'

  const apiURL = new URL(baseUrl)
  apiURL.searchParams.set('query', query)
  apiURL.searchParams.set('page', String(Math.max(1, page)))
  apiURL.searchParams.set('limit', String(Math.min(100, Math.max(1, limit))))

  const filterString = buildFilterString(marketplace, searchParams)
  if (filterString) apiURL.searchParams.set('filters', filterString)

  try {
    const res = await fetch(apiURL.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) {
      const body = await res.text()
      return jsonWithAdminCors(
        request,
        { success: false, error: `Kicksdev search failed (${res.status})`, details: body },
        { status: 502 }
      )
    }

    const json =
      (await res.json()) as KicksDevApiResponse<
        KickGoatProduct | KickStockXProduct
      >

    if (json.status === 'error') {
      return jsonWithAdminCors(
        request,
        { success: false, error: json.error || 'Kicksdev returned error' },
        { status: 502 }
      )
    }

    const productsRaw = json.data || []

    const products: AdminKickProduct[] =
      marketplace === 'stockx'
        ? (productsRaw as KickStockXProduct[]).map((p) => ({
            marketplace: 'stockx',
            kickProductId: String(p.id),
            kickSlug: p.slug,
            name: p.title,
            brand: p.brand,
            category: p.category,
            productType: p.product_type,
            imageUrl: p.image || null,
            sizes: (p.variants || []).map((v) => ({
              size: v.size,
              available: (v.total_asks || 0) > 0,
              lowestAsk: typeof v.lowest_ask === 'number' ? v.lowest_ask : null,
              currency: v.currency || null,
              totalAsks: typeof v.total_asks === 'number' ? v.total_asks : null,
            })),
          }))
        : (productsRaw as KickGoatProduct[]).map((p) => {
            const variants = (p.variants || []).slice()
            const variantBySize = new Map<string, KickGoatVariant>()
            for (const v of variants) variantBySize.set(v.size, v)

            const sizes =
              Array.isArray(p.sizes) && p.sizes.length > 0
                ? p.sizes.map((s) => {
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

            return {
              marketplace: 'goat' as const,
              kickProductId: String(p.id),
              kickSlug: p.slug,
              name: p.name,
              brand: p.brand,
              category: p.category,
              productType: p.product_type,
              imageUrl: p.image_url || null,
              sizes,
            }
          })

    return jsonWithAdminCors(request, {
      success: true,
      data: {
        products,
        totalCount: json.meta?.total ?? 0,
        hasMore: (json.meta.current_page + 1) * json.meta.per_page < (json.meta.total || 0),
        currentPage: json.meta.current_page,
        perPage: json.meta.per_page,
      },
    })
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      return jsonWithAdminCors(
        request,
        { success: false, error: 'Kicksdev search timed out. Check KICKS_DEV_API_KEY and network.' },
        { status: 504 }
      )
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return jsonWithAdminCors(request, { success: false, error: message }, { status: 500 })
  }
}

