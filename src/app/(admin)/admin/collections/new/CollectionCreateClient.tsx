'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { readAdminSessionState, usePersistAdminSession, clearAdminSessionState } from '@/hooks/useAdminSessionState'
import { dedupeById, dedupeIdsPreserveOrder } from '@/lib/dedupe'

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'choose' | 'form'
type Mode = 'manual' | 'auto' | 'json'
type AutoType = 'recent' | 'trending' | 'mostViewed' | 'mostSearched' | 'byCategory'

type ProductSize = {
  size: string
  price?: number // MNT currency (optional)
  stock?: number
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

type JsonProduct = {
  id: string
  pictureUrl: string
  title: string
  slug: string
  brand?: string
  price: number
}

type FieldErrors = {
  name?: string
  slug?: string
  products?: string
  keyword?: string
  jsonProducts?: string
}

type InlineEditState = {
  productId: string
  sizeIndex: number
  field: 'price' | 'stock'
  value: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTO_OPTIONS: { value: AutoType; label: string; hint: string }[] = [
  { value: 'recent',      label: 'Recently added', hint: 'Newest published products first.' },
  { value: 'trending',    label: 'Trending',        hint: 'Highest view count.' },
  { value: 'mostViewed',  label: 'Most viewed',     hint: 'Same sorting as trending (explicit).' },
  { value: 'mostSearched',label: 'Most searched',   hint: 'Highest search count.' },
  { value: 'byCategory',  label: 'By keyword',      hint: 'e.g. shoe, tee, jordan — matches category, type, or title.' },
]

const CATEGORIES = [
  'Shoes',
  'Apparel',
  'Accessories',
  'Electronics',
  'Home & Living',
  'Sports & Outdoors',
  'Beauty',
  'Toys & Games',
  'Books',
  'Other'
]

const PRODUCT_TYPES = [
  'Sneakers',
  'Running Shoes',
  'Basketball Shoes',
  'Casual Shoes',
  'Boots',
  'T-Shirt',
  'Hoodie',
  'Jacket',
  'Pants',
  'Shorts',
  'Watch',
  'Bag',
  'Hat',
  'Socks',
  'Other'
]
const MIN_ITEMS_FOR_HOME_COLLECTION = 6

const COLLECTION_CREATE_DRAFT_KEY = 'admin:collection-create:draft'

type CollectionCreateDraft = {
  step: Step
  mode: Mode | null
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
  categoryFilter: string
  productTypeFilter: string
  jsonProductsText: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

function getImage(p: ShopProduct) {
  return (
    (p.imageUrls && p.imageUrls[0]) ||
    p.imageUrl ||
    'https://placehold.co/112x112/e5e5e5/666?text=NA'
  )
}

function formatMNT(price?: number): string {
  if (price === undefined || price === null) return '—'
  return `₮${price.toLocaleString()}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

/** Drag-to-reorder strip of selected products */
function SelectedStrip({
  ordered,
  products,
  onReorder,
  onRemove,
}: {
  ordered: string[]
  products: ShopProduct[]
  onReorder: (ids: string[]) => void
  onRemove: (id: string) => void
}) {
  const dragIndex = useRef<number | null>(null)

  if (ordered.length === 0) return null

  const byId = Object.fromEntries(products.map((p) => [p._id, p]))

  const handleDragStart = (i: number) => { dragIndex.current = i }
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    const next = [...ordered]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(i, 0, moved)
    dragIndex.current = i
    onReorder(next)
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">
          {ordered.length} selected — drag to reorder
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ordered.map((id, i) => {
          const p = byId[id]
          if (!p) return null
          return (
            <div
              key={id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              className="group relative flex cursor-grab items-center gap-2 rounded-lg border border-black/10 bg-neutral-50 px-2 py-1.5 text-xs font-medium text-neutral-800 active:cursor-grabbing select-none"
            >
              <div className="relative h-7 w-7 overflow-hidden rounded-md bg-neutral-200 flex-shrink-0">
                <Image src={getImage(p)} alt="" fill className="object-cover" sizes="28px" unoptimized />
              </div>
              <span className="max-w-[100px] truncate">{p.title}</span>
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="ml-1 rounded-full text-neutral-400 hover:text-red-500 transition-colors"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Live preview card */
function LivePreview({
  name,
  mode,
  autoType,
  autoKeyword,
  orderedIds,
  products,
  limit,
}: {
  name: string
  mode: Mode
  autoType: AutoType
  autoKeyword: string
  orderedIds: string[]
  products: ShopProduct[]
  limit: number
}) {
  const byId = Object.fromEntries(products.map((p) => [p._id, p]))
  const displayName = name.trim() || 'Untitled collection'

  const previewProducts = mode === 'manual'
    ? orderedIds.slice(0, 6).map((id) => byId[id]).filter(Boolean) as ShopProduct[]
    : []

  const ruleLabel = mode === 'auto'
    ? AUTO_OPTIONS.find((o) => o.value === autoType)?.label ?? autoType
    : null

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        Live preview
      </div>
      <div className="mb-3 text-base font-semibold text-neutral-900">{displayName}</div>

      {mode === 'manual' ? (
        previewProducts.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {previewProducts.map((p) => (
              <div key={p._id} className="flex-shrink-0 w-20">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-neutral-100">
                  <Image src={getImage(p)} alt="" fill className="object-cover" sizes="80px" unoptimized />
                </div>
                <p className="mt-1 text-[10px] text-neutral-500 truncate">{p.title}</p>
              </div>
            ))}
            {orderedIds.length > 6 && (
              <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-neutral-100 flex items-center justify-center text-sm text-neutral-400 font-medium">
                +{orderedIds.length - 6}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 italic">No products selected yet.</p>
        )
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 border border-black/8 px-3 py-2">
          <span className="text-xs text-neutral-500">Rule:</span>
          <span className="text-xs font-medium text-neutral-800">{ruleLabel}</span>
          {autoType === 'byCategory' && autoKeyword.trim() && (
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700 font-mono">
              {autoKeyword.trim()}
            </span>
          )}
          <span className="ml-auto text-xs text-neutral-400">up to {limit}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CollectionCreateClient({
  duplicateFrom,
}: {
  /** Optional: pre-fill form from an existing collection (for the "Duplicate" flow) */
  duplicateFrom?: {
    name: string
    slug: string
    mode: Mode
    limit: number
    autoType?: AutoType
    autoKeyword?: string
    productIds?: string[]
  }
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(duplicateFrom ? 'form' : 'choose')
  const [mode, setMode] = useState<Mode | null>(duplicateFrom?.mode ?? null)

  // Basic fields
  const [name, setName] = useState(duplicateFrom ? `${duplicateFrom.name} (copy)` : '')
  const [slug, setSlug] = useState(duplicateFrom ? `${duplicateFrom.slug}-copy` : '')
  const [slugTouched, setSlugTouched] = useState(!!duplicateFrom)
  const [limit, setLimit] = useState(duplicateFrom?.limit ?? 24)
  const [enabled, setEnabled] = useState(true)

  // Auto-rule fields
  const [autoType, setAutoType] = useState<AutoType>(duplicateFrom?.autoType ?? 'recent')
  const [autoKeyword, setAutoKeyword] = useState(duplicateFrom?.autoKeyword ?? '')

  // Manual product picker
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [productSearch, setProductSearch] = useState('')
  const initialProductIds = dedupeIdsPreserveOrder(duplicateFrom?.productIds ?? [])
  const [orderedIds, setOrderedIds] = useState<string[]>(initialProductIds)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialProductIds))
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Inline editing state
  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, ShopProduct>>(new Map())

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all')

  // JSON product data
  const [jsonProductsText, setJsonProductsText] = useState('')
  const [jsonProducts, setJsonProducts] = useState<JsonProduct[]>([])
  const [jsonError, setJsonError] = useState<string | null>(null)

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [showPreview, setShowPreview] = useState(false)

  const debouncedProductSearch = useDebouncedValue(productSearch, 350)

  // ── Inline editing functions ──────────────────────────────────────────────

  const startInlineEdit = useCallback((productId: string, sizeIndex: number, field: 'price' | 'stock') => {
    const product = products.find(p => p._id === productId) || pendingUpdates.get(productId)
    if (!product?.sizes?.[sizeIndex]) return

    const currentValue = product.sizes[sizeIndex][field]
    setInlineEdit({
      productId,
      sizeIndex,
      field,
      value: currentValue?.toString() ?? ''
    })
  }, [products, pendingUpdates])

  const cancelInlineEdit = useCallback(() => {
    setInlineEdit(null)
  }, [])

  const updateInlineField = useCallback((newValue: string) => {
    if (!inlineEdit) return
    setInlineEdit({ ...inlineEdit, value: newValue })
  }, [inlineEdit])

  const saveInlineEdit = useCallback(async () => {
    if (!inlineEdit) return

    const { productId, sizeIndex, field, value } = inlineEdit
    const numValue = field === 'stock' ? parseInt(value, 10) : parseFloat(value)

    if (isNaN(numValue) || numValue < 0) {
      setGlobalError(`Invalid ${field} value`)
      setInlineEdit(null)
      return
    }

    // Find the product (either from products or pendingUpdates)
    let product = pendingUpdates.get(productId) || products.find(p => p._id === productId)
    if (!product || !product.sizes) {
      setInlineEdit(null)
      return
    }

    // Create updated product with new size data
    const updatedSizes = [...(product.sizes || [])]
    updatedSizes[sizeIndex] = {
      ...updatedSizes[sizeIndex],
      [field]: numValue
    }

    const updatedProduct = { ...product, sizes: updatedSizes }

    try {
      // Update via API
      const res = await fetch('/api/sanity/shop-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: productId,
          title: updatedProduct.title,
          slug: updatedProduct.slug,
          category: updatedProduct.category,
          productType: updatedProduct.productType,
          sizes: updatedSizes,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Update failed')

      // Update local state
      setPendingUpdates(prev => {
        const next = new Map(prev)
        next.set(productId, updatedProduct)
        return next
      })

      setProducts(prev => prev.map(p => p._id === productId ? updatedProduct : p))
      setInlineEdit(null)
      setGlobalError(null)
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Failed to update product')
      setInlineEdit(null)
    }
  }, [inlineEdit, products, pendingUpdates])

  // Handle Enter/Escape keys for inline editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inlineEdit) return
      if (e.key === 'Enter') {
        e.preventDefault()
        void saveInlineEdit()
      } else if (e.key === 'Escape') {
        cancelInlineEdit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inlineEdit, saveInlineEdit, cancelInlineEdit])

  // ── Load products ──────────────────────────────────────────────────────────

  const loadProducts = useCallback(async (q: string) => {
    setLoadingProducts(true)
    setGlobalError(null)
    try {
      const u = new URL('/api/sanity/shop-products', window.location.origin)
      if (q.trim().length >= 2) u.searchParams.set('q', q.trim())
      u.searchParams.set('includeSizes', 'true') // Include sizes data
      const res = await fetch(u.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load products')
      const next: ShopProduct[] = json.data.products || []
      setProducts((prev) => {
        const map = new Map<string, ShopProduct>()
        prev.forEach((p) => {
          if (selectedIds.has(p._id)) map.set(p._id, p)
        })
        next.forEach((p) => map.set(p._id, p))
        return dedupeById(Array.from(map.values()))
      })
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [selectedIds])

  // Refetch from Sanity as the user types (debounced) so newly published products appear
  useEffect(() => {
    if (mode !== 'manual' || step !== 'form') return
    void loadProducts(debouncedProductSearch)
  }, [debouncedProductSearch, mode, step, loadProducts])

  useEffect(() => {
    if (mode !== 'manual' || step !== 'form') return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadProducts(productSearch)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [mode, step, productSearch, loadProducts])

  // Restore unsaved draft when returning via back/forward or sidebar nav
  const draftRestored = useRef(false)
  useEffect(() => {
    if (draftRestored.current) return
    draftRestored.current = true
    const draft = readAdminSessionState<CollectionCreateDraft>(COLLECTION_CREATE_DRAFT_KEY)
    if (!draft) return
    setStep(draft.step)
    setMode(draft.mode)
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
    setCategoryFilter(draft.categoryFilter)
    setProductTypeFilter(draft.productTypeFilter)
    setJsonProductsText(draft.jsonProductsText)
    if (draft.mode === 'manual') void loadProducts(draft.productSearch)
  }, [loadProducts])

  usePersistAdminSession<CollectionCreateDraft>(
    COLLECTION_CREATE_DRAFT_KEY,
    {
      step,
      mode,
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
      categoryFilter,
      productTypeFilter,
      jsonProductsText,
    },
    400
  )

  // Load products when duplicating a manual collection
  useEffect(() => {
    if (duplicateFrom?.mode === 'manual') void loadProducts('')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Slug sync ──────────────────────────────────────────────────────────────

  const syncSlugFromName = useCallback(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  // ── JSON Products ───────────────────────────────────────────────────────────

  const USD_TO_MNT_RATE = 3450 // Conversion rate: 1 USD = 3450 MNT

  const parseJsonProducts = useCallback((text: string) => {
    setJsonError(null)
    try {
      const parsed = JSON.parse(text)
      if (!parsed.products || !Array.isArray(parsed.products)) {
        throw new Error('JSON must contain a "products" array')
      }
      
      // Validate product structure and handle currency conversion
      const products = parsed.products.map((product: any, index: number) => {
        if (!product.id || !product.title || !product.slug || !product.pictureUrl) {
          throw new Error(`Product at index ${index} is missing required fields (id, title, slug, pictureUrl)`)
        }
        
        let priceInUsd = product.price || 0
        let priceInMnt: number
        let originalPrice: number
        
        // Check if price is already in MNT (large numbers) or USD (smaller numbers)
        if (priceInUsd > 10000) {
          // Likely already in MNT, convert to USD for display
          priceInMnt = Math.round(priceInUsd)
          originalPrice = Math.round(priceInUsd / USD_TO_MNT_RATE)
        } else {
          // Likely in USD, convert to MNT for storage
          priceInMnt = Math.round(priceInUsd * USD_TO_MNT_RATE)
          originalPrice = priceInUsd
        }
        
        return {
          id: product.id,
          pictureUrl: product.pictureUrl,
          title: product.title,
          slug: product.slug,
          brand: typeof product.brand === 'string' ? product.brand.trim() : '',
          price: priceInMnt, // Store in MNT
          originalPrice: originalPrice, // Keep USD for reference
        }
      })
      
      setJsonProducts(products)
      setFieldErrors(prev => ({ ...prev, jsonProducts: undefined }))
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON format'
      setJsonError(errorMessage)
      setFieldErrors(prev => ({ ...prev, jsonProducts: errorMessage }))
      setJsonProducts([])
    }
  }, [])

  const choose = (m: Mode) => {
    setMode(m)
    setStep('form')
    setGlobalError(null)
    setFieldErrors({})
    if (m === 'manual') void loadProducts('')
  }

  // ── Product picker ─────────────────────────────────────────────────────────

  const filteredPick = useMemo(() => {
    let filtered = products

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    // Apply product type filter
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.productType === productTypeFilter)
    }

    // Apply search filter
    if (productSearch.trim().length >= 2) {
      const q = productSearch.trim().toLowerCase()
      filtered = filtered.filter((p) =>
        `${p.title} ${p.brand ?? ''} ${p.category ?? ''} ${p.productType ?? ''}`.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [products, productSearch, categoryFilter, productTypeFilter])

  const toggleProduct = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setOrderedIds((o) => o.filter((x) => x !== id))
      } else {
        next.add(id)
        setOrderedIds((o) => [...o, id])
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    const ids = filteredPick.map((p) => p._id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
    setOrderedIds((prev) => {
      const existing = new Set(prev)
      const toAdd = ids.filter((id) => !existing.has(id))
      return [...prev, ...toAdd]
    })
  }, [filteredPick])

  const deselectAll = useCallback(() => {
    const ids = new Set(filteredPick.map((p) => p._id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
    setOrderedIds((prev) => prev.filter((id) => !ids.has(id)))
  }, [filteredPick])

  const allFilteredSelected = filteredPick.length > 0 && filteredPick.every((p) => selectedIds.has(p._id))

  // Get unique categories and product types from loaded products
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [products])

  const availableProductTypes = useMemo(() => {
    const types = new Set(products.map(p => p.productType).filter(Boolean) as string[])
    return Array.from(types).sort()
  }, [products])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: FieldErrors = {}

    if (!name.trim()) errors.name = 'Display name is required.'
    else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'

    const finalSlug = slug.trim() || slugify(name.trim())
    if (!finalSlug) errors.slug = 'A valid slug is required.'
    else if (!/^[a-z0-9-]+$/.test(finalSlug)) errors.slug = 'Slug may only contain lowercase letters, numbers and hyphens.'

    if (mode === 'manual' && selectedIds.size === 0)
      errors.products = 'Select at least one product.'
    else if (mode === 'manual' && enabled && selectedIds.size < MIN_ITEMS_FOR_HOME_COLLECTION)
      errors.products = `At least ${MIN_ITEMS_FOR_HOME_COLLECTION} products are required when publishing this collection.`

    if (mode === 'json' && jsonProducts.length === 0)
      errors.jsonProducts = 'Add valid JSON product data.'
    else if (mode === 'json' && enabled && jsonProducts.length < MIN_ITEMS_FOR_HOME_COLLECTION)
      errors.jsonProducts = `At least ${MIN_ITEMS_FOR_HOME_COLLECTION} products are required when publishing this collection.`

    if (mode === 'auto' && autoType === 'byCategory' && !autoKeyword.trim())
      errors.keyword = 'Enter a keyword for this collection.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (!mode || !validate()) return

    setSubmitting(true)
    setGlobalError(null)
    try {
      // Fetch the highest order number first
      const maxOrderRes = await fetch('/api/sanity/collections/max-order')
      const maxOrderJson = await maxOrderRes.json()
      const nextOrder = maxOrderJson.success ? (maxOrderJson.data.maxOrder || 0) + 1 : 1

      const finalSlug = slug.trim() || slugify(name.trim())
      const body: Record<string, unknown> = {
        name: name.trim(),
        slug: finalSlug,
        mode,
        limit,
        enabled,
        order: nextOrder, // Auto-assign next highest order
      }
      if (mode === 'manual') {
        body.productIds = dedupeIdsPreserveOrder(orderedIds)
      } else if (mode === 'json') {
        body.rawProductJson = JSON.stringify({ products: jsonProducts })
      } else {
        body.autoType = autoType
        if (autoType === 'byCategory') body.autoCategoryKeyword = autoKeyword.trim()
      }

      const res = await fetch('/api/sanity/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || `Save failed (${res.status})`)
      clearAdminSessionState(COLLECTION_CREATE_DRAFT_KEY)
      router.push('/admin/collections')
      router.refresh()
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-4 text-sm text-neutral-600">
        <Link href="/admin/collections" className="underline hover:text-neutral-900">
          ← Collections
        </Link>
        <span className="text-neutral-300">|</span>
        <Link href="/admin/dashboard" className="underline hover:text-neutral-900">
          Dashboard
        </Link>
      </div>

      {/* Page header */}
      <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">
            {duplicateFrom ? 'Duplicate collection' : 'Create collection'}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Collections appear on the home page. Order is controlled by the{' '}
            <strong>order</strong> field. New collections are automatically assigned the next highest order number.
          </p>
        </div>
        {step === 'form' && (
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              showPreview
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-black/15 text-neutral-700 hover:border-black/30'
            }`}
          >
            {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
        )}
      </div>

      {/* Global error */}
      {globalError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 whitespace-pre-wrap">
          {globalError}
        </div>
      )}

      {/* ── STEP: choose ─────────────────────────────────────────────────── */}
      {step === 'choose' ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => choose('manual')}
            className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:border-black/20 hover:shadow"
          >
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#534AB7"/>
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#AFA9EC"/>
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#AFA9EC"/>
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#534AB7"/>
              </svg>
            </div>
            <div className="text-lg font-semibold text-neutral-900">Custom collection</div>
            <p className="mt-2 text-sm text-neutral-600">
              Hand-pick products and drag them into your preferred order.
            </p>
          </button>
          <button
            type="button"
            onClick={() => choose('auto')}
            className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:border-black/20 hover:shadow"
          >
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8c0-2.761 2.239-5 5-5s5 2.239 5 5-2.239 5-5 5" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 5v3l2 1" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="text-lg font-semibold text-neutral-900">Auto-generated</div>
            <p className="mt-2 text-sm text-neutral-600">
              Trending, newest arrivals, most searched, or a keyword bucket.
            </p>
          </button>
          <button
            type="button"
            onClick={() => choose('json')}
            className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:border-black/20 hover:shadow"
          >
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 3h8a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="#F97316" strokeWidth="1.5" fill="none"/>
                <path d="M6 7h4M6 10h2" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-lg font-semibold text-neutral-900">JSON import</div>
            <p className="mt-2 text-sm text-neutral-600">
              Import products from JSON data with external product information.
            </p>
          </button>
        </div>
      ) : (

      /* ── STEP: form ──────────────────────────────────────────────────── */
        <div className="mt-8 space-y-6">
          <button
            type="button"
            className="text-sm text-neutral-500 hover:text-neutral-900 underline transition"
            onClick={() => { setStep('choose'); setMode(null); setGlobalError(null); setFieldErrors({}) }}
          >
            ← Change type
          </button>

          {/* Live preview */}
          {showPreview && mode && (
            <LivePreview
              name={name}
              mode={mode}
              autoType={autoType}
              autoKeyword={autoKeyword}
              orderedIds={orderedIds}
              products={products}
              limit={limit}
            />
          )}

          {/* Name + Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-500">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-neutral-900 outline-none focus:border-black/30 transition ${
                  fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-black/15'
                }`}
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors((f) => ({ ...f, name: undefined })) }}
                onBlur={syncSlugFromName}
                placeholder="e.g. Staff picks"
              />
              <FieldError msg={fieldErrors.name} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500">URL slug</label>
              <input
                className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm text-neutral-900 outline-none focus:border-black/30 transition ${
                  fieldErrors.slug ? 'border-red-400 bg-red-50' : 'border-black/15'
                }`}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                  setFieldErrors((f) => ({ ...f, slug: undefined }))
                }}
                placeholder="staff-picks"
              />
              <FieldError msg={fieldErrors.slug} />
            </div>
          </div>

          {/* Limit + Visibility */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-500">Max products shown</label>
              <input
                type="number"
                min={1}
                max={100}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-neutral-900 outline-none focus:border-black/30 transition"
                value={limit}
                onChange={(e) => setLimit(Math.min(100, Math.max(1, Number(e.target.value) || 24)))}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-neutral-800 select-none">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="accent-black"
              />
              Visible on the home page
            </label>
          </div>

          {/* ── Auto rule ── */}
          {mode === 'auto' && (
            <div className="space-y-4 rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <div className="text-sm font-semibold text-neutral-900">Rule</div>
              <div className="grid gap-3">
                {AUTO_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-4 transition ${
                      autoType === opt.value ? 'border-black/30 ring-1 ring-black/10' : 'border-black/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="autoType"
                      checked={autoType === opt.value}
                      onChange={() => setAutoType(opt.value)}
                      className="accent-black mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-neutral-900">{opt.label}</div>
                      <div className="text-xs text-neutral-500">{opt.hint}</div>
                    </div>
                  </label>
                ))}
              </div>
              {autoType === 'byCategory' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Keyword <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={`mt-1 w-full max-w-md rounded-lg border px-3 py-2 text-neutral-900 outline-none focus:border-black/30 transition ${
                      fieldErrors.keyword ? 'border-red-400 bg-red-50' : 'border-black/15'
                    }`}
                    value={autoKeyword}
                    onChange={(e) => { setAutoKeyword(e.target.value); setFieldErrors((f) => ({ ...f, keyword: undefined })) }}
                    placeholder="e.g. shoe, tee, hoody"
                  />
                  <FieldError msg={fieldErrors.keyword} />
                </div>
              )}
            </div>
          )}

          {/* ── Manual product picker ── */}
          {mode === 'manual' && (
            <div className="space-y-4 rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-neutral-900">Add products</div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={allFilteredSelected ? deselectAll : selectAll}
                    className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900 transition"
                  >
                    {allFilteredSelected ? 'Deselect all' : 'Select all'}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-neutral-500 underline hover:text-neutral-900 transition"
                    onClick={() => void loadProducts(productSearch)}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black/30 transition"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <select
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black/30 transition"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-black/30 transition"
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {availableProductTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>
                  {loadingProducts ? 'Loading…' : `${filteredPick.length} shown`}
                </span>
                <span>{selectedIds.size} selected</span>
              </div>

              {fieldErrors.products && (
                <p className="text-xs text-red-600">{fieldErrors.products}</p>
              )}

              {/* Product list with inline editing */}
              <div className="max-h-[600px] overflow-auto rounded-xl border border-black/10 bg-white">
                {filteredPick.length === 0 && !loadingProducts && (
                  <div className="py-8 text-center text-sm text-neutral-400">No products found.</div>
                )}
                {filteredPick.map((p) => {
                  const displayProduct = pendingUpdates.get(p._id) || p
                  const on = selectedIds.has(p._id)
                  const firstThreeSizes = displayProduct.sizes?.slice(0, 3) || []
                  const hasMoreSizes = (displayProduct.sizes?.length || 0) > 3

                  return (
                    <div
                      key={p._id}
                      className={`border-b border-black/5 transition ${
                        on ? 'bg-emerald-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 px-3 py-3">
                        {/* Product Image and Info */}
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          <Image src={getImage(p)} alt="" fill className="object-cover" sizes="64px" unoptimized />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          {displayProduct.brand ? (
                            <div className="text-xs font-bold uppercase tracking-wide text-neutral-900">
                              {displayProduct.brand}
                            </div>
                          ) : null}
                          <div className="font-medium text-neutral-900 text-sm">{displayProduct.title}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {displayProduct.category || '—'}
                            {displayProduct.productType ? ` • ${displayProduct.productType}` : ''}
                          </div>

                          {/* Sizes display with inline editing */}
                          {firstThreeSizes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {firstThreeSizes.map((sz, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-[10px] bg-white border border-black/10 rounded px-1.5 py-0.5">
                                  <span className="font-mono font-medium text-neutral-700">{sz.size}</span>
                                  <span className="text-neutral-400">•</span>
                                  
                                  {/* Price inline editing */}
                                  {inlineEdit?.productId === p._id && inlineEdit.sizeIndex === idx && inlineEdit.field === 'price' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        className="w-16 px-1 py-0.5 text-[10px] border border-blue-400 rounded font-mono"
                                        value={inlineEdit.value}
                                        onChange={(e) => updateInlineField(e.target.value)}
                                        onBlur={() => void saveInlineEdit()}
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={cancelInlineEdit}
                                        className="text-neutral-400 hover:text-red-500"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startInlineEdit(p._id, idx, 'price')}
                                      className="font-mono text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                      {formatMNT(sz.price)}
                                    </button>
                                  )}

                                  <span className="text-neutral-400">•</span>

                                  {/* Stock inline editing */}
                                  {inlineEdit?.productId === p._id && inlineEdit.sizeIndex === idx && inlineEdit.field === 'stock' ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        className="w-12 px-1 py-0.5 text-[10px] border border-blue-400 rounded font-mono"
                                        value={inlineEdit.value}
                                        onChange={(e) => updateInlineField(e.target.value)}
                                        onBlur={() => void saveInlineEdit()}
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={cancelInlineEdit}
                                        className="text-neutral-400 hover:text-red-500"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startInlineEdit(p._id, idx, 'stock')}
                                      className="font-mono text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                      {sz.stock ?? '—'}
                                    </button>
                                  )}
                                </div>
                              ))}
                              {hasMoreSizes && (
                                <div className="text-[10px] text-neutral-400 px-1.5 py-0.5">
                                  +{(displayProduct.sizes?.length || 0) - 3} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Add/Remove Button */}
                        <button
                          type="button"
                          onClick={() => toggleProduct(p._id)}
                          className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            on
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {on ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Drag-to-reorder strip */}
              <SelectedStrip
                ordered={orderedIds}
                products={products}
                onReorder={setOrderedIds}
                onRemove={(id) => {
                  setOrderedIds((o) => o.filter((x) => x !== id))
                  setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
                }}
              />
            </div>
          )}

          {/* ── JSON Products Input ── */}
          {mode === 'json' && (
            <div className="space-y-4 rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <div className="text-sm font-semibold text-neutral-900">Import JSON Products</div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-2">
                  JSON Data <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full h-64 rounded-lg border font-mono text-xs px-3 py-2 text-neutral-900 outline-none focus:border-black/30 transition ${
                    fieldErrors.jsonProducts ? 'border-red-400 bg-red-50' : 'border-black/15'
                  }`}
                  value={jsonProductsText}
                  onChange={(e) => {
                    setJsonProductsText(e.target.value)
                    parseJsonProducts(e.target.value)
                  }}
                  placeholder='{"products": [{"id": "123", "pictureUrl": "https://...", "title": "Product Name", "slug": "product-name", "price": 100}]} // USD or MNT (auto-detected)'
                />
                <FieldError msg={fieldErrors.jsonProducts} />
              </div>

              {jsonError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {jsonError}
                </div>
              )}

              {jsonProducts.length > 0 && (
                <div className="text-xs text-neutral-600">
                  ✅ Parsed {jsonProducts.length} products successfully
                  <br />
                  💰 Prices stored in MNT, USD values preserved for reference
                </div>
              )}

              <div className="text-xs text-neutral-500">
                <strong>Required fields:</strong> id, pictureUrl, title, slug<br />
                <strong>Price format:</strong> USD or MNT (auto-detected, stored as MNT)<br />
                <strong>Format:</strong> JSON object with a "products" array
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : duplicateFrom ? 'Save duplicate' : 'Create collection'}
            </button>
            <Link
              href="/admin/collections"
              className="rounded-xl border border-black/15 px-5 py-2.5 text-sm font-medium text-neutral-700 hover:border-black/30 transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}