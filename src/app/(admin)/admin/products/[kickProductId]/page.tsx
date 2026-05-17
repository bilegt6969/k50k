import PublishProductClient from './PublishProductClient'

export default async function AdminPublishProductPage({
  params,
}: {
  params: Promise<{ kickProductId: string }>
}) {
  const { kickProductId } = await params
  return <PublishProductClient kickProductId={kickProductId} />
}

