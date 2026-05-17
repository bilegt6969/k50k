import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export const dynamic = 'force-dynamic'

type UpdateSize = {
  sizeUS: string
  sizeEU: string
  priceCents: number
  stock: number
}

type UpdateBody = {
  _id: string
  title: string
  brand: string
  category?: string
  productType?: string
  imageUrl?: string | null
  imageUrls?: string[]
  sizes: UpdateSize[]
  published: boolean
}

function assertValidSizeRow(row: UpdateSize) {
  if (!row || typeof row.sizeUS !== 'string' || !row.sizeUS.trim()) {
    throw new Error('Invalid size row: missing `sizeUS`')
  }
  if (!row || typeof row.sizeEU !== 'string' || !row.sizeEU.trim()) {
    throw new Error('Invalid size row: missing `sizeEU`')
  }
  if (!Number.isInteger(row.priceCents) || row.priceCents < 0) {
    throw new Error(`Invalid priceCents for size ${row.sizeUS}`)
  }
  if (!Number.isInteger(row.stock) || row.stock < 0) {
    throw new Error(`Invalid stock for size ${row.sizeUS}`)
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as UpdateBody

    if (!body?._id) {
      return NextResponse.json(
        { success: false, error: 'Missing product ID' },
        { status: 400 }
      )
    }
    if (!body?.title || !body?.brand) {
      return NextResponse.json(
        { success: false, error: 'Missing `title` or `brand`' },
        { status: 400 }
      )
    }
    if (!Array.isArray(body.sizes) || body.sizes.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing `sizes`' }, { status: 400 })
    }

    body.sizes.forEach(assertValidSizeRow)

    const write = getSanityWriteClient()

    const now = new Date().toISOString()

    // Get existing product to preserve some fields
    const existing = await write.fetch(
      `*[_type == "product" && _id == $id][0]{
        kickProductId,
        kickSlug,
        publishedAt,
        createdAt,
        viewCount,
        searchCount
      }`,
      { id: body._id }
    )

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const doc = {
      _id: body._id,
      _type: 'product',
      kickProductId: existing.kickProductId,
      kickSlug: existing.kickSlug,
      slug: { _type: 'slug', current: existing.kickSlug },
      title: body.title,
      brand: body.brand,
      category: body.category || '',
      productType: body.productType || '',
      imageUrl: body.imageUrl || null,
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      currency: 'MNT',
      sizes: body.sizes.map((s) => ({
        _type: 'sizeVariant',
        sizeUS: s.sizeUS,
        sizeEU: s.sizeEU,
        priceCents: s.priceCents,
        stock: s.stock,
      })),
      published: !!body.published,
      publishedAt: body.published && !existing.publishedAt ? now : existing.publishedAt,
      updatedAt: now,
      createdAt: existing.createdAt || now,
      viewCount: existing.viewCount || 0,
      searchCount: existing.searchCount || 0,
    }

    // Create or replace in one operation.
    const updated = await write.createOrReplace(doc)

    // Revalidate cache for this product page and related pages
    revalidatePath(`/admin/products/${body._id}/edit`)
    revalidatePath('/admin/products/manage')
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ success: true, data: { _id: updated._id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
