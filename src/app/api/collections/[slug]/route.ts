import { type NextRequest, NextResponse } from 'next/server'

import { client, getProductCollectionQuery } from '../../../../../lib/sanity'

interface ResolvedParams {
  slug: string
}

interface SanitySize {
  sizeUS: string
  sizeEU: string
  priceCents: number
  stock: number
}

interface SanityProductDoc {
  _id: string
  title: string
  brand?: string
  slug: string
  kickProductId?: string
  category?: string
  productType?: string
  imageUrl?: string
  imageUrls?: string[]
  published?: boolean
  publishedAt?: string
  updatedAt?: string
  viewCount?: number
  searchCount?: number
  sizes?: SanitySize[]
}

interface SanityCollection {
  _id: string
  name: string
  slug: string
  mode: 'manual' | 'auto' | 'json'
  autoType?: 'recent' | 'trending' | 'mostViewed' | 'mostSearched' | 'byCategory'
  autoCategoryKeyword?: string
  products?: SanityProductDoc[]
  rawProductJson?: string
  limit?: number
  enabled?: boolean
}

export interface ApiProduct {
  id: string
  name: string
  brand?: string
  image: string
  slug: string
  price: number
  collection?: string
}

export interface ApiResponse {
  products: ApiProduct[]
  collectionName: string
  collectionSlug: string
  hasMore: boolean
  total: number
  currentPage: number
  totalPages: number
  error?: string
}

const RESULTS_PER_PAGE = 24
export const dynamic = 'force-dynamic'
export const revalidate = 0

function validatePageNumber(pageQuery: string | null): number {
  if (!pageQuery) return 1
  const pageNum = parseInt(pageQuery, 10)
  if (isNaN(pageNum) || pageNum < 1) return 1
  return pageNum
}

function normalizePriceToMnt(rawPrice: number): number {
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return 0
  // Some legacy records were saved as MNT * 100.
  if (rawPrice >= 10_000_000 && rawPrice % 100 === 0) {
    return Math.round(rawPrice / 100)
  }
  return Math.round(rawPrice)
}

function toApiProduct(item: SanityProductDoc | ApiProduct, collectionName: string): ApiProduct {
  // Handle both SanityProductDoc and ApiProduct (from JSON)
  if ('kickProductId' in item || '_id' in item) {
    // SanityProductDoc case
    const sanityItem = item as SanityProductDoc
    const sizes = sanityItem.sizes || []
    const validPrices = sizes
      .map((s) => normalizePriceToMnt(Number(s.priceCents)))
      .filter((price) => Number.isFinite(price) && price > 0)
    
    // Debug logging
    console.log(`[DEBUG] Product: ${sanityItem.title}, Sizes: ${JSON.stringify(sizes)}, ValidPrices: ${validPrices.length}`)
    
    const minPrice = validPrices.length
      ? Math.min(...validPrices)
      : 0
    
    console.log(`[DEBUG] Product: ${sanityItem.title}, minPrice: ${minPrice}`)

    return {
      id: String(sanityItem.kickProductId || sanityItem._id),
      name: sanityItem.title,
      brand: sanityItem.brand || '',
      image:
        (Array.isArray(sanityItem.imageUrls) && sanityItem.imageUrls.length ? sanityItem.imageUrls[0] : null) ||
        sanityItem.imageUrl ||
        'https://placehold.co/800x800?text=No+Image',
      slug: sanityItem.slug,
      price: minPrice,
      collection: collectionName,
    }
  } else {
    // ApiProduct case (from JSON) - return as-is
    const apiItem = item as ApiProduct
    return {
      ...apiItem,
      price: normalizePriceToMnt(Number(apiItem.price || 0)),
    }
  }
}

function parseJsonProducts(rawJson: string): ApiProduct[] {
  try {
    const parsed = JSON.parse(rawJson)
    if (!parsed.products || !Array.isArray(parsed.products)) {
      return []
    }
    
    return parsed.products.map((product: any) => ({
      id: String(product.id),
      name: product.title,
      brand: typeof product.brand === 'string' ? product.brand : '',
      image: product.pictureUrl,
      slug: product.slug,
      price: normalizePriceToMnt(Number(product.price || 0)),
      collection: '',
    }))
  } catch (e) {
    console.error('Failed to parse JSON products:', e)
    return []
  }
}

function dedupeSanityProducts(products: SanityProductDoc[]): SanityProductDoc[] {
  const seen = new Set<string>()
  const result: SanityProductDoc[] = []
  for (const p of products) {
    const key = p._id || p.kickProductId || ''
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(p)
  }
  return result
}

