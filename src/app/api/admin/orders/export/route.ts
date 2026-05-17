import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminSanityReadClient } from '@/lib/admin-sanity-read'
import {
  buildOrderListExportQuery,
  orderListGroqBindings,
  parseOrderListSearchParams,
  type OrderListSearchInput,
} from '@/lib/admin-orders-filters'

function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const input: OrderListSearchInput = {
    q: url.searchParams.get('q') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    queue: url.searchParams.get('queue') ?? undefined,
  }
  const filters = parseOrderListSearchParams({ ...input, page: '1' })
  const bindings = orderListGroqBindings(filters)
  const client = getAdminSanityReadClient()

  type Row = {
    orderNumber: string
    customerName: string
    email: string
    orderStatus: string
    totalAmount: number
    createdAt: string | null
    itemCount: number
  }

  const rows = await client.fetch<Row[]>(
    buildOrderListExportQuery(),
    bindings,
    { cache: 'no-store', next: { revalidate: 0 } }
  )

  const header = ['orderNumber', 'customerName', 'email', 'orderStatus', 'totalAmount', 'itemCount', 'createdAt']
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        csvEscape(r.orderNumber),
        csvEscape(r.customerName),
        csvEscape(r.email),
        csvEscape(r.orderStatus),
        csvEscape(r.totalAmount),
        csvEscape(r.itemCount),
        csvEscape(r.createdAt ?? ''),
      ].join(',')
    ),
  ]
  const csv = lines.join('\r\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
