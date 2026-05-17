'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { readAdminSessionState, usePersistAdminSession, clearAdminSessionState } from '@/hooks/useAdminSessionState'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, 
  Eye, 
  Copy, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Upload,
  Settings,
  BarChart3
} from 'lucide-react'
import DragDropImageGallery from './DragDropImageGallery'
import ImageInspector from './ImageInspector'
import { toast } from 'sonner'

type AdminKickProduct = {
  marketplace: 'goat' | 'stockx'
  kickProductId: string
  kickSlug: string
  name: string
  brand: string
  category: string
  productType: string
  imageUrl: string | null
  imageUrls?: string[]
  sizes: Array<{
    size: string
    available: boolean
    lowestAsk: number | null
    currency: string | null
    totalAsks: number | null
  }>
}

type SizeRow = {
  sizeUS: string
  sizeEU: string
  enabled: boolean
  priceCents: number
  stock: number
  displayPrice: string
}

type PublishStatus = 'draft' | 'scheduled' | 'published' | 'unpublished'

type PublishDraft = {
  sizes: SizeRow[]
  productImages: string[]
  publishStatus: PublishStatus
  scheduledDate: string
  activeTab: 'images' | 'pricing' | 'details' | 'analytics'
}

interface EnhancedProductPublisherProps {
  kickProductId: string
}

