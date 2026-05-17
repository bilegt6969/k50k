import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import CollectionsListClient from './CollectionsListClient'

type Row = {
  _id: string
  name: string
  slug: string
  mode: string
  enabled: boolean
  order: number
}

export default async function AdminCollectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/admin/login?callbackUrl=/admin/collections')

  let rows: Row[] = []
  try {
    rows = await client.fetch(
      `*[_type == "productCollection"] | order(order asc) {
        _id,
        name,
        "slug": slug.current,
        mode,
        enabled,
        order
      }`
    )
  } catch {
    rows = []
  }

  return <CollectionsListClient initialRows={rows} />
}
