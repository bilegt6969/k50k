import { fetchUsedEbayItems } from '../../lib/ebayApi.server';
import { client } from '../../lib/client';
import Link from 'next/link';
import Image from 'next/image';

interface EbayItem {
  itemId: string;
  title: string;
  itemWebUrl: string;
  image?: { imageUrl?: string };
}

interface TrendingSectionProps {
  title: string;
  subTitle: string;
  items: EbayItem[];
  viewMoreKeyword: string;
}

interface SanityTrendingSection {
  _id: string;
  title: string;
  subTitle: string;
  searchKeyword: string;
  viewMoreKeyword: string;
  order?: number;
}

function TrendingSection({
  title,
  subTitle,
  items,
  viewMoreKeyword,
}: TrendingSectionProps) {
  const displayItems = [...items];
  
  // DEBUG: Log if items are missing for a specific section
  if (items.length === 0) {
    console.warn(`[TrendingSection] No items found for section: ${title}`);
  }

  while (displayItems.length < 4) {
    displayItems.push({
      itemId: `placeholder-${displayItems.length}`,
      title: 'Placeholder',
      itemWebUrl: '#',
    });
  }

  const viewMoreLink = `/dog?q=${encodeURIComponent(viewMoreKeyword)}`;

  return (
    <div className="flex-1 min-w-0 w-full">
      <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider font-normal m-0 mb-1">
        {subTitle}
      </p>
      <h2 className="text-lg sm:text-xl font-bold text-black m-0 mb-3 sm:mb-4">{title}</h2>

      <div className="grid grid-cols-2 gap-[2px]">
        {displayItems.slice(0, 4).map((item, idx) => {
          const isViewMore = idx === 3;
          
          // Logic to process image URL
          let rawImg = item.image?.imageUrl;
          const img = rawImg
            ? rawImg.replace('s-l140', 's-l500').replace('s-l225', 's-l500')
            : 'https://placehold.co/300x300?text=N/A';
            
          const href = isViewMore ? viewMoreLink : item.itemWebUrl;
          const Wrapper = isViewMore ? Link : 'a';

          // DEBUG: Check if we are incorrectly identifying the ebay domain
          // Note: eBay images are often 'i.ebayimg.com', not 'ebay.com'
          const isEbayImage = img.includes('ebay'); 

          return (
            <div
              key={item.itemId}
              className="relative w-full pt-[100%] bg-gray-100 overflow-hidden"
            >
              <Wrapper
                href={href}
                target={isViewMore ? '_self' : '_blank'}
                rel={isViewMore ? '' : 'noopener noreferrer'}
                className="absolute inset-0 block"
              >
                <Image
                  src={img}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  // Force unoptimized if it detects ebay to bypass Next.js image server limits
                  unoptimized={isEbayImage} 
                />
                {isViewMore && (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-white font-bold text-xs sm:text-sm bg-black/30 z-10">
                    + VIEW MORE
                  </div>
                )}
              </Wrapper>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- SERVER COMPONENT ---- */
export default async function TrendingDisplay() {
  console.log("--- [TrendingDisplay] Starting Render ---");

  try {
    const sections: SanityTrendingSection[] = await client.fetch(
      `*[_type == "trendingSection"] | order(order asc)`
    );

    console.log(`--- [TrendingDisplay] Sanity Sections Found: ${sections?.length || 0}`);

    if (!sections?.length) {
      console.error("--- [TrendingDisplay] Error: No sections returned from Sanity.");
      return null;
    }

    const itemsPromises = sections.map(async (s) => {
      console.log(`--- [TrendingDisplay] Fetching eBay for keyword: "${s.searchKeyword}"`);
      try {
        const results = await fetchUsedEbayItems(s.searchKeyword, 4);
        console.log(`--- [TrendingDisplay] Results for "${s.searchKeyword}": ${results?.length || 0} items`);
        
        // Log the first image URL to see if it's broken
        if (results && results.length > 0) {
           console.log(`--- [TrendingDisplay] Sample Image URL: ${results[0].image?.imageUrl}`);
        }
        
        return results;
      } catch (err) {
        console.error(`--- [TrendingDisplay] Error fetching eBay for "${s.searchKeyword}":`, err);
        return [];
      }
    });

    const allItems = await Promise.all(itemsPromises);

    return (
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full max-w-full bg-white px-4 py-6 sm:py-8">
        {sections.map((s, i) => (
          <TrendingSection
            key={s._id}
            title={s.title}
            subTitle={s.subTitle}
            items={allItems[i] || []}
            viewMoreKeyword={s.viewMoreKeyword}
          />
        ))}
      </div>
    );
  } catch (error) {
    console.error("--- [TrendingDisplay] Critical Error in Main Component:", error);
    return <div>Error loading trending sections. Check logs.</div>;
  }
}