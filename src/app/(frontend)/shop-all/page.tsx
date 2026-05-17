import Link from 'next/link'
import Image from 'next/image'

import { client } from '@/lib/sanity'

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
}

export default async function ShopAllPage() {
  const products = await client.fetch<SanityProduct[]>(
    `*[_type == "product" && published == true] | order(publishedAt desc, updatedAt desc) {
      _id,
      title,
      brand,
      category,
      currency,
      imageUrl,
      imageUrls,
      slug,
      sizes[]{sizeUS, sizeEU, priceCents, stock}
    }`
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold">Shop all</h1>
      <p className="mt-2 text-white/70 text-sm">Products published by this shop owner.</p>

      <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => {
          const slug = p.slug?.current || p._id
          const minPrice =
            p.sizes && p.sizes.length
              ? Math.min(...p.sizes.filter((s) => s.stock > 0).map((s) => s.priceCents))
              : null

          const coverUrl =
            (Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls[0] : null) ||
            p.imageUrl ||
            null

          const formattedPrice =
            minPrice !== null ? `₮ ${Math.ceil(minPrice / 100).toLocaleString('en-US')}` : 'Unavailable'
          const rawPrice = minPrice !== null ? `₮ ${(minPrice / 100).toFixed(2)}` : ''

          return (
            <Link
              key={p._id}
              href={`/shop-all/${encodeURIComponent(slug)}`}
              className="group"
            >
              {/* Home-page style card */}
              <div className="text-black border bg-white border-neutral-200 rounded-xs shadow-xs tracking-tight relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-neutral-100/50 hover:border-neutral-300 h-full flex flex-col">
                <div
                  className="overflow-hidden bg-white relative flex-grow"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  {coverUrl ? (
                    <Image
                      className="mx-auto transition-transform bg-white duration-500 group-hover:scale-110 object-contain"
                      src={coverUrl}
                      alt={p.title}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, (max-width: 1536px) 25vw, 20vw"
                      priority={false}
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
                      No image
                    </div>
                  )}
                </div>
                <div className="w-full text-xs font-bold flex items-start p-4 border-t border-neutral-200 justify-between transition-colors duration-300 group-hover:border-neutral-300">
                  <span
                    className="pr-2 leading-tight line-clamp-2 overflow-hidden text-ellipsis"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.2',
                      maxHeight: '2.4em',
                    }}
                  >
                    {p.title}
                  </span>

                  <div className="relative py-2 px-2 rounded-full whitespace-nowrap transition-all duration-300 min-w-[90px] text-center bg-neutral-100 border border-neutral-200 group-hover:bg-neutral-200 group-hover:border-neutral-300 flex-shrink-0">
                    <span className="block group-hover:opacity-0 group-hover:-translate-y-2 transition-all duration-300">
                      {formattedPrice}
                    </span>
                    {rawPrice ? (
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        {rawPrice}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
