'use client'

import Link from 'next/link'
import { ArrowLeft, GripVertical, Trash2 } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

type Row = {
  _id: string
  name: string
  slug: string
  mode: string
  enabled: boolean
  order: number
}

export default function CollectionsListClient({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Function to fix duplicate orders and assign orders to collections without them
  const fixOrderConflicts = useCallback(async () => {
    try {
      const res = await fetch('/api/sanity/collections/fix-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const json = await res.json()
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fix orders')
      }

      // Refresh the data with fixed orders
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fix orders')
    }
  }, [])

  // Check for order conflicts on component mount
  useEffect(() => {
    const hasDuplicates = rows.some((row, index) => 
      rows.findIndex(r => r.order === row.order) !== index
    )
    const hasMissingOrders = rows.some(r => !r.order || r.order <= 0)
    
    if (hasDuplicates || hasMissingOrders) {
      setError('Order conflicts detected. Click "Fix Orders" to resolve.')
    }
  }, [rows])

  const startEdit = (id: string, currentOrder: number) => {
    setEditingId(id)
    setEditValue(currentOrder.toString())
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
    setError(null)
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId)
    }
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem || draggedItem === targetId) return

    const draggedIndex = rows.findIndex(r => r._id === draggedItem)
    const targetIndex = rows.findIndex(r => r._id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Create new array with reordered items
    const newRows = [...rows]
    const [draggedRow] = newRows.splice(draggedIndex, 1)
    newRows.splice(targetIndex, 0, draggedRow)

    // Update order numbers based on new positions
    const reorderedRows = newRows.map((row, index) => ({
      ...row,
      order: index + 1
    }))

    setRows(reorderedRows)
    setReordering(true)

    // Update all affected orders in the database
    try {
      const res = await fetch('/api/sanity/collections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          collections: reorderedRows.map(r => ({ _id: r._id, order: r.order }))
        }),
      })

      const json = await res.json()
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to reorder collections')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder collections')
      // Revert to original order on error
      setRows(rows)
    } finally {
      setReordering(false)
      setDraggedItem(null)
    }
  }

  const deleteCollection = async (id: string, name: string) => {
    setDeleting(id)
    setError(null)

    const previousRows = rows
    setRows((prev) => prev.filter((r) => r._id !== id))

    try {
      const res = await fetch('/api/sanity/collections/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete collection')
      }
    } catch (e) {
      setRows(previousRows)
      setError(
        e instanceof Error
          ? `Could not delete "${name}": ${e.message}`
          : `Could not delete "${name}"`
      )
    } finally {
      setDeleting(null)
    }
  }

  const toggleEnabled = async (id: string, currentEnabled: boolean) => {
    setToggling(id)
    setError(null)

    try {
      const res = await fetch('/api/sanity/collections/toggle-enabled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, enabled: !currentEnabled }),
      })

      const json = await res.json()
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update status')
      }

      // Update local state
      setRows(prev => 
        prev.map(r => r._id === id ? { ...r, enabled: !currentEnabled } : r)
      )
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to update status'
      
      // Provide more user-friendly error messages for network issues
      if (errorMessage.includes('Network connection') || errorMessage.includes('timed out')) {
        setError('Network issue: Unable to connect to Sanity. Please check your internet connection and try again.')
      } else if (errorMessage.includes('Unable to connect to Sanity')) {
        setError('Configuration issue: Unable to connect to Sanity. Please check your environment variables.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setToggling(null)
    }
  }

  const saveOrder = useCallback(async (id: string) => {
    const newOrder = parseInt(editValue, 10)
    
    if (isNaN(newOrder) || newOrder < 1) {
      setError('Order must be a positive number')
      return
    }

    // Check for duplicates
    const duplicate = rows.find(r => r._id !== id && r.order === newOrder)
    if (duplicate) {
      // Instead of blocking, offer to reassign all orders
      if (confirm(`Order ${newOrder} is already used by "${duplicate.name}". Would you like to reassign all orders to fix this conflict?`)) {
        await fixOrderConflicts()
        return
      } else {
        setError(`Order ${newOrder} is already used by "${duplicate.name}". Click "Fix Orders" to resolve all conflicts.`)
        return
      }
    }

    setSaving(id)
    setError(null)

    try {
      const res = await fetch('/api/sanity/collections/update-order', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, order: newOrder }),
      })

      const json = await res.json()
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update order')
      }

      // Update local state
      setRows(prev => 
        prev
          .map(r => r._id === id ? { ...r, order: newOrder } : r)
          .sort((a, b) => a.order - b.order)
      )
      
      setEditingId(null)
      setEditValue('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update order')
    } finally {
      setSaving(null)
    }
  }, [editValue, rows, fixOrderConflicts])

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      void saveOrder(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Collections</h1>
          <p className="mt-1 text-sm text-zinc-600">
            These power the product rows on the home page (<code className="text-xs">/</code>). Enabled collections
            are loaded in <strong>order</strong> ascending.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fixOrderConflicts}
            className="inline-flex justify-center rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-800 transition-colors hover:bg-orange-100"
          >
            Fix Orders
          </button>
          <Link
            href="/admin/collections/new"
            className="inline-flex justify-center rounded-xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Create collection
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
            <tr>
              <th className="px-4 py-3 w-12"></th>
              <th className="px-4 py-3 w-32">Order</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Home</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  No collections yet. Create one to populate the home page.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr 
                  key={r._id} 
                  className={`border-t border-zinc-100 transition-all ${
                    draggedItem === r._id ? 'opacity-50' : ''
                  } ${
                    dragOverItem === r._id ? 'border-t-2 border-t-sky-400 bg-sky-50' : 'hover:bg-zinc-50'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, r._id)}
                  onDragOver={(e) => handleDragOver(e, r._id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, r._id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <GripVertical className="h-4 w-4 cursor-grab text-zinc-400 active:cursor-grabbing" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, r._id)}
                          className="w-16 rounded-lg border border-sky-300 bg-white px-2 py-1 text-sm text-zinc-900 outline-none focus:border-sky-500"
                          autoFocus
                          min={1}
                        />
                        <button
                          onClick={() => void saveOrder(r._id)}
                          disabled={saving === r._id}
                          className="rounded-lg bg-sky-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
                        >
                          {saving === r._id ? '...' : '✓'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-lg bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(r._id, r.order)}
                        className="group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-zinc-700 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-zinc-900"
                      >
                        <span className="font-mono font-semibold text-sm">{r.order}</span>
                        <svg 
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{r.slug}</td>
                  <td className="px-4 py-3 text-zinc-700">{r.mode === 'auto' ? 'Auto' : 'Custom'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEnabled(r._id, r.enabled)}
                      disabled={toggling === r._id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 ${
                        r.enabled ? 'bg-emerald-500' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          r.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                      <span className="sr-only">
                        {r.enabled ? 'Disable collection' : 'Enable collection'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/collections/${r._id}/edit`}
                        className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void deleteCollection(r._id, r.name)}
                        disabled={deleting === r._id}
                        title={`Delete "${r.name}"`}
                        className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete {r.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-xs text-zinc-600">
            <strong>Tip:</strong> Drag collections using the grip handle to reorder, or click any order number to edit it directly. Press Enter to save or Esc to cancel.
            New collections are automatically assigned the next highest order number.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Rename, reorder, or tweak rules anytime in{' '}
            <strong>Sanity Studio</strong> under Product Collections.
          </p>
          {reordering && (
            <div className="mt-2 text-xs text-sky-700">
              Updating collection orders...
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/admin/dashboard" className="text-sm text-zinc-600 underline transition-colors hover:text-zinc-900">
          ← Dashboard
        </Link>
      </div>
      </div>
    </div>
  )
}
