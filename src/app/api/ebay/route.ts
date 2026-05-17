// app/api/ebay/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface EbayItem {
    itemId: string[];
    title: string[];
    galleryURL?: string[];
    viewItemURL: string[];
    sellingStatus: {
        currentPrice: {
            '@currencyId': string;
            __value__: string;
        }[];
    }[];
    condition?: {
        conditionDisplayName: string[];
    }[];
}

interface EbaySearchResult {
    item?: EbayItem[];
}

interface EbayFindItemsResponse {
    findItemsByKeywordsResponse?: {
        ack: string[];
        searchResult: EbaySearchResult[];
    }[];
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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const EBAY_APP_ID = process.env.EBAY_PRODUCTION_CLIENT_ID;

    if (!EBAY_APP_ID) {
        console.error('[eBay] EBAY_PRODUCTION_CLIENT_ID is not set in environment variables.');
        return NextResponse.json({ items: [] }, { status: 200 });
    }

    if (!query) {
        return NextResponse.json(
            { error: 'Query parameter is required.' },
            { status: 400 }
        );
    }

    console.log('Searching eBay for:', query);

    const endpoint = new URL('https://svcs.ebay.com/services/search/FindingService/v1');
    endpoint.searchParams.set('OPERATION-NAME', 'findItemsByKeywords');
    endpoint.searchParams.set('SERVICE-VERSION', '1.0.0');
    endpoint.searchParams.set('SECURITY-APPNAME', EBAY_APP_ID);
    endpoint.searchParams.set('RESPONSE-DATA-FORMAT', 'JSON');
    endpoint.searchParams.set('REST-PAYLOAD', 'true');
    endpoint.searchParams.set('keywords', query);
    endpoint.searchParams.set('paginationInput.entriesPerPage', '10');
    endpoint.searchParams.set('sortOrder', 'PricePlusShippingLowest');

    try {
        const response = await fetch(endpoint.toString(), {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[eBay] Finding API Error:', response.status, errorText);

            // ✅ Return empty gracefully — never throw, never cascade-fail the product page
            return NextResponse.json({ items: [] }, { status: 200 });
        }

        const data: EbayFindItemsResponse = await response.json();

        const items: EbayItem[] = data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];

        console.log(`[eBay] Found ${items.length} items for query: "${query}"`);

        const simplifiedItems: SimplifiedEbayItem[] = items.map(item => ({
            id: item.itemId[0],
            title: item.title[0],
            price: item.sellingStatus[0].currentPrice[0].__value__,
            currency: item.sellingStatus[0].currentPrice[0]['@currencyId'],
            condition: item.condition?.[0]?.conditionDisplayName[0] || 'Unknown',
            url: item.viewItemURL[0],
            imageUrl: item.galleryURL?.[0] || 'https://placehold.co/600x600/f5f5f5/999999?text=No+Image',
        }));

        return NextResponse.json({ items: simplifiedItems });

    } catch (error) {
        // ✅ Never let eBay errors crash the product page
        console.error('[eBay] Unexpected error in Finding API fetch:', error);
        return NextResponse.json({ items: [] }, { status: 200 });
    }
}