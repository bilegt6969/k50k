import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

type CollectionOrderDoc = {
  _id: string
  name?: string
  order?: number
}

type CollectionOrderUpdate = {
  _id: string
  order: number
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const writeClient = getSanityWriteClient()

    // Fetch all collections
    const collections = await writeClient.fetch<CollectionOrderDoc[]>(
      `*[_type == "productCollection"] | order(order asc) {
        _id,
        name,
        order
      }`
    )

    if (!collections || collections.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No collections to fix' 
      })
    }

    // Separate collections with valid orders and those without
    const withValidOrder = collections.filter(
      (c: CollectionOrderDoc): c is CollectionOrderDoc & { order: number } =>
        typeof c.order === 'number' && c.order > 0
    )
    const withoutOrder = collections.filter(
      (c: CollectionOrderDoc) => typeof c.order !== 'number' || c.order <= 0
    )

    // Find duplicates in valid orders
    const orderMap = new Map<number, typeof withValidOrder[0]>()
    const duplicates: typeof withValidOrder[0][] = []

    withValidOrder.forEach(collection => {
      if (orderMap.has(collection.order)) {
        duplicates.push(collection)
      } else {
        orderMap.set(collection.order, collection)
      }
    })

    // Get the highest current order
    const highestOrder = Math.max(...withValidOrder.map(c => c.order), 0)

    // Create updates for all collections
    const updates: CollectionOrderUpdate[] = []

    // Fix duplicates by assigning new orders
    duplicates.forEach((collection, index) => {
      const newOrder = highestOrder + index + 1
      updates.push({
        _id: collection._id,
        order: newOrder
      })
    })

    // Assign orders to collections without orders
    withoutOrder.forEach((collection, index) => {
      const newOrder = highestOrder + duplicates.length + index + 1
      updates.push({
        _id: collection._id,
        order: newOrder
      })
    })

    // If we have updates, apply them
    if (updates.length > 0) {
      const transaction = updates.reduce((tx, update) => {
        return tx.patch(update._id, { set: { order: update.order } })
      }, writeClient.transaction())

      await transaction.commit()
    }

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${updates.length} collection orders`,
      data: { 
        fixedCount: updates.length,
        duplicateCount: duplicates.length,
        missingOrderCount: withoutOrder.length
      }
    })
  } catch (error) {
    console.error('Error fixing collection orders:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fix orders' },
      { status: 500 }
    )
  }
}
