'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Upload,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import DragDropImageGallery from '@/components/admin/DragDropImageGallery'
import { toast } from 'sonner'

type SizeRow = {
  sizeUS: string
  sizeEU: string
  enabled: boolean
  priceCents: number
  stock: number
  displayPrice: string
}

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

// Format number with commas, no decimal places
function formatPrice(cents: number) {
  const dollars = Math.round(cents / 100)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars)
}

// Parse formatted price back to cents
function parsePrice(formattedPrice: string) {
  const cleanPrice = formattedPrice.replace(/,/g, '')
  const number = parseFloat(cleanPrice)
  if (!Number.isFinite(number) || number < 0) return 0
  return Math.round(number * 100)
}

export default function ProductEditClient({ product }: { product: Product }) {
  const [sizes, setSizes] = useState<SizeRow[]>(
    product.sizes.map((s) => ({
      sizeUS: s.sizeUS,
      sizeEU: s.sizeEU,
      enabled: s.stock > 0,
      priceCents: s.priceCents,
      stock: s.stock,
      displayPrice: formatPrice(s.priceCents),
    }))
  )

  const updateSize = (idx: number, patch: Partial<SizeRow>) => {
    setSizes((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const [productImages, setProductImages] = useState<string[]>(
    Array.isArray(product.imageUrls)
      ? product.imageUrls
      : product.imageUrl
      ? [product.imageUrl]
      : []
  )
  const [published, setPublished] = useState(product.published)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'images' | 'pricing' | 'details'>('images')

  // Handle price input — allow raw typing without formatting
  const handlePriceChange = (value: string, idx: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '')

    if (cleanValue === '') {
      updateSize(idx, { displayPrice: '', priceCents: 0 })
      return
    }

    const number = parseInt(cleanValue, 10)
    if (!Number.isFinite(number) || number < 0) return

    const priceCents = number * 100
    updateSize(idx, { displayPrice: cleanValue, priceCents })
  }

  // Format price when user leaves the input field
  const handlePriceBlur = (idx: number) => {
    const currentSize = sizes[idx]
    if (currentSize.displayPrice === '') {
      updateSize(idx, { displayPrice: '0', priceCents: 0 })
    } else {
      const priceCents = parsePrice(currentSize.displayPrice)
      updateSize(idx, { displayPrice: formatPrice(priceCents), priceCents })
    }
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
    setSuccess(null)

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
          imageUrl: productImages[0] || product.imageUrl,
          imageUrls: productImages,
          sizes: sizes.map((s) => ({
            sizeUS: s.sizeUS,
            sizeEU: s.sizeEU,
            priceCents: s.priceCents,
            stock: s.stock,
          })),
          published: false,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Save failed (${res.status})`)
      }

      setSuccess('Product saved successfully')
      // Force page reload to get fresh data from server
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const publish = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

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
          imageUrl: productImages[0] || product.imageUrl,
          imageUrls: productImages,
          sizes: sizes.map((s) => ({
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

      setSuccess('Product published successfully')
      setPublished(true)
      toast.success('Product published', {
        description: `${product.title} is now live in your shop.`,
        duration: 4000,
      })
      // Force page reload to get fresh data from server
      setTimeout(() => {
        window.location.reload()
      }, 1600)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      toast.error('Publish failed', {
        description: e instanceof Error ? e.message : 'Unknown error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteProduct = () => {
    if (
      confirm('Are you sure you want to delete this product? This action cannot be undone.')
    ) {
      setSuccess('Product deleted successfully')
      setTimeout(() => {
        window.location.href = '/admin/products/manage'
      }, 2000)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Edit Product</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Update product details, pricing, and images
          </p>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
            className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <CheckCircle className="w-4 h-4" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Info Card */}
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            <div className="absolute inset-2">
              <Image
                src={
                  productImages[0] ||
                  product.imageUrl ||
                  'https://placehold.co/200x200?text=No+Image'
                }
                alt={product.title}
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-semibold text-zinc-900">{product.title}</div>
            <div className="mt-1 text-sm text-zinc-600">
              {product.brand}
              {product.category ? ` • ${product.category}` : ''}
              {product.productType ? ` • ${product.productType}` : ''}
            </div>
            <div className="mt-2 flex items-center gap-4">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  published
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                {published ? 'Published' : 'Draft'}
              </span>
              <span className="text-xs text-zinc-500">
                {productImages.length} images •{' '}
                {sizes.filter((s) => s.enabled).length} sizes active
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={deleteProduct}
              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition-colors hover:bg-red-100"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-200">
        <nav className="flex gap-6">
          {[
            { id: 'images', label: 'Images', icon: Upload },
            { id: 'pricing', label: 'Pricing & Sizes', icon: Settings },
            { id: 'details', label: 'Details', icon: Eye },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'images' | 'pricing' | 'details')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-zinc-900">Pricing & Inventory</div>

              <div className="mt-6">
                <div className="mb-2 text-lg font-semibold text-zinc-900">Sizes & Pricing</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-zinc-600">
                      <tr>
                        <th className="text-left py-2 pr-3">Sell</th>
                        <th className="text-left py-2 pr-3">US / EU</th>
                        <th className="text-left py-2 pr-3">Price (MNT)</th>
                        <th className="text-left py-2 pr-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((row, idx) => (
                        <tr
                          key={`${row.sizeUS}-${row.sizeEU}`}
                          className="border-t border-zinc-200"
                        >
                          <td className="py-2 pr-3">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) =>
                                updateSize(idx, { enabled: e.target.checked })
                              }
                            />
                          </td>
                          <td className="py-2 pr-3 font-medium text-zinc-900">
                            US {row.sizeUS}{' '}
                            <span className="text-zinc-400">/</span> EU{' '}
                            {row.sizeEU}
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              className="w-36 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50"
                              inputMode="decimal"
                              value={row.displayPrice}
                              disabled={!row.enabled}
                              onChange={(e) =>
                                handlePriceChange(e.target.value, idx)
                              }
                              onBlur={() => handlePriceBlur(idx)}
                            />
                          </td>
                          <td className="py-2 pr-3">
                            <input
                              className="w-28 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400 disabled:opacity-50"
                              type="number"
                              value={row.stock}
                              disabled={!row.enabled}
                              onFocus={handleStockFocus}
                              onChange={(e) => handleStockChange(e.target.value, idx)}
                              min={0}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-zinc-900">Product Details</div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    readOnly
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={product.brand}
                    readOnly
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Category
                  </label>
                  <input
                    type="text"
                    value={product.category || ''}
                    readOnly
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={product.productType || ''}
                    readOnly
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 outline-none"
                  />
                </div>
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
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>

        <button
          onClick={publish}
          disabled={isLoading || sizes.filter((s) => s.enabled).length === 0}
          className="flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
        >
          {isLoading ? 'Publishing…' : 'Publish Product'}
        </button>
      </div>
    </div>
  )
}