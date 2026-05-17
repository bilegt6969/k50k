import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { groq } from 'next-sanity'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'
import type { AdminOrderStatus } from '@/lib/admin-orders-filters'

const ALLOWED: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  PendingPayment: ['Cancelled'],
  Paid: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
}

export async function POST(
  req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { orderStatus?: string }
    const nextStatus = body.orderStatus as AdminOrderStatus | undefined
    const validTargets: AdminOrderStatus[] = ['Cancelled', 'Processing', 'Shipped', 'Delivered']
    if (!nextStatus || !validTargets.includes(nextStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
    }

    const { orderNumber: raw } = await context.params
    const orderNumber = decodeURIComponent(raw)
    const docId = `order-${orderNumber}`

    const write = getSanityWriteClient()
    const current = await write.fetch<{ orderStatus: AdminOrderStatus } | null>(
      groq`*[_id == $id][0]{ orderStatus }`,
      { id: docId }
    )

    if (!current) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const from = current.orderStatus
    const allowedNext = ALLOWED[from] ?? []
    if (!allowedNext.includes(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot move from ${from} to ${nextStatus}.`,
        },
        { status: 400 }
      )
    }

    await write.patch(docId).set({ orderStatus: nextStatus }).commit()

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${encodeURIComponent(orderNumber)}`)
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ success: true, orderStatus: nextStatus })
  } catch (e) {
    console.error('order status:', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
