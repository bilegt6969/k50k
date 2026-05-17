import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { _id } = body

    if (!_id || typeof _id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing _id' },
        { status: 400 }
      )
    }

    const writeClient = getSanityWriteClient()

    const existing = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "productCollection" && _id == $_id][0]{ _id }`,
      { _id }
    )

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      )
    }

    await writeClient.delete(_id)

    return NextResponse.json({ success: true, data: { _id } })
  } catch (error) {
    console.error('Error deleting collection:', error)

    let errorMessage = 'Failed to delete collection'
    if (error instanceof Error) {
      if (error.message.includes('SANITY_WRITE_TOKEN is not set')) {
        errorMessage =
          'Server configuration error: Sanity write token not configured. Please contact administrator.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
