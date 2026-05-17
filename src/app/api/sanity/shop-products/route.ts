import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { getAdminSanityReadClient } from '@/lib/admin-sanity-read'
import { getSanityWriteClient } from '@/lib/sanity-write'

export const dynamic = 'force-dynamic'

type Row = {
  _id: string
  title: string
  brand?: string
  slug: string
  category?: string
  productType?: string
  imageUrl?: string | null
  imageUrls?: string[] | null
  sizes?: Array<{
    sizeUS: string
    sizeEU: string
    price?: number | null
    priceCents?: number | null
    stock: number
  }>
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase()

  try {
    const readClient = getAdminSanityReadClient()
    const rows = await readClient.fetch<Row[]>(
      `*[_type == "product" && published == true] | order(updatedAt desc) [0...500] {
        _id,
        title,
        brand,
        "slug": slug.current,
        category,
        productType,
        imageUrl,
        imageUrls,
        "sizes": sizes[]{
          sizeUS,
          sizeEU,
          "price": coalesce(priceCents, price, 0),
          stock
        }
      }`
    )

    const filtered =
      q.length < 2
        ? rows
        : rows.filter((p) => {
            const blob = `${p.title} ${p.brand || ''} ${p.category || ''} ${p.productType || ''}`.toLowerCase()
            return blob.includes(q)
          })

    return NextResponse.json(
      {
        success: true,
        data: { products: filtered.slice(0, 120) },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load products'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  let session
  try {
    session = await getServerSession(authOptions)
  } catch (e) {
    console.error('getServerSession error:', e)
    return NextResponse.json({ success: false, error: 'Session error: ' + (e instanceof Error ? e.message : String(e)) }, { status: 401 })
  }
  
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Unauthorized - no session' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { _id, title, slug, category, productType, sizes } = body

    if (!_id || !title || !slug) {
      return NextResponse.json({ success: false, error: 'Missing required fields: _id, title, slug' }, { status: 400 })
    }

    // Update the product in Sanity
    const updateData: any = {
      title,
      slug: { _type: 'slug', current: slug },
      category: typeof category === 'string' ? category : '',
      productType: typeof productType === 'string' ? productType : '',
      updatedAt: new Date().toISOString(),
    }

    // Only update sizes if provided
    if (sizes && Array.isArray(sizes)) {
      updateData.sizes = sizes.map((size: any) => ({
        sizeUS: size?.sizeUS || '',
        sizeEU: size?.sizeEU || '',
        priceCents: Number(size?.priceCents ?? size?.price ?? 0) || 0,
        stock: Number(size?.stock ?? 0) || 0,
      }))
    }

    const result = await getSanityWriteClient().patch(_id).set(updateData).commit()

    return NextResponse.json({
      success: true,
      data: { product: result },
    })
  } catch (e) {
    console.error('PUT /api/sanity/shop-products error:', e)
    const message = e instanceof Error ? e.message : 'Failed to update product'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
