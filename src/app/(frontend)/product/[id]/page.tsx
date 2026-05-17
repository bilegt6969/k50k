// app/product/[id]/page.tsx
import { Metadata } from 'next';
import ProductView from './ProductView';
import { getKicksProduct } from '@/lib/kicks-dev';
import { client as sanityClient } from '@/lib/sanity';
import type {
  Product,
  PriceData,
  SaleItem,
  DailySaleItem,
} from '@/types/product';

interface ApiVariant {
  size: string;
  lowest_ask: number;
  available: boolean;
}

interface RawApiProductData {
  id: string | number;
  sku: string;
  name: string;
  category: string;
  product_type: string;
  colorway: string;
  brand: string;
  image_url: string;
  release_date: string;
  slug: string;
  description: string;
  images?: string[];
  gender: string[];
  midsole: string;
  upperMaterial: string;
  singleGender: string;
  variants: ApiVariant[];
}

interface SimplifiedEbayItem {
  id: string;
  title: string;
  price: string;
  currency: string;
  condition: string;
  url: string;
  imageUrl: string;
}

type SanityProduct = {
  _id: string;
  title: string;
  brand: string;
  category?: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  slug?: { current?: string };
  sizes?: Array<{ sizeUS: string; sizeEU: string; priceCents: number; stock: number }>;
  published?: boolean;
};

type PageProps = {
  params: Promise<{ id: string }>; // This is the slug (e.g., 'air-jordan-1')
  searchParams: Promise<{ id?: string; [key: string]: string | string[] | undefined }>;
};

// --- ROBUST DATA FETCHING HELPER ---

