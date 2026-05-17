import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { collections } = body

    if (!collections || !Array.isArray(collections)) {
      return NextResponse.json(
        { success: false, error: 'Invalid collections data' },
        { status: 400 }
      )
    }

    const writeClient = getSanityWriteClient()

    // Create a transaction to update all collections at once
    const transaction = collections.reduce((tx, collection) => {
      return tx.patch(collection._id, { set: { order: collection.order } })
    }, writeClient.transaction())

    await transaction.commit()

    return NextResponse.json({ 
      success: true, 
      message: `Reordered ${collections.length} collections`,
      data: { updatedCount: collections.length }
    })
  } catch (error) {
    console.error('Error reordering collections:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to reorder collections' },
      { status: 500 }
    )
  }
}
