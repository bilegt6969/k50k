import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { groq } from 'next-sanity'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function POST(
  _req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderNumber: raw } = await context.params
    const orderNumber = decodeURIComponent(raw)
    const docId = `order-${orderNumber}`

    const write = getSanityWriteClient()
    const current = await write.fetch<{ orderStatus: string } | null>(
      groq`*[_id == $id][0]{ orderStatus }`,
      { id: docId }
    )

    if (!current) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (current.orderStatus === 'Paid') {
      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${encodeURIComponent(orderNumber)}`)
      revalidatePath('/admin/dashboard')
      return NextResponse.json({ success: true, orderStatus: 'Paid', alreadyPaid: true })
    }

    if (current.orderStatus !== 'PendingPayment') {
      return NextResponse.json(
        {
          success: false,
          error: `Only orders awaiting payment can be marked paid (current: ${current.orderStatus}).`,
        },
        { status: 400 }
      )
    }

    await write.patch(docId).set({ orderStatus: 'Paid' }).commit()

    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${encodeURIComponent(orderNumber)}`)
    revalidatePath('/admin/dashboard')

    return NextResponse.json({ success: true, orderStatus: 'Paid' })
  } catch (e) {
    console.error('accept-payment:', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
