import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type PublishSize = {
  sizeUS: string
  sizeEU: string
  priceCents: number
  stock: number
}

type PublishBody = {
  // Kicksdev identifiers
  kickProductId: string
  kickSlug: string
  title: string
  brand: string
  category?: string
  productType?: string
  imageUrl?: string | null

  currency?: string
  sizes: PublishSize[]
  imageUrls?: string[]

  // Publish toggle
  published: boolean
}

function getSanityServerConfig() {
  const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_WRITE_TOKEN

  if (!projectId) throw new Error('Missing SANITY_PROJECT_ID')
  if (!token) throw new Error('Missing SANITY_WRITE_TOKEN')

  return { projectId, dataset, token }
}

function assertValidSizeRow(row: PublishSize) {
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as PublishBody

    if (!body?.kickProductId || !body?.kickSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing `kickProductId` or `kickSlug`' },
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

    const { projectId, dataset, token } = getSanityServerConfig()
    const sanity = createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: false,
      token,
    })

    const now = new Date().toISOString()

    // Stable document id so re-publishing updates same doc.
    const docId = `product-${body.kickProductId}`

    const doc = {
      _id: docId,
      _type: 'product',
      kickProductId: body.kickProductId,
      kickSlug: body.kickSlug,
      slug: { _type: 'slug', current: body.kickSlug },
      title: body.title,
      brand: body.brand,
      category: body.category || '',
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
      publishedAt: body.published ? now : null,
      updatedAt: now,
      createdAt: now,
    }

    // Create or replace in one operation.
    const created = await sanity.createOrReplace(doc)

    return NextResponse.json({ success: true, data: { _id: created._id } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

