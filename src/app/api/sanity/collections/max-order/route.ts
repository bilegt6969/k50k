import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the highest order number
    const result = await client.fetch(
      `*[_type == "productCollection"] | order(order desc) [0] { order }` 
    )

    const maxOrder = result?.order ?? 0

    return NextResponse.json({ 
      success: true, 
      data: { maxOrder } 
    })
  } catch (error) {
    console.error('Error fetching max order:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch max order' },
      { status: 500 }
    )
  }
}
