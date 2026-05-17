'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useAdminSessionState } from '@/hooks/useAdminSessionState'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

type SanityProduct = {
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

type ApiResponse = {
  success: boolean
  data?: {
    products: SanityProduct[]
    totalCount: number
    hasMore: boolean
    currentPage: number
    perPage: number
  }
  error?: string
}

const MANAGE_PRODUCTS_KEY = 'admin:manage-products'

export default function ManageProductsPage() {
  const [query, setQuery] = useAdminSessionState(MANAGE_PRODUCTS_KEY + ':query', '')
  const [results, setResults] = useState<SanityProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const canSearch = useMemo(() => true, [query])

  const search = async (page: number = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const url = new URL('/api/sanity/products', window.location.origin)
      if (query.trim()) url.searchParams.set('q', query.trim())
      url.searchParams.set('page', page.toString())
      url.searchParams.set('perPage', '20')
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || `Search failed (${res.status})`)
      }
      if (page === 1) {
        setResults(json.data.products)
      } else {
        setResults(prev => [...prev, ...json.data!.products])
      }
      setTotalCount(json.data.totalCount)
      setHasMore(json.data.hasMore)
      setCurrentPage(json.data.currentPage)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    search(1)
  }, [query])

  const loadMore = () => {
    if (hasMore && !isLoading) {
      search(currentPage + 1)
    }
  }

  const formatPrice = (cents: number) => {
    const dollars = cents / 100
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(dollars)
  }

  const publishDraft = async (product: SanityProduct) => {
    setPublishingId(product._id)
    setError(null)
    try {
      const res = await fetch('/api/sanity/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: product._id,
          title: product.title,
          brand: product.brand,
          category: product.category,
          productType: product.productType,
          imageUrl: product.imageUrl,
          imageUrls: product.imageUrls,
          sizes: product.sizes.map((s) => ({
            sizeUS: s.sizeUS,
            sizeEU: s.sizeEU,
            priceCents: s.priceCents,
            stock: s.stock,
          })),
          published: true,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Publish failed (${res.status})`)
      }

      setResults((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, published: true } : p))
      )
      toast.success('Product published', {
        description: `${product.title} is now live in your shop.`,
        duration: 4000,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to publish product'
      setError(message)
      toast.error('Publish failed', { description: message, duration: 5000 })
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-4 text-sm text-zinc-600">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Manage existing products</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Edit and update products that are already published to your shop.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-800 transition hover:bg-zinc-100" href="/admin/products">
            ← Add new products
          </Link>
          <Link className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-800 transition hover:bg-zinc-100" href="/admin/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end">
        <div className="space-y-2">
          <label className="text-sm text-zinc-700">Search products</label>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Air Jordan 1 Chicago"
          />
        </div>

        <div className="text-sm text-zinc-600">
          {totalCount > 0 && `${totalCount} products found`}
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3">
        {results?.map((p) => (
          <div
            key={p._id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                {p.imageUrl ? (
                  <div className="absolute inset-2">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-contain" sizes="64px" />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold truncate text-zinc-900">{p.title}</div>
                  {p.published ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Published</span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">Draft</span>
                  )}
                </div>
                <div className="truncate text-sm text-zinc-600">
                  {p.brand}
                  {p.category ? ` • ${p.category}` : ''}
                  {p.productType ? ` • ${p.productType}` : ''}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {p.sizes.length} sizes • {p.sizes.filter(s => s.stock > 0).length} in stock
                  {p.sizes.length > 0 && ` • from ${formatPrice(Math.min(...p.sizes.map(s => s.priceCents)))}`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!p.published ? (
                  <button
                    type="button"
                    onClick={() => void publishDraft(p)}
                    disabled={publishingId === p._id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {publishingId === p._id ? 'Publishing…' : 'Draft to Publish'}
                  </button>
                ) : null}
                <Link
                  href={`/admin/products/${p._id}/edit`}
                  className="rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mt-8 text-center py-12">
            <div className="text-zinc-600">Loading products...</div>
          </div>
        )}

        {!isLoading && !error && results?.length === 0 && (
          <div className="mt-8 text-center py-12">
            <div className="text-zinc-600">
              {query ? 'No products found matching your search.' : 'No products found.'}
            </div>
            <Link href="/admin/products" className="mt-4 inline-block text-zinc-800 underline transition hover:text-zinc-900">
              Add new products →
            </Link>
          </div>
        )}

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-60"
            >
              {isLoading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
