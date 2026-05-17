import { type NextRequest, NextResponse } from 'next/server'
import { createClient, groq } from 'next-sanity'
import { globEscapeForGroqMatch } from '@/lib/groq-glob-escape'

interface LibrarySearchProduct {
  id: string
  slug: string
  title: string
  pictureUrl: string
  brand?: string
  /** MNT tugrik — used by search UI (prices are stored in MNT on product sizes). */
  priceMnt: number
  localizedRetailPriceCents: {
    amountCents: number
    currency: string
  }
}

function getReadClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || ''
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
  if (!projectId) {
    throw new Error('Missing Sanity project id')
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    perspective: 'published',
  })
}

function normalizePriceToMnt(rawPrice: number): number {
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return 0
  if (rawPrice >= 10_000_000 && rawPrice % 100 === 0) {
    return Math.round(rawPrice / 100)
  }
  return Math.round(rawPrice)
}

const NO_TEXT_PLACEHOLDER = '*\u200c__no_text_filter__\u200d*'

function globPatternFromUserInput(q: string): string {
  const t = q.trim().toLowerCase()
  if (!t) return NO_TEXT_PLACEHOLDER
  return `*${globEscapeForGroqMatch(t)}*`
}

type DocRow = {
  _id: string
  kickProductId?: string
  title?: string
  brand?: string
  slug?: string
  imageUrl?: string
  imageUrls?: string[]
  sizes?: Array<{ priceCents?: number }>
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const query = (params.get('query') || '').trim()
    const brand = (params.get('brand') || '').trim()
    const productType = (params.get('product_type') || '').trim()
    const sku = (params.get('sku') || '').trim()
    const colorway = (params.get('colorway') || '').trim()

    const page = Math.max(1, Number(params.get('page') || '1'))
    const pageLimit = Math.min(48, Math.max(1, Number(params.get('page_limit') || '12')))
    const start = (page - 1) * pageLimit
    const end = start + pageLimit

    const hasText = query.length > 0
    const hasRefinement = !!(brand || productType || sku || colorway)
    if (!hasText && !hasRefinement) {
      return NextResponse.json({
        success: true,
        data: {
          products: [] as LibrarySearchProduct[],
          totalCount: 0,
          hasMore: false,
          marketplace: 'library',
          currentPage: page,
          perPage: pageLimit,
        },
      })
    }

    const noTextFilter = !hasText
    const textPat = hasText ? globPatternFromUserInput(query) : NO_TEXT_PLACEHOLDER

    const noBrand = brand.length === 0
    const brandPat = noBrand ? NO_TEXT_PLACEHOLDER : globPatternFromUserInput(brand)

    const noProductType = productType.length === 0

    const noSku = sku.length === 0
    const skuPat = noSku ? NO_TEXT_PLACEHOLDER : globPatternFromUserInput(sku)

    const noColorway = colorway.length === 0
    const colorwayPat = noColorway ? NO_TEXT_PLACEHOLDER : globPatternFromUserInput(colorway)

    const bindings = {
      noTextFilter,
      textPat,
      noBrand,
      brandPat,
      noProductType,
      productType: productType.toLowerCase(),
      noSku,
      skuPat,
      noColorway,
      colorwayPat,
      start,
      end,
    }

    const filterBody = groq`
      _type == "product" &&
      coalesce(published, true) == true &&
      select(
        $noTextFilter => true,
        lower(coalesce(title, "")) match lower($textPat) ||
        lower(coalesce(brand, "")) match lower($textPat) ||
        lower(coalesce(category, "")) match lower($textPat) ||
        lower(coalesce(productType, "")) match lower($textPat) ||
        lower(coalesce(kickProductId, "")) match lower($textPat) ||
        lower(coalesce(kickSlug, "")) match lower($textPat) ||
        lower(coalesce(slug.current, "")) match lower($textPat)
      ) &&
      ($noBrand || lower(coalesce(brand, "")) match lower($brandPat)) &&
      ($noProductType || lower(coalesce(productType, "")) == lower($productType)) &&
      (
        $noSku ||
        lower(coalesce(kickProductId, "")) match lower($skuPat) ||
        lower(coalesce(kickSlug, "")) match lower($skuPat) ||
        lower(coalesce(title, "")) match lower($skuPat)
      ) &&
      ($noColorway || lower(coalesce(title, "")) match lower($colorwayPat))
    `

    const combined = groq`{
      "total": count(*[${filterBody}]),
      "items": *[${filterBody}] | order(coalesce(updatedAt, _updatedAt) desc) [$start...$end] {
        _id,
        kickProductId,
        title,
        brand,
        "slug": slug.current,
        imageUrl,
        imageUrls,
        sizes[]{priceCents}
      }
    }`

    const client = getReadClient()
    const { total, items } = await client.fetch<{ total: number; items: DocRow[] }>(
      combined,
      bindings,
      { cache: 'no-store', next: { revalidate: 0 } }
    )

    const docs = items ?? []
    const totalCount = typeof total === 'number' ? total : 0

    const products: LibrarySearchProduct[] = docs.map((doc) => {
      const validPrices = (doc.sizes || [])
        .map((size) => normalizePriceToMnt(Number(size.priceCents || 0)))
        .filter((price) => price > 0)
      const minPriceMnt = validPrices.length > 0 ? Math.min(...validPrices) : 0

      return {
        id: String(doc.kickProductId || doc._id),
        slug: doc.slug || '',
        title: doc.title || 'Untitled product',
        brand: doc.brand,
        pictureUrl:
          (Array.isArray(doc.imageUrls) && doc.imageUrls.length > 0 ? doc.imageUrls[0] : '') ||
          doc.imageUrl ||
          '',
        priceMnt: minPriceMnt,
        localizedRetailPriceCents: {
          amountCents: minPriceMnt > 0 ? minPriceMnt * 100 : 0,
          currency: 'MNT',
        },
      }
    })

    const hasMore = start + products.length < totalCount

    return NextResponse.json({
      success: true,
      data: {
        products,
        totalCount,
        hasMore,
        marketplace: 'library',
        currentPage: page,
        perPage: pageLimit,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
