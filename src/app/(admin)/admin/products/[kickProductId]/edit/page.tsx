import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import ProductEditClient from './ProductEditClient'

type Product = {
  _id: string
  title: string
  brand: string
  category?: string
  productType?: string
  kickProductId: string
  kickSlug: string
  slug: string
  imageUrl?: string | null
  imageUrls?: string[] | null
  published: boolean
  publishedAt?: string
  updatedAt?: string
  viewCount?: number
  searchCount?: number
  sizes: Array<{
    sizeUS: string
    sizeEU: string
    priceCents: number
    stock: number
  }>
}

export default async function EditProductPage({ params }: { params: Promise<{ kickProductId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/admin/login?callbackUrl=/admin/products')

  const { kickProductId } = await params

  const product: Product | null = await client.fetch(
    `*[_type == "product" && _id == $id][0] {
      _id,
      title,
      brand,
      category,
      productType,
      kickProductId,
      kickSlug,
      "slug": slug.current,
      imageUrl,
      imageUrls,
      published,
      publishedAt,
      updatedAt,
      viewCount,
      searchCount,
      sizes[]{sizeUS, sizeEU, priceCents, stock}
    }`,
    { id: kickProductId },
    {
      // Disable caching to always get fresh data
      next: { revalidate: 0 }
    }
  )

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-4 text-sm text-zinc-600">
        <Link href="/admin/products/manage" className="underline transition hover:text-zinc-900">
          ← Products
        </Link>
        <span className="text-zinc-300">|</span>
        <Link href="/admin/dashboard" className="underline transition hover:text-zinc-900">
          Dashboard
        </Link>
      </div>

      <ProductEditClient product={product} />
      </div>
    </div>
  )
}