async function getProductData(slug: string, productId?: string) {
  // --- DYNAMIC HOST RESOLUTION ---
  const host = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3000}`;

  let apiProductData: RawApiProductData | null = null;
  let salesData: SaleItem[] | null = null;
  let dailySalesData: DailySaleItem[] | null = null;

  // ---------------------------------------------------------
  // STEP 0: CHECK SANITY SHOP PRODUCT FIRST
  // ---------------------------------------------------------
  try {
    const sanityProduct = await sanityClient.fetch<SanityProduct | null>(
      `*[_type == "product" && published == true && (slug.current == $slug || _id == $id)][0]{
        _id,
        title,
        brand,
        category,
        imageUrl,
        imageUrls,
        slug,
        published,
        sizes[]{sizeUS, sizeEU, priceCents, stock}
      }`,
      { slug, id: slug }
    );

    if (sanityProduct) {
      const mainImage =
        (Array.isArray(sanityProduct.imageUrls) && sanityProduct.imageUrls.length
          ? sanityProduct.imageUrls[0]
          : null) ||
        sanityProduct.imageUrl ||
        'https://placehold.co/800x800?text=No+Image';

      const mappedProduct: Product = {
        id: sanityProduct._id,
        name: sanityProduct.title,
        productCategory: 'Sanity',
        productType: sanityProduct.category || 'Shop',
        color: 'N/A',
        brandName: sanityProduct.brand,
        details: sanityProduct.slug?.current || slug,
        mainPictureUrl: mainImage,
        releaseDate: '',
        slug: sanityProduct.slug?.current || slug,
        story: '',
        productTemplateExternalPictures: (sanityProduct.imageUrls || []).map((url) => ({
          mainPictureUrl: url,
        })),
        gender: [],
        midsole: '',
        upperMaterial: '',
        singleGender: '',
        localizedSpecialDisplayPriceCents: { amountUsdCents: null },
      };

      const mappedPriceData: PriceData[] = (sanityProduct.sizes || []).map((s) => ({
        sizeOption: { presentation: `US ${s.sizeUS} / EU ${s.sizeEU}` },
        lastSoldPriceCents: { amount: s.priceCents },
        stockStatus: s.stock > 0 ? 'in_stock' : 'out_of_stock',
        shoeCondition: 'new_no_defects',
        boxCondition: 'good_condition',
      }));

      return {
        product: mappedProduct,
        priceData: mappedPriceData,
        recommendedProducts: [],
        salesData: null,
        dailySalesData: null,
      };
    }
  } catch (error) {
    console.warn('[Sanity] product lookup failed, continuing to KicksDB', error);
  }

  // ---------------------------------------------------------
  // STEP 1: ATTEMPT PRIMARY FETCH (KICKSDB) – direct server call to avoid 401 from Vercel on self-fetch
  // ---------------------------------------------------------
  try {
    const result = await getKicksProduct(productId ?? undefined, slug);

    if (result) {
      // Same shape as /api/hey: { data: { $schema, data: { ...product... }, meta }, salesData, dailySalesData }
      const productData = (result.data as { data?: RawApiProductData })?.data;

      if (productData && productData.id) {
        apiProductData = productData;
        console.log(`[KicksDB] ✅ Found: ${productData.name} (ID: ${productData.id})`);
      }

      salesData = (result.salesData as { data?: SaleItem[] })?.data ?? null;
      dailySalesData = (result.dailySalesData as { data?: DailySaleItem[] })?.data ?? null;
    }
  } catch (error) {
    console.error("[KicksDB] ❌ Fetch error:", error);
  }

  // ---------------------------------------------------------
  // STEP 2: DECISION LOGIC (SUCCESS or FALLBACK)
  // ---------------------------------------------------------

  if (apiProductData) {
    // 1. Map KicksDB Product
    const product: Product = {
      id: String(apiProductData.id || apiProductData.sku || ''),
      name: apiProductData.name || 'Unnamed Product',
      productCategory: apiProductData.category || 'N/A',
      productType: apiProductData.product_type || 'N/A',
      color: apiProductData.colorway || 'N/A',
      brandName: apiProductData.brand || 'N/A',
      details: apiProductData.sku || 'N/A',
      mainPictureUrl: apiProductData.image_url || 'https://placehold.co/600x600/f5f5f5/999999?text=No+Image',
      releaseDate: apiProductData.release_date || '',
      slug: apiProductData.slug || slug,
      story: apiProductData.description || '',
      productTemplateExternalPictures:
        apiProductData.images?.map((url: string) => ({ mainPictureUrl: url })) || [],
      gender: apiProductData.gender || [],
      midsole: apiProductData.midsole || '',
      upperMaterial: apiProductData.upperMaterial || '',
      singleGender: apiProductData.singleGender || '',
      localizedSpecialDisplayPriceCents: { amountUsdCents: null },
    };

    // 2. Map Variants to PriceData
    const primaryPriceData: PriceData[] = (apiProductData.variants || [])
      .filter((v: ApiVariant) => v.available && v.lowest_ask > 0)
      .map((v: ApiVariant) => ({
        sizeOption: { presentation: v.size },
        lastSoldPriceCents: { amount: v.lowest_ask * 100 },
        stockStatus: 'multiple_in_stock',
        shoeCondition: 'new_no_defects',
        boxCondition: 'good_condition',
      }));

    // 3. Fetch eBay Comparison Items
    let ebayPriceData: PriceData[] = [];
    try {
      const ebayRes = await fetch(
        `${host}/api/ebay?query=${encodeURIComponent(product.name)}`,
        { next: { revalidate: 3600 } }
      );
      if (ebayRes.ok) {
        const ebayResult = await ebayRes.json();
        const items: SimplifiedEbayItem[] = ebayResult.items || [];
        ebayPriceData = items.map((item) => ({
          sizeOption: { presentation: `eBay (${item.condition}) - $${item.price}` },
          lastSoldPriceCents: { amount: Math.round(parseFloat(item.price) * 100) },
          stockStatus: 'in_stock',
          shoeCondition: item.condition.toLowerCase().includes('new')
            ? 'new_no_defects'
            : 'pre_owned',
          boxCondition: 'unknown',
        }));
      }
    } catch (e) {
      console.warn("eBay comparison failed", e);
    }

    return {
      product,
      priceData: [...primaryPriceData, ...ebayPriceData],
      recommendedProducts: [],
      salesData,
      dailySalesData,
    };
  }

  // ---------------------------------------------------------
  // STEP 3: FALLBACK TO EBAY SEARCH (If KicksDB returns nothing)
  // ---------------------------------------------------------
  console.log("Primary API failed. Falling back to eBay search...");
  try {
    const searchQuery = decodeURIComponent(slug).replace(/-/g, ' ');
    const ebayRes = await fetch(`${host}/api/ebay?query=${encodeURIComponent(searchQuery)}`);

    if (ebayRes.ok) {
      const ebayResult = await ebayRes.json();
      const items: SimplifiedEbayItem[] = ebayResult.items || [];

      if (items.length > 0) {
        const mainItem = items[0];
        const product: Product = {
          id: mainItem.id,
          name: mainItem.title,
          productCategory: 'eBay',
          productType: mainItem.condition,
          color: 'N/A',
          brandName: 'eBay Listing',
          details: `eBay ID: ${mainItem.id}`,
          mainPictureUrl: mainItem.imageUrl || 'https://placehold.co/600x600/f5f5f5/999999?text=No+Image',
          releaseDate: '',
          slug: slug,
          story: `This is an eBay listing for "${mainItem.title}".`,
          productTemplateExternalPictures: [{ mainPictureUrl: mainItem.imageUrl }],
          gender: [],
          midsole: 'N/A',
          upperMaterial: 'N/A',
          singleGender: 'N/A',
          localizedSpecialDisplayPriceCents: {
            amountUsdCents: Math.round(parseFloat(mainItem.price) * 100),
          },
        };

        const priceData: PriceData[] = items.map((item) => ({
          sizeOption: { presentation: `eBay (${item.condition}) - $${item.price}` },
          lastSoldPriceCents: { amount: Math.round(parseFloat(item.price) * 100) },
          stockStatus: 'in_stock',
          shoeCondition: 'pre_owned',
          boxCondition: 'unknown',
        }));

        return { product, priceData, recommendedProducts: [], salesData: null, dailySalesData: null };
      }
    }
  } catch (error) {
    console.error("Critical error in eBay fallback:", error);
  }

  return null;
}

// --- METADATA (Server Side) ---

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const { id: productId } = await searchParams;
  const data = await getProductData(slug, productId);

  if (!data?.product.name) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${data.product.name} | ${data.product.brandName}`,
    description: data.product.story,
  };
}

// --- PAGE COMPONENT (Server Side) ---

export default async function Page({ params, searchParams }: PageProps) {
  const { id: slug } = await params;
  const { id: productId } = await searchParams;

  const data = await getProductData(slug, productId);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-neutral-500">
        <div className="text-center p-10 bg-gray-100 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p>Sorry, we couldn&apos;t find the product you were looking for.</p>
        </div>
      </div>
    );
  }

  return (
    <ProductView
      product={data.product}
      priceData={data.priceData}
      recommendedProducts={data.recommendedProducts}
      salesData={data.salesData}
      dailySalesData={data.dailySalesData}
    />
  );
}