export default function EnhancedProductPublisher({ kickProductId }: EnhancedProductPublisherProps) {
  const searchParams = useSearchParams()
  const marketplace = (searchParams.get('marketplace') as 'goat' | 'stockx') || 'goat'
  const draftKey = `admin:publish:${kickProductId}:${marketplace}`

  const [product, setProduct] = useState<AdminKickProduct | null>(null)
  const [sizes, setSizes] = useState<SizeRow[]>([])
  const [productImages, setProductImages] = useState<string[]>([])
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('draft')
  const [scheduledDate, setScheduledDate] = useState('')
  const [currency] = useState('MNT')
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'images' | 'pricing' | 'details' | 'analytics'>('images')

  // Mock analytics data
  const [analytics] = useState({
    views: 1234,
    clicks: 89,
    conversionRate: 7.2,
    revenue: 456789,
    avgOrderValue: 5134
  })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      try {
        const url = new URL(
          `/api/kicksdev/products/${encodeURIComponent(kickProductId)}`,
          window.location.origin
        )
        url.searchParams.set('marketplace', marketplace)
        const res = await fetch(url.toString(), { cache: 'no-store' })
        const json = await res.json()
        
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || `Failed (${res.status})`)
        }
        
        setProduct(json.data)
        
        // Set up images
        const images = Array.isArray(json.data.imageUrls) 
          ? json.data.imageUrls 
          : json.data.imageUrl 
            ? [json.data.imageUrl] 
            : []
        const savedDraft = readAdminSessionState<PublishDraft>(draftKey)

        setProductImages(savedDraft?.productImages?.length ? savedDraft.productImages : images)
        if (savedDraft?.publishStatus) setPublishStatus(savedDraft.publishStatus)
        if (savedDraft?.scheduledDate) setScheduledDate(savedDraft.scheduledDate)
        if (savedDraft?.activeTab) setActiveTab(savedDraft.activeTab)
        
        // Set up sizes
        const usToEu = (us: string) => {
          const map: Record<string, string> = {
            '3.5': '35.5','4': '36','4.5': '36.5','5': '37.5','5.5': '38','6': '38.5','6.5': '39',
            '7': '40','7.5': '40.5','8': '41','8.5': '42','9': '42.5','9.5': '43','10': '44',
            '10.5': '44.5','11': '45','11.5': '45.5','12': '46','12.5': '47','13': '47.5','14': '48.5',
          }
          return map[us] || ''
        }
        
        if (savedDraft?.sizes?.length) {
          setSizes(savedDraft.sizes)
        } else {
          setSizes(
            (json.data.sizes || []).map((s: any) => {
              const sizeUS = String(s.size)
              const sizeEU = usToEu(sizeUS) || sizeUS
              const priceCents = 0
              return {
                sizeUS,
                sizeEU,
                enabled: false,
                priceCents,
                displayPrice: formatPrice(priceCents),
                stock: 0,
              }
            })
          )
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [kickProductId, marketplace, draftKey])

  const publishDraft = useMemo<PublishDraft>(
    () => ({
      sizes,
      productImages,
      publishStatus,
      scheduledDate,
      activeTab,
    }),
    [sizes, productImages, publishStatus, scheduledDate, activeTab]
  )
  usePersistAdminSession(draftKey, publishDraft, 400)

  // Format number with commas, no decimal places
  const formatPrice = (cents: number) => {
    const dollars = Math.round(cents / 100)
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(dollars)
  }

  // Parse formatted price back to cents
  const parsePrice = (formattedPrice: string) => {
    // Remove commas and convert to number
    const cleanPrice = formattedPrice.replace(/,/g, '')
    const number = parseFloat(cleanPrice)
    if (!Number.isFinite(number) || number < 0) return 0
    return Math.round(number * 100)
  }

  // Handle price input with smart comma formatting while typing
  const handlePriceChange = (value: string, idx: number, inputElement: HTMLInputElement) => {
    // Store cursor position before formatting
    const cursorPosition = inputElement.selectionStart || 0
    const oldValue = sizes[idx].displayPrice
    
    // Remove commas and other non-numeric characters
    const cleanValue = value.replace(/[^0-9]/g, '')
    
    // If the input is empty, set to empty string
    if (cleanValue === '') {
      updateSize(idx, { 
        displayPrice: '', 
        priceCents: 0 
      })
      return
    }
    
    // Convert to cents
    const number = parseInt(cleanValue, 10)
    if (!Number.isFinite(number) || number < 0) return
    
    const priceCents = number * 100
    
    // Format with commas
    const formattedValue = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number)
    
    // Calculate new cursor position
    // Count commas before cursor in old value
    const commasBeforeCursor = (oldValue.slice(0, cursorPosition).match(/,/g) || []).length
    // Count commas before cursor in new value
    const newCommasBeforeCursor = (formattedValue.slice(0, cursorPosition).match(/,/g) || []).length
    // Adjust cursor position based on comma difference
    const newCursorPosition = cursorPosition + (newCommasBeforeCursor - commasBeforeCursor)
    
    // Update state
    updateSize(idx, { 
      displayPrice: formattedValue, 
      priceCents 
    })
    
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition)
    })
  }

  // Format price when user leaves the input field
  const handlePriceBlur = (idx: number) => {
    const currentSize = sizes[idx]
    if (currentSize.displayPrice === '') {
      updateSize(idx, { 
        displayPrice: '0', 
        priceCents: 0 
      })
    }
    // Value is already formatted from handlePriceChange, just ensure it's clean
  }

  const updateSize = (idx: number, patch: Partial<SizeRow>) => {
    setSizes(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const handleStockChange = (value: string, idx: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '')
    if (cleanValue === '') {
      updateSize(idx, { stock: 0 })
      return
    }
    updateSize(idx, { stock: parseInt(cleanValue, 10) || 0 })
  }

  const handleStockFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (event.target.value === '0') {
      event.target.select()
    }
  }

  const saveDraft = async () => {
    setIsSaving(true)
    setError(null)
    // Simulate saving draft
    setTimeout(() => {
      setIsSaving(false)
      setSuccess('Draft saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    }, 1000)
  }

  const publish = async () => {
    if (!product) return
    setIsPublishing(true)
    setError(null)
    setSuccess(null)
    
    try {
      const res = await fetch('/api/sanity/products/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kickProductId: product.kickProductId,
          kickSlug: product.kickSlug,
          title: product.name,
          brand: product.brand,
          category: product.category,
          productType: product.productType,
          imageUrl: productImages[0] || product.imageUrl,
          currency,
          imageUrls: productImages,
          sizes: sizes
            .filter((s) => s.enabled)
            .map((s) => ({ sizeUS: s.sizeUS, sizeEU: s.sizeEU, priceCents: s.priceCents, stock: s.stock })),
          published: publishStatus === 'published',
          scheduledDate: publishStatus === 'scheduled' ? scheduledDate : undefined,
        }),
      })
      
      const json = await res.json()
      if (!res.ok || !json.success || !json.data?._id) {
        throw new Error(json.error || `Publish failed (${res.status})`)
      }
      
      setSuccess(`Product ${publishStatus === 'scheduled' ? 'scheduled' : 'published'}: ${json.data._id}`)
      clearAdminSessionState(draftKey)
      setPublishStatus('published')
      if (publishStatus === 'scheduled') {
        toast.success('Product scheduled', {
          description: `${product.name} will publish on your chosen date.`,
          duration: 4000,
        })
      } else {
        toast.success('Product published', {
          description: `${product.name} is now live in your shop.`,
          duration: 4000,
        })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(message)
      toast.error('Could not publish', { description: message, duration: 5000 })
    } finally {
      setIsPublishing(false)
    }
  }

  const duplicateProduct = () => {
    // Simulate duplication
    setSuccess('Product duplicated successfully')
    setTimeout(() => setSuccess(null), 3000)
  }

  const deleteProduct = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      // Simulate deletion
      setSuccess('Product deleted successfully')
      setTimeout(() => {
        window.location.href = '/admin/products'
      }, 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">Product not found</p>
          <Link href="/admin/products" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Back to products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Enhanced Product Publisher</h1>
          <p className="mt-2 text-neutral-600 text-sm">Advanced product management with image inspector and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Link className="text-sm underline text-neutral-700 hover:text-neutral-900" href="/admin/products">
            ← Back to search
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Info Card */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-start gap-5">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-black/10 bg-zinc-50">
            <div className="absolute inset-2">
              <Image
                src={productImages[0] || product.imageUrl || 'https://placehold.co/200x200?text=No+Image'}
                alt={product.name}
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-semibold">{product.name}</div>
            <div className="mt-1 text-sm text-neutral-600">
              {product.brand}
              {product.category ? ` • ${product.category}` : ''}
              {product.productType ? ` • ${product.productType}` : ''}
              {` • ${product.marketplace.toUpperCase()}`}
            </div>
            <div className="mt-2 flex items-center gap-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                publishStatus === 'published' ? 'bg-green-100 text-green-800' :
                publishStatus === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {publishStatus === 'published' ? 'Published' :
                 publishStatus === 'scheduled' ? 'Scheduled' : 'Draft'}
              </span>
              <span className="text-xs text-neutral-500">
                {productImages.length} images • {sizes.filter(s => s.enabled).length} sizes active
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={duplicateProduct}
              className="p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
              title="Duplicate product"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={deleteProduct}
              className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-black/10 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'images', label: 'Images', icon: Upload },
            { id: 'pricing', label: 'Pricing & Sizes', icon: Settings },
            { id: 'details', label: 'Details', icon: Eye },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-600 hover:text-black'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'images' && (
          <motion.div
            key="images"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <DragDropImageGallery
                images={productImages}
                onImagesChange={setProductImages}
                maxImages={12}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'pricing' && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold mb-4">Pricing & Inventory</div>
              <div className="space-y-4">
                {/* Publish Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Publish Status</label>
                    <select
                      value={publishStatus}
                      onChange={(e) => setPublishStatus(e.target.value as PublishStatus)}
                      className="w-full rounded-lg bg-white border border-black/15 px-3 py-2 outline-none focus:border-black/30"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="unpublished">Unpublished</option>
                    </select>
                  </div>
                  
                  {publishStatus === 'scheduled' && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Schedule Date</label>
                      <input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full rounded-lg bg-white border border-black/15 px-3 py-2 outline-none focus:border-black/30"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Currency</label>
                    <input
                      type="text"
                      value={currency}
                      disabled
                      className="w-full rounded-lg bg-neutral-100 border border-black/15 px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                {/* Sizes Table */}
                <div className="mt-6">
                  <div className="text-lg font-semibold mb-2">Sizes & Pricing</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-neutral-600">
                        <tr>
                          <th className="text-left py-2 pr-3">Sell</th>
                          <th className="text-left py-2 pr-3">US / EU</th>
                          <th className="text-left py-2 pr-3">Price (MNT)</th>
                          <th className="text-left py-2 pr-3">Stock</th>
                          <th className="text-left py-2 pr-3">Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map((row, idx) => (
                          <tr key={`${row.sizeUS}-${row.sizeEU}`} className="border-t border-black/10">
                            <td className="py-2 pr-3">
                              <input
                                type="checkbox"
                                checked={row.enabled}
                                onChange={(e) => updateSize(idx, { enabled: e.target.checked })}
                              />
                            </td>
                            <td className="py-2 pr-3 font-medium">
                              US {row.sizeUS} <span className="text-neutral-500">/</span> EU {row.sizeEU}
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                className="w-36 rounded-lg bg-white border border-black/15 px-3 py-2 outline-none focus:border-black/30"
                                inputMode="decimal"
                                value={row.displayPrice}
                                disabled={!row.enabled}
                                onChange={(e) => handlePriceChange(e.target.value, idx, e.target)}
                                onBlur={() => handlePriceBlur(idx)}
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <input
                                className="w-28 rounded-lg bg-white border border-black/15 px-3 py-2 outline-none focus:border-black/30"
                                type="number"
                                value={row.stock}
                                disabled={!row.enabled}
                                onFocus={handleStockFocus}
                                onChange={(e) => handleStockChange(e.target.value, idx)}
                                min={0}
                              />
                            </td>
                            <td className="py-2 pr-3 text-neutral-600">
                              {product.sizes.find((s) => String(s.size) === String(row.sizeUS))?.available ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold mb-4">Product Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={product.name}
                    readOnly
                    className="w-full rounded-lg bg-neutral-100 border border-black/15 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                  <input
                    type="text"
                    value={product.brand}
                    readOnly
                    className="w-full rounded-lg bg-neutral-100 border border-black/15 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={product.category || ''}
                    readOnly
                    className="w-full rounded-lg bg-neutral-100 border border-black/15 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Product Type</label>
                  <input
                    type="text"
                    value={product.productType || ''}
                    readOnly
                    className="w-full rounded-lg bg-neutral-100 border border-black/15 px-3 py-2 outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Views', value: analytics.views.toLocaleString(), icon: Eye },
                { label: 'Clicks', value: analytics.clicks.toLocaleString(), icon: TrendingUp },
                { label: 'Conversion Rate', value: `${analytics.conversionRate}%`, icon: BarChart3 },
                { label: 'Revenue', value: `₮${analytics.revenue.toLocaleString()}`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-black/10 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-black/60" />
                    <span className="text-sm text-neutral-600">{label}</span>
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold mb-4">Performance Overview</div>
              <div className="text-sm text-neutral-600">
                <p>Analytics data will be available once the product is published and has traffic.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 mt-8">
        <button
          onClick={saveDraft}
          disabled={isSaving}
          className="rounded-xl bg-white text-black font-semibold px-5 py-3 border border-black/20 disabled:opacity-60 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        
        <button
          onClick={publish}
          disabled={isPublishing || sizes.filter(s => s.enabled).length === 0}
          className="rounded-xl bg-black text-white font-semibold px-5 py-3 disabled:opacity-60 flex items-center gap-2"
        >
          {isPublishing ? 'Publishing…' : publishStatus === 'scheduled' ? 'Schedule Product' : 'Publish Product'}
        </button>
      </div>
    </div>
  )
}