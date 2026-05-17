'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  orderNumber: string
  orderStatus: string
}

export function OrderPaymentActions({ orderNumber, orderStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function acceptPayment() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderNumber)}/accept-payment`,
        { method: 'POST' }
      )
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        error?: string
        alreadyPaid?: boolean
      }
      if (!res.ok) {
        toast.error(data.error || 'Could not update order')
        return
      }
      if (data.alreadyPaid) {
        toast.message('Already marked as paid')
      } else {
        toast.success('Payment marked as received')
      }
      router.refresh()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orderStatus === 'PendingPayment') {
    return (
      <div className="px-4 py-4 sm:px-5">
        <p className="mb-3 text-[13px] leading-relaxed text-zinc-500">
          When the bank transfer matches this order, confirm here. Status becomes{' '}
          <span className="font-medium text-zinc-800">Paid</span> for fulfillment.
        </p>
        <Button
          type="button"
          disabled={loading}
          onClick={acceptPayment}
          className="h-11 w-full rounded-xl bg-zinc-900 text-[15px] font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Payment received'}
        </Button>
      </div>
    )
  }

  if (orderStatus === 'Paid') {
    return (
      <div className="flex items-start gap-2 px-4 py-3.5 sm:px-5 text-[13px] leading-snug text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <span className="font-medium">Payment received</span> — this order is marked Paid.
        </span>
      </div>
    )
  }

  return null
}
