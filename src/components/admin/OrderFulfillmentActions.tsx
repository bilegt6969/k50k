'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Props = {
  orderNumber: string
  orderStatus: string
}

type Action = { next: string; label: string; variant?: 'default' | 'outline' | 'destructive' }

function actionsForStatus(status: string): Action[] {
  switch (status) {
    case 'PendingPayment':
      return [{ next: 'Cancelled', label: 'Cancel order', variant: 'outline' }]
    case 'Paid':
      return [
        { next: 'Processing', label: 'Start packing' },
        { next: 'Cancelled', label: 'Cancel order', variant: 'destructive' },
      ]
    case 'Processing':
      return [
        { next: 'Shipped', label: 'Mark shipped' },
        { next: 'Cancelled', label: 'Cancel order', variant: 'destructive' },
      ]
    case 'Shipped':
      return [{ next: 'Delivered', label: 'Mark delivered' }]
    default:
      return []
  }
}

export function OrderFulfillmentActions({ orderNumber, orderStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const actions = actionsForStatus(orderStatus)
  if (actions.length === 0) return null

  async function go(next: string) {
    setLoading(next)
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: next }),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (!res.ok) {
        toast.error(data.error || 'Could not update status')
        return
      }
      toast.success('Order updated')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-2 px-4 py-4 sm:px-5">
        <p className="text-[13px] font-medium text-zinc-700">Fulfillment</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions.map((a) => (
            <Button
              key={a.next}
              type="button"
              variant={a.variant ?? 'default'}
              size="lg"
              disabled={loading !== null}
              onClick={() => go(a.next)}
              className="rounded-xl"
            >
              {loading === a.next ? 'Saving…' : a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
