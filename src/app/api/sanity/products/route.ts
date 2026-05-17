import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

function getSanityReadClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || ''
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
  if (!projectId) throw new Error('Missing Sanity projectId')

  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: true,
  })
}

export async function GET(request: NextRequest) {
  try {
    const client = getSanityReadClient()
    const { searchParams } = new URL(request.url)
    
    // Handle single product by slug
    const slug = searchParams.get('slug')
    if (slug) {
      const query = `*[_type == "product" && slug.current == $slug][0]{
        _id,
        title,
        brand,
        category,
        currency,
        imageUrl,
        kickProductId,
        kickSlug,
        slug,
        published,
        imageUrls,
        sizes[]{sizeUS, sizeEU, priceCents, stock}
      }`
      const product = await client.fetch(query, { slug })
      return NextResponse.json({ success: true, data: product })
    }

    // Handle products listing with search and pagination
    const query = searchParams.get('q')?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('perPage') || '20')))

    let sanityQuery = `*[_type == "product"]`
    const queryParams: Record<string, any> = {}

    if (query) {
      sanityQuery += ` && (title match $query || brand match $query || category match $query || productType match $query)`
      queryParams.query = `*${query}*`
    }

    sanityQuery += ` | order(publishedAt desc, updatedAt desc) {
      _id,
      title,
      brand,
      category,
      currency,
      imageUrl,
      kickProductId,
      kickSlug,
      slug,
      published,
      imageUrls,
      sizes[]{sizeUS, sizeEU, priceCents, stock}
    }`

    const products = await client.fetch(sanityQuery, queryParams)
    const totalCount = await client.fetch(`count(*[_type == "product"]${query ? ` && (title match $query || brand match $query || category match $query || productType match $query)` : ''})`, queryParams)

    return NextResponse.json({ 
      success: true, 
      data: {
        products,
        totalCount,
        currentPage: page,
        perPage,
        hasMore: page * perPage < totalCount
      }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

