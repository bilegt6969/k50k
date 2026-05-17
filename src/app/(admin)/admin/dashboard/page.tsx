import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { createClient, groq } from 'next-sanity'
import {
  ArrowUpRight,
  CircleDollarSign,
  Clock4,
  ExternalLink,
  LayoutGrid,
  PackageCheck,
  Truck,
} from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderStatus =
  | 'PendingPayment'
  | 'Paid'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | string

type DashboardStats = {
  todayOrders: number
  yesterdayOrders: number
  todayRevenue: number
  pendingFulfillment: number
  shippedToday: number
}

type RecentOrder = {
  id: string
  customer: string
  status: OrderStatus
  amount: number
  items: number
  createdAt: string
}

type TodayOrderTime = { createdAt: string }

const readClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  perspective: 'published',
})

const statusLabel: Record<string, string> = {
  PendingPayment: 'Pending Payment',
  Paid: 'Paid',
  Processing: 'Processing',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
}

function getDayRangeIso(daysOffset: number) {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + daysOffset)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

function buildTodayTrend(todayOrderTimes: TodayOrderTime[]) {
  const labels = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24']
  const buckets = labels.map((label) => ({ hour: label, orders: 0 }))

  for (const order of todayOrderTimes) {
    const date = new Date(order.createdAt)
    if (Number.isNaN(date.getTime())) continue
    const hour = date.getHours()
    const bucketIndex = Math.min(Math.floor(hour / 4), buckets.length - 1)
    buckets[bucketIndex].orders += 1
  }

  return buckets
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? 'admin@k50k.mn'
  const initials = email.slice(0, 1).toUpperCase()
  const { startIso: todayStart, endIso: todayEnd } = getDayRangeIso(0)
  const { startIso: yesterdayStart, endIso: yesterdayEnd } = getDayRangeIso(-1)

  const statsQuery = groq`{
    "todayOrders": count(*[_type == "order" && dateTime(createdAt) >= dateTime($todayStart) && dateTime(createdAt) < dateTime($todayEnd)]),
    "yesterdayOrders": count(*[_type == "order" && dateTime(createdAt) >= dateTime($yesterdayStart) && dateTime(createdAt) < dateTime($yesterdayEnd)]),
    "todayRevenue": coalesce(math::sum(*[_type == "order" && dateTime(createdAt) >= dateTime($todayStart) && dateTime(createdAt) < dateTime($todayEnd)].totalAmount), 0),
    "pendingFulfillment": count(*[_type == "order" && orderStatus in ["PendingPayment", "Paid", "Processing"]]),
    "shippedToday": count(*[_type == "order" && orderStatus == "Shipped" && dateTime(createdAt) >= dateTime($todayStart) && dateTime(createdAt) < dateTime($todayEnd)])
  }`

  const recentOrdersQuery = groq`*[_type == "order"] | order(dateTime(createdAt) desc)[0...8]{
    "id": orderNumber,
    "customer": customerName,
    "status": orderStatus,
    "amount": coalesce(totalAmount, 0),
    "items": count(items),
    "createdAt": createdAt
  }`

  const todayOrderTimesQuery = groq`*[_type == "order" && dateTime(createdAt) >= dateTime($todayStart) && dateTime(createdAt) < dateTime($todayEnd)]{
    createdAt
  }`

  const [stats, recentOrders, todayOrderTimes] = await Promise.all([
    readClient.fetch<DashboardStats>(statsQuery, { todayStart, todayEnd, yesterdayStart, yesterdayEnd }, { cache: 'no-store', next: { revalidate: 0 } }),
    readClient.fetch<RecentOrder[]>(recentOrdersQuery, {}, { cache: 'no-store', next: { revalidate: 0 } }),
    readClient.fetch<TodayOrderTime[]>(todayOrderTimesQuery, { todayStart, todayEnd }, { cache: 'no-store', next: { revalidate: 0 } }),
  ])

  const todayOrders = stats?.todayOrders ?? 0
  const yesterdayOrders = stats?.yesterdayOrders ?? 0
  const growthPercent = yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : todayOrders > 0 ? 100 : 0
  const trendDirection = growthPercent >= 0 ? '+' : ''
  const dailyOrders = buildTodayTrend(todayOrderTimes ?? [])
  const maxOrdersPerSlot = Math.max(1, ...dailyOrders.map((slot) => slot.orders))
  const averageOrderValue = todayOrders > 0 ? Math.round((stats?.todayRevenue ?? 0) / todayOrders) : 0

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
  const studioBase =
    (process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? '').replace(/\/$/, '') ||
    (projectId ? `https://${projectId}.sanity.studio` : '')

  return (
    <div className="mx-auto w-full max-w-[1300px] space-y-4">
      <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Dashboard</CardTitle>
            <CardDescription className="text-zinc-500">
              General overview of orders, revenue and fulfillment.
            </CardDescription>
          </div>
          <div className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700">
            {initials} · {email}
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Today's orders</CardDescription>
            <CardTitle className="text-3xl">{todayOrders.toLocaleString('en-US')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trendDirection}
              {growthPercent.toFixed(1)}% vs yesterday
            </span>
            <Clock4 className="h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Today's revenue</CardDescription>
            <CardTitle className="text-3xl">{(stats?.todayRevenue ?? 0).toLocaleString('en-US')} MNT</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs text-zinc-500">
            <span>Average order: {averageOrderValue.toLocaleString('en-US')} MNT</span>
            <CircleDollarSign className="h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Pending fulfillment</CardDescription>
            <CardTitle className="text-3xl">{(stats?.pendingFulfillment ?? 0).toLocaleString('en-US')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs text-zinc-500">
            <span>Need packing today</span>
            <PackageCheck className="h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-500">Shipped today</CardDescription>
            <CardTitle className="text-3xl">{(stats?.shippedToday ?? 0).toLocaleString('en-US')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs text-zinc-500">
            <span>Orders moved to shipped today</span>
            <Truck className="h-4 w-4 text-zinc-400" />
          </CardContent>
        </Card>
      </section>

      <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutGrid className="h-4 w-4 text-zinc-500" aria-hidden />
            Shortcuts
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Jump to common admin tasks and the Sanity content studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/orders?queue=fulfillment"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Orders · needs fulfillment
          </Link>
          <Link
            href="/admin/orders?status=PendingPayment"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Orders · awaiting payment
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            All orders
          </Link>
          <Link
            href="/admin/products"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Products
          </Link>
          <Link
            href="/admin/collections"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            Collections
          </Link>
          {studioBase ? (
            <a
              href={studioBase}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            >
              Sanity Studio
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
            </a>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <CardHeader>
          <CardTitle>Order trend</CardTitle>
          <CardDescription className="text-zinc-500">Distribution by time blocks (today).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dailyOrders.map((slot) => (
            <div key={slot.hour} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">{slot.hour}</span>
                <span className="font-medium text-zinc-800">{slot.orders} orders</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-zinc-800 transition-all"
                  style={{ width: `${Math.round((slot.orders / maxOrdersPerSlot) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription className="text-zinc-500">
              Latest checkout activity for support and fulfillment.
            </CardDescription>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
          >
            View all orders
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-transparent">
                <TableHead className="text-zinc-500">Order</TableHead>
                <TableHead className="text-zinc-500">Customer</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500">Items</TableHead>
                <TableHead className="text-right text-zinc-500">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <TableRow key={order.id} className="border-zinc-200">
                  <TableCell className="font-medium text-zinc-900">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(order.id)}`}
                      className="text-blue-700 underline-offset-2 hover:underline"
                    >
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell className="text-zinc-600">{order.customer}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                      {statusLabel[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-600">{order.items}</TableCell>
                  <TableCell className="text-right text-zinc-900">{order.amount.toLocaleString('en-US')} MNT</TableCell>
                </TableRow>
              )) : (
                <TableRow className="border-zinc-200">
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-zinc-500">
                    No orders yet. New checkouts will appear here in real time.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}