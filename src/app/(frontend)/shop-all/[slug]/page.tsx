import { notFound } from 'next/navigation'

import { client } from '@/lib/sanity'
import ProductView from '@/app/(frontend)/product/[id]/ProductView'
import type { PriceData, Product } from '@/types/product'

export const dynamic = 'force-dynamic'

type SanityProduct = {
  _id: string
  title: string
  brand: string
  category?: string
  currency: string
  imageUrl?: string | null
  imageUrls?: string[]
  slug?: { current?: string }
  sizes?: Array<{ sizeUS: string; sizeEU: string; priceCents: number; stock: number }>
  published?: boolean
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await client.fetch<SanityProduct | null>(
    `*[_type == "product" && slug.current == $slug][0]{
      _id,
      title,
      brand,
      category,
      currency,
      imageUrl,
      slug,
      published,
      imageUrls,
      sizes[]{sizeUS, sizeEU, priceCents, stock}
    }`,
    { slug }
  )

  if (!product || !product.published) return notFound()

  const mainImage =
    (Array.isArray(product.imageUrls) && product.imageUrls.length ? product.imageUrls[0] : null) ||
    product.imageUrl ||
    'https://placehold.co/800x800?text=No+Image'

  const mappedProduct: Product = {
    id: product._id,
    name: product.title,
    productCategory: 'Sanity',
    productType: product.category || 'Shop',
    color: 'N/A',
    brandName: product.brand,
    details: product.slug?.current || slug,
    gender: [],
    midsole: '',
    mainPictureUrl: mainImage,
    releaseDate: '',
    slug: product.slug?.current || slug,
    upperMaterial: '',
    singleGender: '',
    story: '',
    productTemplateExternalPictures:
      (product.imageUrls || []).map((u) => ({ mainPictureUrl: u })) || [],
    localizedSpecialDisplayPriceCents: { amountUsdCents: null },
  }

  const priceData: PriceData[] = (product.sizes || []).map((s) => ({
    sizeOption: { presentation: `US ${s.sizeUS} / EU ${s.sizeEU}` },
    lastSoldPriceCents: { amount: s.priceCents },
    stockStatus: s.stock > 0 ? 'in_stock' : 'out_of_stock',
    shoeCondition: 'new_no_defects',
    boxCondition: 'good_condition',
  }))

  return (
    <ProductView
      product={mappedProduct}
      priceData={priceData}
      recommendedProducts={[]}
      salesData={null}
      dailySalesData={null}
      ebayData={null}
    />
  )
}

