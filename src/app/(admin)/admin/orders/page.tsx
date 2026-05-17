import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { getAdminSanityReadClient } from '@/lib/admin-sanity-read'
import {
  ADMIN_ORDER_STATUSES,
  PAGE_SIZE,
  buildOrderListCountQuery,
  buildOrderListRowsQuery,
  orderListGroqBindings,
  parseOrderListSearchParams,
  type ParsedOrderListFilters,
} from '@/lib/admin-orders-filters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderListRow = {
  _id: string
  orderNumber: string
  customerName: string
  email: string
  orderStatus: string
  totalAmount: number
  createdAt: string | null
  itemCount: number
}

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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function listQueryString(f: ParsedOrderListFilters, overrides: Partial<{ page: number }> = {}) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.status) p.set('status', f.status)
  if (f.queue) p.set('queue', f.queue)
  const page = overrides.page ?? f.page
  if (page > 1) p.set('page', String(page))
  const s = p.toString()
  return s ? `?${s}` : ''
}

function exportQueryString(f: ParsedOrderListFilters) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.status) p.set('status', f.status)
  if (f.queue) p.set('queue', f.queue)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const filters = parseOrderListSearchParams(raw)
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? 'Admin'

  const client = getAdminSanityReadClient()
  const bindings = orderListGroqBindings(filters)

  const totalCount = await client.fetch<number>(buildOrderListCountQuery(), bindings, {
    cache: 'no-store',
    next: { revalidate: 0 },
  })

  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page), totalPages)
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE

  const orders = await client.fetch<OrderListRow[]>(
    buildOrderListRowsQuery(),
    { ...bindings, start, end },
    { cache: 'no-store', next: { revalidate: 0 } }
  )

  const exportHref = `/api/admin/orders/export${exportQueryString({ ...filters, page })}`

  return (
    <div
      className="mx-auto w-full max-w-3xl pb-16 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      <header className="mb-10">
        <p className="text-[13px] font-medium uppercase tracking-wide text-zinc-400">Store</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-zinc-950">Orders</h1>
          <span className="text-[13px] text-zinc-500">{email}</span>
        </div>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-zinc-500">
          Every checkout in one place. Search, filter by status, and export for accounting.
        </p>
      </header>

      <div className="mb-5 space-y-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Search</span>
            <input
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Order #, email, or name"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[15px] text-zinc-900 outline-none ring-zinc-400/30 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2"
            />
          </label>
          <label className="flex w-full flex-col gap-1 sm:w-44">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[14px] text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-400/30"
            >
              <option value="">All statuses</option>
              {ADMIN_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s] ?? s}
                </option>
              ))}
            </select>
          </label>
          {filters.queue === 'fulfillment' && !filters.status ? (
            <input type="hidden" name="queue" value="fulfillment" />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="h-10 rounded-xl bg-zinc-900 px-4 text-[14px] font-medium text-white transition hover:bg-zinc-800"
            >
              Apply
            </button>
            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[14px] font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Reset
            </Link>
            <a
              href={exportHref}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[14px] font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Export CSV
            </a>
          </div>
        </form>
        <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
          <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-zinc-400 sm:w-auto sm:py-1.5">
            Quick filters
          </span>
          <Link
            href="/admin/orders?queue=fulfillment"
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              filters.queue === 'fulfillment' && !filters.status
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Needs fulfillment
          </Link>
          <Link
            href="/admin/orders?status=PendingPayment"
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              filters.status === 'PendingPayment'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Awaiting payment
          </Link>
          <Link
            href="/admin/orders?status=Paid"
            className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
              filters.status === 'Paid'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Paid
          </Link>
        </div>
      </div>

      <p className="mb-3 text-[13px] text-zinc-500">
        {(totalCount ?? 0).toLocaleString()} order{(totalCount ?? 0) === 1 ? '' : 's'}
        {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
      </p>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] text-zinc-500">No orders match these filters.</p>
            <p className="mt-1 text-[13px] text-zinc-400">Try clearing search or choosing “All statuses”.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {orders.map((order) => (
              <li key={order._id}>
                <Link
                  href={`/admin/orders/${encodeURIComponent(order.orderNumber)}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-zinc-900">{order.orderNumber}</span>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(order.orderStatus)}`}
                      >
                        {statusLabel[order.orderStatus] ?? order.orderStatus}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-zinc-500">{order.customerName}</p>
                    <p className="truncate text-[12px] text-zinc-400">{order.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-semibold tabular-nums text-zinc-900">
                      {(order.totalAmount ?? 0).toLocaleString()}{' '}
                      <span className="text-[12px] font-normal text-zinc-500">₮</span>
                    </p>
                    <p className="text-[12px] text-zinc-400 tabular-nums">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-[11px] text-zinc-400 tabular-nums">{formatWhen(order.createdAt)}</p>
                  </div>
                  <ChevronRight className="h-[18px] w-[18px] shrink-0 text-zinc-300 transition group-hover:text-zinc-500" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Pagination">
          <Link
            href={page <= 1 ? '#' : `/admin/orders${listQueryString({ ...filters, page: page - 1 })}`}
            className={`inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[13px] font-medium text-zinc-800 ${
              page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-50'
            }`}
            aria-disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </Link>
          <span className="text-[13px] text-zinc-500">
            Page {page} / {totalPages}
          </span>
          <Link
            href={
              page >= totalPages ? '#' : `/admin/orders${listQueryString({ ...filters, page: page + 1 })}`
            }
            className={`inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-2 text-[13px] font-medium text-zinc-800 ${
              page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-zinc-50'
            }`}
            aria-disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </nav>
      ) : null}
    </div>
  )
}
