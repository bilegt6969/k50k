'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { readAdminSessionState, usePersistAdminSession, clearAdminSessionState } from '@/hooks/useAdminSessionState'
import { dedupeById, dedupeIdsPreserveOrder } from '@/lib/dedupe'

type AutoType = 'recent' | 'trending' | 'mostViewed' | 'mostSearched' | 'byCategory'

type ProductSize = {
  sizeUS: string
  sizeEU: string
  price?: number | null
  stock: number
}

type ShopProduct = {
  _id: string
  title: string
  brand?: string
  slug: string
  category?: string
  productType?: string
  imageUrl?: string | null
  imageUrls?: string[] | null
  sizes?: ProductSize[]
}

type Collection = {
  _id: string
  name: string
  slug: string
  mode: 'manual' | 'auto'
  autoType?: AutoType
  autoCategoryKeyword?: string
  products?: ShopProduct[]
  limit: number
  enabled: boolean
  order: number
}

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return ''
  return value.toLocaleString()
}

function unformatPrice(value: string): number | null {
  const cleaned = value.replace(/,/g, '').replace(/\s/g, '')
  if (cleaned === '') return null
  const num = Number(cleaned)
  return isNaN(num) ? null : num
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

const AUTO_OPTIONS: { value: AutoType; label: string; hint: string }[] = [
  { value: 'recent', label: 'Recently added', hint: 'Newest published products first.' },
  { value: 'trending', label: 'Trending', hint: 'Highest view count.' },
  { value: 'mostViewed', label: 'Most viewed', hint: 'Same sorting as trending (explicit).' },
  { value: 'mostSearched', label: 'Most searched', hint: 'Highest search count.' },
  { value: 'byCategory', label: 'By keyword', hint: 'e.g. shoe, tee, jordan — matches category, type, or title.' },
]
const MIN_ITEMS_FOR_HOME_COLLECTION = 6

type CollectionEditDraft = {
  name: string
  slug: string
  slugTouched: boolean
  limit: number
  enabled: boolean
  autoType: AutoType
  autoKeyword: string
  productSearch: string
  orderedIds: string[]
  selectedIds: string[]
}

export default function CollectionEditClient({ collection }: { collection: Collection }) {
  const draftKey = `admin:collection-edit:${collection._id}`
  const router = useRouter()

  const [name, setName] = useState(collection.name)
  const [slug, setSlug] = useState(collection.slug)
  const [slugTouched, setSlugTouched] = useState(false)
  const [limit, setLimit] = useState(collection.limit)
  const [enabled, setEnabled] = useState(collection.enabled)

  const [autoType, setAutoType] = useState<AutoType>(collection.autoType || 'recent')
  const [autoKeyword, setAutoKeyword] = useState(collection.autoCategoryKeyword || '')

  const initialProductIds = dedupeIdsPreserveOrder(
    collection.products?.map((p) => p._id) || []
  )
  const [products, setProducts] = useState<ShopProduct[]>(
    dedupeById(collection.products || [])
  )
  const [productSearch, setProductSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialProductIds))
  const [orderedIds, setOrderedIds] = useState<string[]>(initialProductIds)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const debouncedProductSearch = useDebouncedValue(productSearch, 350)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Product editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null)
  const [productUpdateLoading, setProductUpdateLoading] = useState(false)
  
  // Inline editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
  const [inlineEditingField, setInlineEditingField] = useState<string | null>(null)
  const [inlineEditingSizeIndex, setInlineEditingSizeIndex] = useState<number | null>(null)
  const [inlineEditingValue, setInlineEditingValue] = useState<string>('')
  
  // Dropdown options
  const CATEGORY_OPTIONS = [
    'Shoes', 'Apparel', 'Accessories', 'Electronics', 'Home & Living', 
    'Sports & Outdoors', 'Beauty', 'Toys & Games', 'Books', 'Other'
  ]
  
  const PRODUCT_TYPE_OPTIONS = [
    'Sneakers', 'Running Shoes', 'Basketball Shoes', 'Casual Shoes', 'Boots',
    'T-Shirt', 'Hoodie', 'Jacket', 'Pants', 'Shorts',
    'Watch', 'Bag', 'Hat', 'Socks', 'Other'
  ]

  const syncSlugFromName = useCallback(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  const loadProducts = useCallback(async (q: string) => {
    setLoadingProducts(true)
    setError(null)
    try {
      const u = new URL('/api/sanity/shop-products', window.location.origin)
      if (q.trim().length >= 2) u.searchParams.set('q', q.trim())
      const res = await fetch(u.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load products')
      setProducts((prev) => {
        const next = json.data.products || []
        const map = new Map<string, ShopProduct>()
        prev.forEach((p) => {
          if (selectedIds.has(p._id)) map.set(p._id, p)
        })
        next.forEach((p: ShopProduct) => map.set(p._id, p))
        return dedupeById(Array.from(map.values()))
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [selectedIds])

  useEffect(() => {
    if (collection.mode !== 'manual') return
    void loadProducts(debouncedProductSearch)
  }, [collection.mode, debouncedProductSearch, loadProducts])

  useEffect(() => {
    if (collection.mode !== 'manual') return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadProducts(productSearch)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [collection.mode, productSearch, loadProducts])

  const draftRestored = useRef(false)
  useEffect(() => {
    if (draftRestored.current) return
    draftRestored.current = true
    const draft = readAdminSessionState<CollectionEditDraft>(draftKey)
    if (!draft) return
    setName(draft.name)
    setSlug(draft.slug)
    setSlugTouched(draft.slugTouched)
    setLimit(draft.limit)
    setEnabled(draft.enabled)
    setAutoType(draft.autoType)
    setAutoKeyword(draft.autoKeyword)
    setProductSearch(draft.productSearch)
    setOrderedIds(dedupeIdsPreserveOrder(draft.orderedIds))
    setSelectedIds(new Set(dedupeIdsPreserveOrder(draft.selectedIds)))
    if (collection.mode === 'manual') void loadProducts(draft.productSearch)
  }, [collection.mode, draftKey, loadProducts])

  usePersistAdminSession<CollectionEditDraft>(
    draftKey,
    {
      name,
      slug,
      slugTouched,
      limit,
      enabled,
      autoType,
      autoKeyword,
      productSearch,
      orderedIds,
      selectedIds: Array.from(selectedIds),
    },
    400
  )

  const filteredPick = useMemo(() => {
    if (productSearch.trim().length < 2) return products
    const q = productSearch.trim().toLowerCase()
    return products.filter((p) =>
      `${p.title} ${p.category || ''} ${p.productType || ''}`.toLowerCase().includes(q)
    )
  }, [products, productSearch])
  const selectedProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p._id, p]))
    return dedupeIdsPreserveOrder(orderedIds.filter((id) => selectedIds.has(id)))
      .map((id) => byId.get(id))
      .filter((p): p is ShopProduct => Boolean(p))
  }, [products, selectedIds, orderedIds])
  const hiddenSelectedCount = Math.max(0, selectedIds.size - selectedProducts.length)

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setOrderedIds((current) => current.filter((x) => x !== id))
      } else {
        next.add(id)
        setOrderedIds((current) => (current.includes(id) ? current : [...current, id]))
      }
      return next
    })
  }

  const startEditingProduct = (product: ShopProduct) => {
    setEditingProductId(product._id)
    setEditingProduct({ ...product })
  }

  const cancelEditingProduct = () => {
    setEditingProductId(null)
    setEditingProduct(null)
  }

  const updateProduct = async () => {
    if (!editingProduct) return
    
    setProductUpdateLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sanity/shop-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: editingProduct._id,
          title: editingProduct.title,
          slug: editingProduct.slug,
          category: editingProduct.category,
          productType: editingProduct.productType,
          sizes: editingProduct.sizes,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Product update failed')
      
      // Update local state
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? editingProduct : p))
      cancelEditingProduct()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update product')
    } finally {
      setProductUpdateLoading(false)
    }
  }

  const addSize = () => {
    if (!editingProduct) return
    const newSize: ProductSize = {
      sizeUS: '',
      sizeEU: '',
      price: 0,
      stock: 0,
    }
    setEditingProduct(prev => prev ? {
      ...prev,
      sizes: [...(prev.sizes || []), newSize]
    } : null)
  }

  const updateSize = (index: number, field: keyof ProductSize, value: string | number | null) => {
    if (!editingProduct) return
    const updatedSizes = [...(editingProduct.sizes || [])]
    updatedSizes[index] = { ...updatedSizes[index], [field]: value }
    setEditingProduct(prev => prev ? { ...prev, sizes: updatedSizes } : null)
  }

  const removeSize = (index: number) => {
    if (!editingProduct) return
    const updatedSizes = editingProduct.sizes?.filter((_, i) => i !== index) || []
    setEditingProduct(prev => prev ? { ...prev, sizes: updatedSizes } : null)
  }

  // Inline editing functions
  const startInlineEdit = (
    productId: string,
    field: string,
    currentValue: string,
    sizeIndex?: number
  ) => {
    setInlineEditingId(productId)
    setInlineEditingField(field)
    setInlineEditingSizeIndex(sizeIndex ?? null)
    setInlineEditingValue(currentValue)
  }

  const cancelInlineEdit = () => {
    setInlineEditingId(null)
    setInlineEditingField(null)
    setInlineEditingSizeIndex(null)
    setInlineEditingValue('')
  }

  const updateInlineField = async (
    productId: string,
    field: string,
    value: string | number | null,
    sizeIndex?: number
  ) => {
    try {
      const product = products.find((p) => p._id === productId)
      if (!product) throw new Error('Product not found in current list')

      // API requires these fields on every update.
      const updateData: any = {
        _id: productId,
        title: product.title,
        slug: product.slug,
      }
      
      if (sizeIndex !== undefined) {
        // Update size field
        if (product.sizes) {
          const updatedSizes = [...product.sizes]
          updatedSizes[sizeIndex] = { ...updatedSizes[sizeIndex], [field]: value }
          updateData.sizes = updatedSizes
        }
      } else {
        // Update product field
        updateData[field] = value
      }

      const res = await fetch('/api/sanity/shop-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Update failed')

      // Update local state
      if (sizeIndex !== undefined) {
        setProducts(prev => prev.map(p => {
          if (p._id === productId && p.sizes) {
            const updatedSizes = [...p.sizes]
            updatedSizes[sizeIndex] = { ...updatedSizes[sizeIndex], [field]: value }
            return { ...p, sizes: updatedSizes }
          }
          return p
        }))
      } else {
        setProducts(prev => prev.map(p => 
          p._id === productId ? { ...p, [field]: value } : p
        ))
      }
      
      cancelInlineEdit()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update field')
    }
  }

  const saveInlineEdit = async () => {
    if (!inlineEditingId || !inlineEditingField) return

    const product = products.find((p) => p._id === inlineEditingId)
    if (!product) {
      cancelInlineEdit()
      return
    }

    if (
      inlineEditingField === 'category' ||
      inlineEditingField === 'productType' ||
      inlineEditingField === 'sizeUS'
    ) {
      if (inlineEditingField === 'sizeUS' && !inlineEditingValue.trim()) {
        setError('Size US cannot be empty.')
        return
      }
      await updateInlineField(
        inlineEditingId,
        inlineEditingField,
        inlineEditingValue.trim(),
        inlineEditingSizeIndex ?? undefined
      )
      return
    }

    if (inlineEditingField === 'price') {
      const parsed = unformatPrice(inlineEditingValue)
      if (parsed === null && inlineEditingValue.trim() !== '') {
        setError('Price must be a valid number.')
        return
      }
      await updateInlineField(
        inlineEditingId,
        inlineEditingField,
        parsed,
        inlineEditingSizeIndex ?? undefined
      )
      return
    }

    if (inlineEditingField === 'stock') {
      const parsed = Number(inlineEditingValue)
      if (!Number.isInteger(parsed) || parsed < 0) {
        setError('Stock must be a non-negative integer.')
        return
      }
      await updateInlineField(
        inlineEditingId,
        inlineEditingField,
        Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
        inlineEditingSizeIndex ?? undefined
      )
    }
  }

  const handleInlineInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void saveInlineEdit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelInlineEdit()
    }
  }

  const submit = async () => {
    const finalSlug = slug.trim() || slugify(name.trim())
    if (!name.trim() || !finalSlug) {
      setError('Name and slug are required.')
      return
    }
    if (collection.mode === 'manual' && selectedIds.size === 0) {
      setError('Select at least one product.')
      return
    }
    if (collection.mode === 'manual' && enabled && selectedIds.size < MIN_ITEMS_FOR_HOME_COLLECTION) {
      setError(
        `Manual collections need at least ${MIN_ITEMS_FOR_HOME_COLLECTION} products to be visible on home.`
      )
      return
    }
    if (collection.mode === 'auto' && autoType === 'byCategory' && !autoKeyword.trim()) {
      setError('Enter a keyword for this collection.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        _id: collection._id,
        name: name.trim(),
        slug: finalSlug,
        mode: collection.mode,
        limit,
        enabled,
        order: collection.order,
      }
      if (collection.mode === 'manual') {
        body.productIds = dedupeIdsPreserveOrder(
          orderedIds.filter((id) => selectedIds.has(id))
        )
      } else {
        body.autoType = autoType
        if (autoType === 'byCategory') body.autoCategoryKeyword = autoKeyword.trim()
      }

      const res = await fetch('/api/sanity/collections/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || `Update failed (${res.status})`)
      clearAdminSessionState(draftKey)
      router.push('/admin/collections')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-neutral-900">Edit collection</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Update collection settings and products. Changes will be reflected on the home page.
      </p>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 whitespace-pre-wrap">
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-500">Display name</label>
            <input
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-neutral-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={syncSlugFromName}
              placeholder="e.g. Staff picks"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500">URL slug</label>
            <input
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-neutral-900 font-mono text-sm"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="staff-picks"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-500">Max products in section</label>
            <input
              type="number"
              min={1}
              max={100}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-neutral-900"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 24)}
            />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm text-neutral-800">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Visible on the home page
          </label>
        </div>

        {collection.mode === 'auto' ? (
          <div className="space-y-4 rounded-2xl border border-black/10 bg-neutral-50 p-6">
            <div className="text-sm font-semibold text-neutral-900">Rule</div>
            <div className="grid gap-3">
              {AUTO_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer gap-3 rounded-xl border border-black/10 bg-white p-4">
                  <input
                    type="radio"
                    name="autoType"
                    checked={autoType === opt.value}
                    onChange={() => setAutoType(opt.value)}
                  />
                  <div>
                    <div className="font-medium text-neutral-900">{opt.label}</div>
                    <div className="text-xs text-neutral-600">{opt.hint}</div>
                  </div>
                </label>
              ))}
            </div>
            {autoType === 'byCategory' ? (
              <div>
                <label className="block text-xs font-medium text-neutral-500">Keyword</label>
                <input
                  className="mt-1 w-full max-w-md rounded-lg border border-black/15 px-3 py-2 text-neutral-900"
                  value={autoKeyword}
                  onChange={(e) => setAutoKeyword(e.target.value)}
                  placeholder="e.g. shoe, tee, hoody"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-black/10 bg-neutral-50 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-sm font-semibold text-neutral-900">Manage products</div>
              <button
                type="button"
                className="text-sm text-neutral-600 underline"
                onClick={() => void loadProducts(productSearch)}
              >
                Refresh list
              </button>
            </div>
            <input
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-900"
              placeholder="Filter list…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div className="text-xs text-neutral-500">
              {loadingProducts ? 'Loading…' : `${filteredPick.length} products shown • ${selectedIds.size} selected`}
            </div>
            {selectedProducts.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="mb-2 text-xs font-medium text-emerald-700">
                  Selected products ({selectedProducts.length})
                  {hiddenSelectedCount > 0 ? ` • ${hiddenSelectedCount} not in current loaded list` : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((p) => (
                    <button
                      key={`selected-${p._id}`}
                      type="button"
                      onClick={() => toggleProduct(p._id)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
                    >
                      <span className="max-w-[160px] truncate">{p.title}</span>
                      <span aria-hidden>×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="max-h-80 overflow-auto rounded-xl border border-black/10 bg-white">
              {filteredPick.map((p) => {
                const img =
                  (p.imageUrls && p.imageUrls[0]) ||
                  p.imageUrl ||
                  'https://placehold.co/112x112/e5e5e5/666?text=NA'
                const on = selectedIds.has(p._id)
                return (
                  <div key={p._id} className="border-b border-black/5 last:border-b-0">
                    <div className="flex w-full gap-3 px-3 py-2 text-left text-sm transition hover:bg-neutral-50">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <Image src={img} alt="" fill className="object-cover" sizes="56px" unoptimized />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-neutral-900">{p.title}</div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          {/* Category Dropdown */}
                          {inlineEditingId === p._id && inlineEditingField === 'category' ? (
                            <select
                              value={p.category || ''}
                              onChange={(e) => updateInlineField(p._id, 'category', e.target.value)}
                              onBlur={() => cancelInlineEdit()}
                              className="rounded border border-neutral-200 px-2 py-0.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                              autoFocus
                            >
                              <option value="">Select category...</option>
                              {CATEGORY_OPTIONS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startInlineEdit(p._id, 'category', p.category || '')}
                              className="hover:text-neutral-700 underline"
                            >
                              {p.category || 'Set category'}
                            </button>
                          )}
                          
                          <span>•</span>
                          
                          {/* Product Type Dropdown */}
                          {inlineEditingId === p._id && inlineEditingField === 'productType' ? (
                            <select
                              value={p.productType || ''}
                              onChange={(e) => updateInlineField(p._id, 'productType', e.target.value)}
                              onBlur={() => cancelInlineEdit()}
                              className="rounded border border-neutral-200 px-2 py-0.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                              autoFocus
                            >
                              <option value="">Select type...</option>
                              {PRODUCT_TYPE_OPTIONS.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startInlineEdit(p._id, 'productType', p.productType || '')}
                              className="hover:text-neutral-700 underline"
                            >
                              {p.productType || 'Set type'}
                            </button>
                          )}
                        </div>
                        
                        {/* Sizes and Prices */}
                        {p.sizes && p.sizes.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {p.sizes.slice(0, 3).map((size, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <span className="text-neutral-600">Size:</span>
                                {inlineEditingId === p._id && inlineEditingSizeIndex === index && inlineEditingField === 'sizeUS' ? (
                                  <input
                                    type="text"
                                    value={inlineEditingValue}
                                    onChange={(e) => setInlineEditingValue(e.target.value)}
                                    onBlur={() => void saveInlineEdit()}
                                    onKeyDown={handleInlineInputKeyDown}
                                    className="w-12 rounded border border-neutral-200 px-1 py-0.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startInlineEdit(p._id, 'sizeUS', size.sizeUS || '', index)}
                                    className="font-medium text-neutral-900 hover:underline"
                                  >
                                    {size.sizeUS}
                                  </button>
                                )}
                                
                                <span className="text-neutral-600">Price:</span>
                                {inlineEditingId === p._id && inlineEditingSizeIndex === index && inlineEditingField === 'price' ? (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={inlineEditingValue}
                                    onChange={(e) => setInlineEditingValue(e.target.value)}
                                    onBlur={() => void saveInlineEdit()}
                                    onKeyDown={handleInlineInputKeyDown}
                                    className="w-20 rounded border border-neutral-200 px-1 py-0.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startInlineEdit(
                                        p._id,
                                        'price',
                                        formatPrice(size.price),
                                        index
                                      )
                                    }
                                    className="font-medium text-neutral-900 hover:underline"
                                  >
                                    ₮{(size.price || 0).toLocaleString()}
                                  </button>
                                )}
                                
                                <span className="text-neutral-600">Stock:</span>
                                {inlineEditingId === p._id && inlineEditingSizeIndex === index && inlineEditingField === 'stock' ? (
                                  <input
                                    type="number"
                                    value={inlineEditingValue}
                                    onChange={(e) => setInlineEditingValue(e.target.value)}
                                    onBlur={() => void saveInlineEdit()}
                                    onKeyDown={handleInlineInputKeyDown}
                                    className="w-12 rounded border border-neutral-200 px-1 py-0.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startInlineEdit(
                                        p._id,
                                        'stock',
                                        String(size.stock ?? 0),
                                        index
                                      )
                                    }
                                    className="font-medium text-neutral-900 hover:underline"
                                  >
                                    {size.stock}
                                  </button>
                                )}
                              </div>
                            ))}
                            {p.sizes.length > 3 && (
                              <div className="text-xs text-neutral-400">
                                +{p.sizes.length - 3} more sizes (edit product to see all)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {on ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingProduct(p)
                              }}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              Edit Product
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleProduct(p._id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                            >
                              Remove from Collection
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleProduct(p._id)}
                            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Add to Collection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          
          {/* Enhanced Inline editing interface */}
          {editingProductId && editingProduct && (
            <div className="space-y-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Edit Product</h3>
                  <p className="text-sm text-neutral-600 mt-1">{editingProduct.title}</p>
                </div>
                <button
                  type="button"
                  onClick={cancelEditingProduct}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-200 pb-2">Basic Information</h4>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">Product Title</label>
                    <input
                      type="text"
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct(prev => prev ? {...prev, title: e.target.value} : null)}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                      placeholder="Enter product title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">URL Slug</label>
                    <input
                      type="text"
                      value={editingProduct.slug}
                      onChange={(e) => setEditingProduct(prev => prev ? {...prev, slug: e.target.value} : null)}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-mono text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                      placeholder="product-slug"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-2">Category</label>
                      <select
                        value={editingProduct?.category || ''}
                        onChange={(e) => setEditingProduct(prev => prev ? {...prev, category: e.target.value} : null)}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                      >
                        <option value="">Select category...</option>
                        {CATEGORY_OPTIONS.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-2">Product Type</label>
                      <select
                        value={editingProduct?.productType || ''}
                        onChange={(e) => setEditingProduct(prev => prev ? {...prev, productType: e.target.value} : null)}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                      >
                        <option value="">Select type...</option>
                        {PRODUCT_TYPE_OPTIONS.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sizes & Prices Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <h4 className="text-sm font-semibold text-neutral-800">Sizes & Pricing</h4>
                  <button
                    type="button"
                    onClick={addSize}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    + Add Size
                  </button>
                </div>
                
                {editingProduct.sizes && editingProduct.sizes.length > 0 ? (
                  <div className="space-y-3">
                    {editingProduct.sizes.map((size, index) => (
                      <div key={index} className="rounded-lg border border-neutral-200 bg-white p-4">
                        <div className="grid gap-3 sm:grid-cols-4">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Size US</label>
                            <input
                              type="text"
                              value={size.sizeUS}
                              onChange={(e) => updateSize(index, 'sizeUS', e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                              placeholder="8"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Size EU</label>
                            <input
                              type="text"
                              value={size.sizeEU}
                              onChange={(e) => updateSize(index, 'sizeEU', e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                              placeholder="41"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1">Price (MNT)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatPrice(size.price)}
                              onChange={(e) => updateSize(index, 'price', unformatPrice(e.target.value))}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                              placeholder="150,000"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-neutral-600 mb-1">Stock</label>
                              <input
                                type="number"
                                value={size.stock}
                                onChange={(e) => updateSize(index, 'stock', Number(e.target.value))}
                                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                                placeholder="10"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSize(index)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
                    <p className="text-sm text-neutral-500">No sizes added yet. Click "Add Size" to get started.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={updateProduct}
                  disabled={productUpdateLoading}
                  className="flex-1 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-neutral-800 transition-colors"
                >
                  {productUpdateLoading ? 'Saving Changes...' : 'Save All Changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditingProduct}
                  className="rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Updating…' : 'Update collection'}
          </button>
          <Link
            href="/admin/collections"
            className="rounded-xl border border-black/15 px-5 py-2.5 text-sm font-medium text-neutral-800"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
