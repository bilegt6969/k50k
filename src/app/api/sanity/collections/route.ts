import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export const dynamic = 'force-dynamic'
const MIN_ITEMS_FOR_HOME_COLLECTION = 6

type AutoType = 'recent' | 'trending' | 'mostViewed' | 'mostSearched' | 'byCategory'

type Body = {
  name: string
  slug: string
  mode: 'manual' | 'auto' | 'json'
  autoType?: AutoType
  autoCategoryKeyword?: string
  productIds?: string[]
  jsonProducts?: Array<{
    id: string
    pictureUrl: string
    title: string
    slug: string
    price: number
  }>
  // Legacy field name for backward compatibility
  rawProductJson?: string
  limit?: number
  enabled?: boolean
  order?: number
}

function dedupeIdsPreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const name = String(body.name || '').trim()
  let slug = String(body.slug || '').trim()
  if (!name) {
    return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
  }
  if (!slug) slug = slugify(name)
  if (!slug) {
    return NextResponse.json({ success: false, error: 'Could not derive slug' }, { status: 400 })
  }

  const mode = body.mode === 'auto' ? 'auto' : body.mode === 'json' ? 'json' : 'manual'
  const limit = Math.min(100, Math.max(1, Number(body.limit ?? 24) || 24))
  const enabled = body.enabled !== false

  if (mode === 'manual') {
    const ids = dedupeIdsPreserveOrder(
      Array.isArray(body.productIds) ? body.productIds.filter(Boolean) : []
    )
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pick at least one product for a custom collection.' },
        { status: 400 }
      )
    }
    if (enabled && ids.length < MIN_ITEMS_FOR_HOME_COLLECTION) {
      return NextResponse.json(
        {
          success: false,
          error: `Manual collections need at least ${MIN_ITEMS_FOR_HOME_COLLECTION} products to publish cleanly on large screens.`,
        },
        { status: 400 }
      )
    }
  }

  if (mode === 'json') {
    const products = Array.isArray(body.jsonProducts) ? body.jsonProducts : []
    let jsonString: unknown[] = []
    if (body.rawProductJson) {
      try {
        const parsed = JSON.parse(body.rawProductJson) as { products?: unknown[] }
        jsonString = Array.isArray(parsed.products) ? parsed.products : []
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid rawProductJson payload.' },
          { status: 400 }
        )
      }
    }
    const finalProducts = products.length > 0 ? products : jsonString
    
    if (finalProducts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Add valid JSON product data for JSON collections.' },
        { status: 400 }
      )
    }
    if (enabled && finalProducts.length < MIN_ITEMS_FOR_HOME_COLLECTION) {
      return NextResponse.json(
        {
          success: false,
          error: `JSON collections need at least ${MIN_ITEMS_FOR_HOME_COLLECTION} products to publish cleanly on large screens.`,
        },
        { status: 400 }
      )
    }
  }

  let autoType: AutoType | undefined
  let autoCategoryKeyword: string | undefined

  if (mode === 'auto') {
    const at = body.autoType
    if (!at || !['recent', 'trending', 'mostViewed', 'mostSearched', 'byCategory'].includes(at)) {
      return NextResponse.json({ success: false, error: 'Choose a valid auto rule.' }, { status: 400 })
    }
    autoType = at
    if (at === 'byCategory') {
      const kw = String(body.autoCategoryKeyword || '').trim()
      if (!kw) {
        return NextResponse.json(
          { success: false, error: 'Keyword is required for “By category” collections.' },
          { status: 400 }
        )
      }
      autoCategoryKeyword = kw
    }
  }

  try {
    const write = getSanityWriteClient()

    const dup = await write.fetch<string | null>(
      `*[_type == "productCollection" && slug.current == $slug][0]._id`,
      { slug }
    )
    if (dup) {
      return NextResponse.json(
        { success: false, error: `Slug "${slug}" is already used. Change the name or slug.` },
        { status: 409 }
      )
    }

    const maxOrder = await write.fetch<number | null>(
      `*[_type == "productCollection"] | order(order desc)[0].order`
    )
    const nextOrder =
      typeof body.order === 'number' && Number.isFinite(body.order) ? body.order : (maxOrder ?? -1) + 1

    const doc: Record<string, unknown> = {
      _type: 'productCollection',
      name,
      slug: {_type: 'slug', current: slug},
      mode,
      limit,
      enabled,
      order: nextOrder,
    }

    if (mode === 'manual') {
      const productIds = dedupeIdsPreserveOrder(
        Array.isArray(body.productIds) ? body.productIds.filter(Boolean) : []
      )
      doc.products = productIds.map((_ref, i) => ({
        _type: 'reference',
        _ref,
        _key: `p-${i}-${_ref.replace(/[^a-zA-Z0-9]/g, '').slice(-24)}`,
      }))
    } else if (mode === 'json') {
      // Store as JSON string in rawProductJson field for Sanity Studio
      const products = body.jsonProducts || []
      if (products.length > 0) {
        doc.rawProductJson = JSON.stringify({ products })
      } else if (body.rawProductJson) {
        doc.rawProductJson = body.rawProductJson
      }
    } else {
      doc.autoType = autoType
      if (autoCategoryKeyword) doc.autoCategoryKeyword = autoCategoryKeyword
    }

    const created = await write.create(doc as Parameters<typeof write.create>[0])

    return NextResponse.json({
      success: true,
      data: {_id: created._id, slug, name, mode},
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create collection'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