function dedupeApiProducts(products: ApiProduct[]): ApiProduct[] {
  const seen = new Set<string>()
  const result: ApiProduct[] = []
  for (const p of products) {
    const key = p.id || p.slug || ''
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(p)
  }
  return result
}

function paginateProducts(products: ApiProduct[], page: number, perPage: number) {
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const paginatedProducts = products.slice(startIndex, endIndex)
  const totalPages = Math.ceil(products.length / perPage)
  const hasMore = page < totalPages

  return {
    products: paginatedProducts,
    hasMore,
    totalPages,
    total: products.length,
  }
}

const productProjection = `{
    _id,
    title,
    brand,
    "slug": slug.current,
    kickProductId,
    category,
    productType,
    imageUrl,
    imageUrls,
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
  }`

async function getAutoProducts(collection: SanityCollection): Promise<SanityProductDoc[]> {
  const limit = Math.min(100, Math.max(1, Number(collection.limit || 24)))

  if (collection.autoType === 'byCategory') {
    const raw = (collection.autoCategoryKeyword || '').replace(/[*"\\]/g, '').trim().toLowerCase()
    if (!raw) return []
    const pattern = `*${raw}*`
    const query = `*[_type == "product" && published == true && (
      (defined(category) && lower(category) match $pattern) ||
      (defined(productType) && lower(productType) match $pattern) ||
      lower(title) match $pattern
    )] | order(publishedAt desc, updatedAt desc) [0...$limit] ${productProjection}`
    return await client.fetch<SanityProductDoc[]>(query, { limit, pattern })
  }

  let sort = 'publishedAt desc, updatedAt desc'
  if (collection.autoType === 'trending' || collection.autoType === 'mostViewed') {
    sort = 'viewCount desc, publishedAt desc, updatedAt desc'
  } else if (collection.autoType === 'mostSearched') {
    sort = 'searchCount desc, publishedAt desc, updatedAt desc'
  }

  const query = `*[_type == "product" && published == true] | order(${sort}) [0...$limit] ${productProjection}`
  return await client.fetch<SanityProductDoc[]>(query, { limit })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<ResolvedParams> }
): Promise<NextResponse<ApiResponse>> {
  let slug: string | undefined
  let pageNum = 1

  try {
    const resolvedParams = await params
    slug = resolvedParams.slug
    pageNum = validatePageNumber(request.nextUrl.searchParams.get('page'))

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        {
          products: [],
          collectionName: '',
          collectionSlug: '',
          hasMore: false,
          total: 0,
          currentPage: pageNum,
          totalPages: 0,
          error: 'Slug parameter is missing or invalid',
        },
        { status: 400 }
      )
    }

    const collection = await client.fetch<SanityCollection>(getProductCollectionQuery, { slug })
    if (!collection || collection.enabled === false) {
      return NextResponse.json(
        {
          products: [],
          collectionName: '',
          collectionSlug: slug,
          hasMore: false,
          total: 0,
          currentPage: pageNum,
          totalPages: 0,
          error: `Collection "${slug}" not found`,
        },
        { status: 404 }
      )
    }

    const rawSource =
      collection.mode === 'auto'
        ? await getAutoProducts(collection)
        : collection.mode === 'json' && collection.rawProductJson
          ? parseJsonProducts(collection.rawProductJson)
          : (collection.products || []).filter((p) => p.published !== false)

    const sourceProducts =
      collection.mode === 'json'
        ? dedupeApiProducts(rawSource as ApiProduct[])
        : dedupeSanityProducts(rawSource as SanityProductDoc[])

    const allProducts = sourceProducts.map((p) => toApiProduct(p, collection.name))
    const paginationResult = paginateProducts(allProducts, pageNum, RESULTS_PER_PAGE)

    return NextResponse.json({
      products: paginationResult.products,
      collectionName: collection.name,
      collectionSlug: collection.slug,
      hasMore: paginationResult.hasMore,
      total: paginationResult.total,
      currentPage: pageNum,
      totalPages: paginationResult.totalPages,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown server error occurred'
    return NextResponse.json(
      {
        products: [],
        collectionName: '',
        collectionSlug: slug || '',
        hasMore: false,
        total: 0,
        currentPage: pageNum,
        totalPages: 0,
        error: message,
      },
      { status: 500 }
    )
  }
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<ResolvedParams> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params
    if (!resolvedParams.slug) {
      return NextResponse.json({}, { status: 400 })
    }
    return NextResponse.json({}, { status: 200 })
  } catch {
    return NextResponse.json({}, { status: 500 })
  }
}
