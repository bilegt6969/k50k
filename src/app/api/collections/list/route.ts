import { NextResponse } from 'next/server'

import { client, getAllProductCollectionsQuery } from '../../../../../lib/sanity'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await client.fetch(getAllProductCollectionsQuery)
    return NextResponse.json({ collections: rows })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to list collections'
    return NextResponse.json({ collections: [], error: message }, { status: 500 })
  }
}
