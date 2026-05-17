'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useAdminSessionState } from '@/hooks/useAdminSessionState'
import { ArrowLeft } from 'lucide-react'

type AdminKickProduct = {
  marketplace: 'goat' | 'stockx'
  kickProductId: string
  kickSlug: string
  name: string
  brand: string
  category: string
  productType: string
  imageUrl: string | null
  sizes: Array<{
    size: string
    available: boolean
    lowestAsk: number | null
    currency: string | null
    totalAsks: number | null
  }>
}

type ApiResponse = {
  success: boolean
  data?: {
    products: AdminKickProduct[]
    totalCount: number
    hasMore: boolean
    currentPage: number
    perPage: number
  }
  error?: string
}

const PRODUCT_SEARCH_KEY = 'admin:product-search'

export default function AdminProductSearchPage() {
  const [query, setQuery] = useAdminSessionState(PRODUCT_SEARCH_KEY + ':query', '')
  const [marketplace, setMarketplace] = useAdminSessionState<'goat' | 'stockx'>(
    PRODUCT_SEARCH_KEY + ':marketplace',
    'goat'
  )
  const [results, setResults] = useAdminSessionState<AdminKickProduct[]>(
    PRODUCT_SEARCH_KEY + ':results',
    []
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canSearch = useMemo(() => query.trim().length >= 2, [query])

  const search = async () => {
    if (!canSearch) return
    setIsLoading(true)
    setError(null)
    try {
      const url = new URL('/api/kicksdev/search', window.location.origin)
      url.searchParams.set('query', query.trim())
      url.searchParams.set('marketplace', marketplace)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = (await res.json()) as ApiResponse
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || `Search failed (${res.status})`)
      }
      setResults(json.data.products)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsLoading(false)
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
          <h1 className="text-3xl font-semibold text-zinc-900">Add products to your shop</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Search for a product, then set your own prices and available sizes.
          </p>
        </div>
        <Link className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-800 transition hover:bg-zinc-100" href="/admin/products/manage">
          Manage existing products
        </Link>
        <Link className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-800 transition hover:bg-zinc-100" href="/admin/dashboard">
          Back to dashboard
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_180px_140px] items-end">
        <div className="space-y-2">
          <label className="text-sm text-zinc-700">Search query</label>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Air Jordan 1 Chicago"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-700">Marketplace</label>
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-400"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value as 'goat' | 'stockx')}
          >
            <option value="goat">GOAT</option>
            <option value="stockx">StockX</option>
          </select>
        </div>

        <button
          className="rounded-xl border border-zinc-900 bg-zinc-900 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          disabled={!canSearch || isLoading}
          onClick={search}
        >
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3">
        {results.map((p) => (
          <Link
            key={`${p.marketplace}-${p.kickProductId}`}
            href={`/admin/products/${encodeURIComponent(p.kickProductId)}?marketplace=${encodeURIComponent(p.marketplace)}`}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                {p.imageUrl ? (
                  <div className="absolute inset-2">
                    <Image src={p.imageUrl} alt={p.name} fill className="object-contain" sizes="64px" />
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate text-zinc-900">{p.name}</div>
                <div className="truncate text-sm text-zinc-600">
                  {p.brand}
                  {p.category ? ` • ${p.category}` : ''}
                  {p.productType ? ` • ${p.productType}` : ''}
                  {` • ${p.marketplace.toUpperCase()}`}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {p.sizes.length} sizes found
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
                  Set prices →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </div>
  )
}

