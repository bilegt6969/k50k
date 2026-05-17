import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { groq } from 'next-sanity'
import { ChevronLeft, Package } from 'lucide-react'
import { getAdminSanityReadClient } from '@/lib/admin-sanity-read'
import { OrderFulfillmentActions } from '@/components/admin/OrderFulfillmentActions'
import { OrderPaymentActions } from '@/components/admin/OrderPaymentActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderItem = {
  _key?: string
  productId?: string
  name: string
  size?: string
  quantity: number
  price: number
}

type OrderDetail = {
  _id: string
  orderNumber: string
  transferCode: string
  customerName: string
  email: string
  phone: string
  province: string
  district: string
  address: string
  paymentMethod?: string
  bankName?: string
  bankAccount?: string
  orderStatus: string
  subtotal: number
  deliveryFee: number
  commissionFee: number
  totalAmount: number
  createdAt: string | null
  items: OrderItem[]
}

const ORDER_QUERY = groq`*[_type == "order" && orderNumber == $orderNumber][0]{
  _id,
  orderNumber,
  transferCode,
  customerName,
  email,
  phone,
  province,
  district,
  address,
  paymentMethod,
  bankName,
  bankAccount,
  orderStatus,
  subtotal,
  deliveryFee,
  commissionFee,
  totalAmount,
  createdAt,
  items[]{ _key, productId, name, size, quantity, price }
}`

const statusLabel: Record<string, string> = {
  PendingPayment: 'Pending payment',
  Paid: 'Paid',
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
}

function statusTone(status: string): string {
  switch (status) {
    case 'Delivered':
      return 'bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-500/20'
    case 'Shipped':
      return 'bg-blue-500/12 text-blue-800 ring-1 ring-blue-500/20'
    case 'Paid':
    case 'Processing':
      return 'bg-violet-500/10 text-violet-800 ring-1 ring-violet-500/15'
    case 'Cancelled':
      return 'bg-zinc-500/10 text-zinc-700 ring-1 ring-zinc-400/20'
    default:
      return 'bg-amber-500/12 text-amber-900 ring-1 ring-amber-500/25'
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-4 py-3 sm:px-5">
      <span className="shrink-0 text-[13px] text-zinc-500">{label}</span>
      <span className="min-w-0 text-right text-[15px] text-zinc-950">{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="divide-y divide-zinc-100">{children}</div>
      </div>
    </section>
  )
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber: raw } = await params
  const orderNumber = decodeURIComponent(raw)

  const client = getAdminSanityReadClient()
  const order = await client.fetch<OrderDetail | null>(ORDER_QUERY, { orderNumber }, { cache: 'no-store', next: { revalidate: 0 } })

  if (!order) {
    notFound()
  }

  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div
      className="mx-auto w-full max-w-2xl pb-20 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-[15px] font-medium text-blue-600 transition hover:text-blue-700"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Orders
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-950">{order.orderNumber}</h1>
          <p className="mt-2 text-[14px] text-zinc-500">{formatWhen(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${statusTone(order.orderStatus)}`}>
          {statusLabel[order.orderStatus] ?? order.orderStatus}
        </span>
      </div>

      <div className="mt-10 space-y-8">
        <Section title="Customer">
          <Row label="Name" value={order.customerName} />
          <Row label="Email" value={order.email} />
          <Row label="Phone" value={order.phone} />
        </Section>

        <Section title="Shipping">
          <Row label="Province" value={order.province} />
          <Row label="District" value={order.district} />
          <div className="px-4 py-3 sm:px-5">
            <span className="block text-[13px] text-zinc-500">Address</span>
            <p className="mt-1 text-[15px] leading-snug text-zinc-950">{order.address}</p>
          </div>
        </Section>

        <Section title="Payment">
          <Row label="Bank" value={order.bankName ?? ''} />
          <Row label="Account" value={order.bankAccount ?? ''} />
          <Row label="Method" value={order.paymentMethod ?? ''} />
          <div className="px-4 py-3 sm:px-5">
            <span className="block text-[13px] text-zinc-500">Transfer reference</span>
            <p className="mt-1 font-mono text-[17px] font-semibold tracking-wide text-zinc-950">{order.transferCode}</p>
          </div>
          <OrderPaymentActions orderNumber={order.orderNumber} orderStatus={order.orderStatus} />
        </Section>

        <OrderFulfillmentActions orderNumber={order.orderNumber} orderStatus={order.orderStatus} />

        <Section title="Totals">
          <Row label="Subtotal" value={`${(order.subtotal ?? 0).toLocaleString()} ₮`} />
          <Row label="Delivery" value={`${(order.deliveryFee ?? 0).toLocaleString()} ₮`} />
          <Row label="Service fee" value={`${(order.commissionFee ?? 0).toLocaleString()} ₮`} />
          <div className="flex items-baseline justify-between gap-6 bg-zinc-50/80 px-4 py-3.5 sm:px-5">
            <span className="text-[13px] font-semibold text-zinc-600">Total</span>
            <span className="text-[17px] font-semibold tabular-nums text-zinc-950">{(order.totalAmount ?? 0).toLocaleString()} ₮</span>
          </div>
        </Section>

        <section>
          <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Items</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <ul className="divide-y divide-zinc-100">
              {items.map((item, i) => {
                const line = (item.price ?? 0) * (item.quantity ?? 0)
                const key = item._key ?? `${item.name}-${i}`
                return (
                  <li key={key} className="flex gap-4 px-4 py-4 sm:px-5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/80">
                      <div className="flex h-full w-full items-center justify-center text-zinc-400">
                        <Package className="h-7 w-7" strokeWidth={1.25} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium leading-snug text-zinc-950">{item.name}</p>
                      <p className="mt-0.5 text-[13px] text-zinc-500">
                        Size {item.size ?? '—'} · Qty {item.quantity}
                      </p>
                      <p className="mt-1 text-[12px] text-zinc-400 tabular-nums">
                        {(item.price ?? 0).toLocaleString()} ₮ each
                      </p>
                    </div>
                    <p className="shrink-0 pt-0.5 text-[15px] font-semibold tabular-nums text-zinc-950">{line.toLocaleString()} ₮</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
