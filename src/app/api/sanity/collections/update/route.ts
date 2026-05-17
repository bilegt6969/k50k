import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export const dynamic = 'force-dynamic'
const MIN_ITEMS_FOR_HOME_COLLECTION = 6

type AutoType = 'recent' | 'trending' | 'mostViewed' | 'mostSearched' | 'byCategory'

type Body = {
  _id: string
  name: string
  slug: string
  mode: 'manual' | 'auto'
  autoType?: AutoType
  autoCategoryKeyword?: string
  productIds?: string[]
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

export async function PUT(request: NextRequest) {
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

  if (!body._id) {
    return NextResponse.json({ success: false, error: 'Collection ID is required' }, { status: 400 })
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

  const mode = body.mode === 'auto' ? 'auto' : 'manual'
  const limit = Math.min(100, Math.max(1, Number(body.limit ?? 24) || 24))
  const enabled = body.enabled !== false
  const order = typeof body.order === 'number' ? body.order : 0
  const manualProductIds = dedupeIdsPreserveOrder(
    Array.isArray(body.productIds) ? body.productIds.filter(Boolean) : []
  )

  if (mode === 'manual') {
    const ids = manualProductIds
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
          { success: false, error: 'Keyword is required for "By category" collections.' },
          { status: 400 }
        )
      }
      autoCategoryKeyword = kw
    }
  }

  try {
    const write = getSanityWriteClient()

    // Check if slug is already used by another collection
    const existingSlug = await write.fetch<string | null>(
      `*[_type == "productCollection" && slug.current == $slug && _id != $id][0]._id`,
      { slug, id: body._id }
    )
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `Slug "${slug}" is already used by another collection.` },
        { status: 409 }
      )
    }

    const doc: Record<string, unknown> = {
      _id: body._id,
      _type: 'productCollection',
      name,
      slug: { _type: 'slug', current: slug },
      mode,
      limit,
      enabled,
      order,
      updatedAt: new Date().toISOString(),
    }

    if (mode === 'manual') {
      doc.products = manualProductIds.map((_ref: string, i: number) => ({
        _type: 'reference',
        _ref,
        _key: `p-${i}-${_ref.replace(/[^a-zA-Z0-9]/g, '').slice(-24)}`,
      }))
    } else {
      doc.autoType = autoType
      if (autoCategoryKeyword) doc.autoCategoryKeyword = autoCategoryKeyword
    }

    const updated = await write.createOrReplace(doc as Parameters<typeof write.createOrReplace>[0])

    return NextResponse.json({
      success: true,
      data: { _id: updated._id, slug, name, mode },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update collection'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
