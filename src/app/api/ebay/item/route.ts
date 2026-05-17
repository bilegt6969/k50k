// app/api/ebay/item/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
        return NextResponse.json({ error: 'itemId required' }, { status: 400 });
    }

    // Use SANDBOX for testing - it has different rate limits and config
    const appId = process.env.EBAY_SANDBOX_CLIENT_ID;
    
    if (!appId) {
        return NextResponse.json({ error: 'EBAY_SANDBOX_CLIENT_ID not set' }, { status: 500 });
    }

    try {
        // SANDBOX Shopping API endpoint
        const url = 'https://open.api.sandbox.ebay.com/shopping?' + new URLSearchParams({
            callname: 'GetSingleItem',
            responseencoding: 'JSON',
            appid: appId,
            siteid: '0',
            version: '967',
            ItemID: itemId,
        }).toString();

        const response = await fetch(url);
        const data = await response.json();

        if (data.Ack !== 'Success') {
            return NextResponse.json({ 
                error: data.Errors?.[0]?.LongMessage || 'Failed',
                fullError: data.Errors 
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, item: data.Item });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

//dfdf