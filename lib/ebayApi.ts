import EbayAuthToken from 'ebay-oauth-nodejs-client';

// Define the shape of an item summary for type safety
interface EbayItemSummary {
  itemId: string;
  title: string;
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  price?: {
    value: string;
    currency: string;
  };
  condition?: string;
}

/**
 * Fetches a list of used items from the eBay Browse API.
 * @param searchTerm The keyword to search for (e.g., "Moncler", "Arcteryx").
 * @param limit The number of items to return.
 * @returns An array of eBay item summaries.
 */
export async function fetchUsedEbayItems(
  searchTerm: string, 
  limit: number = 4
): Promise<EbayItemSummary[]> {
  
  // Check environment variables first
  const clientId = process.env.EBAY_PRODUCTION_CLIENT_ID;
  const clientSecret = process.env.EBAY_PRODUCTION_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('eBay credentials not configured');
    return [];
  }

  let accessToken;
  try {
    const ebayAuthToken = new EbayAuthToken({
      clientId: clientId,
      clientSecret: clientSecret,
      env: 'PRODUCTION' 
    });
    const tokenData = JSON.parse(await ebayAuthToken.getApplicationToken('PRODUCTION'));
    accessToken = tokenData.access_token;
    if (!accessToken) throw new Error('No access token received from eBay');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('eBay Authentication failed:', errorMessage);
    return []; // Return empty array on auth failure
  }

  if (accessToken) {
    try {
      // Hardcode the filter for USED items, as requested
      const filters: string[] = ['conditions:{USED}'];
      const filterQuery = `&filter=${encodeURIComponent(filters.join(','))}`;
      
      const ebaySearchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}${filterQuery}`;

      console.log(`Fetching eBay items: ${searchTerm}`);

      const response = await fetch(ebaySearchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        },
        // Use a short revalidation time for trending items
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`eBay API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.itemSummaries || [];
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`eBay Search failed for "${searchTerm}":`, errorMessage);
      return []; // Return empty array on search failure
    }
  }

  return []; // Default return
}