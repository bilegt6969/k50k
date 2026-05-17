// src/lib/ebayApi.server.ts
import EbayAuthToken from 'ebay-oauth-nodejs-client';

const ebayAuth = new EbayAuthToken({
  clientId: process.env.EBAY_PRODUCTION_CLIENT_ID!,
  clientSecret: process.env.EBAY_PRODUCTION_CLIENT_SECRET!,
});

export interface EbayItem {
  itemId: string;
  title: string;
  itemWebUrl: string;
  image?: { imageUrl?: string };
}

// Add this interface for the API response
interface EbayItemSummary {
  itemId: string;
  title: string;
  itemWebUrl: string;
  image?: { imageUrl?: string };
}

interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[];
}

export async function fetchUsedEbayItems(
  keyword: string,
  limit = 4
): Promise<EbayItem[]> {
  try {
    const token = await ebayAuth.getApplicationToken('PRODUCTION');

    const url = new URL(
      'https://api.ebay.com/buy/browse/v1/item_summary/search'
    );
    url.searchParams.append('q', keyword);
    url.searchParams.append('limit', String(limit));
    url.searchParams.append('filter', 'conditions:{USED}');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`eBay ${res.status}`);

    const data = await res.json() as EbaySearchResponse;

    return (
      data.itemSummaries?.map((i) => ({
        itemId: i.itemId,
        title: i.title,
        itemWebUrl: i.itemWebUrl,
        image: i.image,
      })) ?? []
    );
  } catch (err) {
    console.error('eBay fetch error:', err);
    return [];
  }
}