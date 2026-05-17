import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import CollectionEditClient from './CollectionEditClient'

type Collection = {
  _id: string
  name: string
  slug: string
  mode: 'manual' | 'auto'
  autoType?: 'recent' | 'trending' | 'mostViewed' | 'mostSearched' | 'byCategory'
  autoCategoryKeyword?: string
  products?: Array<{
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
      stock: number
    }>
  }>
  limit: number
  enabled: boolean
  order: number
}

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/admin/login?callbackUrl=/admin/collections')

  const { id } = await params

  const collection: Collection | null = await client.fetch(
    `*[_type == "productCollection" && _id == $id][0] {
      _id,
      name,
      "slug": slug.current,
      mode,
      autoType,
      autoCategoryKeyword,
      products[]->{
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
      },
      limit,
      enabled,
      order
    }`,
    { id }
  )

  if (!collection) {
    notFound()
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-6">
        <Link href="/admin/collections" className="underline hover:text-neutral-900">
          ← Collections
        </Link>
        <span className="text-neutral-300">|</span>
        <Link href="/admin/dashboard" className="underline hover:text-neutral-900">
          Dashboard
        </Link>
      </div>

      <CollectionEditClient collection={collection} />
    </div>
  )
}
