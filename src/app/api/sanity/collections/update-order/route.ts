import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { _id, order } = body

    if (!_id || typeof order !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing _id or order' },
        { status: 400 }
      )
    }

    if (order < 1) {
      return NextResponse.json(
        { success: false, error: 'Order must be a positive number' },
        { status: 400 }
      )
    }

    // Get the write client with authentication
    const writeClient = getSanityWriteClient()

    // Check if the order number is already in use by another collection
    const existingWithOrder = await writeClient.fetch(
      `*[_type == "productCollection" && order == $order && _id != $_id][0]`,
      { order, _id }
    )

    if (existingWithOrder) {
      return NextResponse.json(
        { success: false, error: `Order ${order} is already in use by another collection` },
        { status: 409 }
      )
    }

    // Update the order
    await writeClient
      .patch(_id)
      .set({ order })
      .commit()

    return NextResponse.json({ 
      success: true, 
      data: { _id, order } 
    })
  } catch (error) {
    console.error('Error updating collection order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update order' },
      { status: 500 }
    )
  }
}
