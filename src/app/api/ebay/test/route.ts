import { NextResponse } from 'next/server';

export async function GET() {
  const itemUrl = "https://www.ebay.com/itm/236650282932?_skw=PATAGONIA&hash=item371974bfb4:g:jC4AAeSwT6hpm2k0";
  const match = itemUrl.match(/\/itm\/(\d+)/);
  const itemId = match ? match[1] : null;

  if (!itemId) {
    return NextResponse.json({ error: "Could not parse Item ID" }, { status: 400 });
  }

  const ebayFullId = `v1|${itemId}|0`;

  try {
    const auth = Buffer.from(
      `${process.env.EBAY_PRODUCTION_CLIENT_ID}:${process.env.EBAY_PRODUCTION_CLIENT_SECRET}`
    ).toString('base64');

    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope',
      }),
    });

    const { access_token } = await tokenRes.json();

    // FIXED: Removed COMPACT to allow the other detail-heavy groups
    const fieldGroups = "PRODUCT,ADDITIONAL_SELLER_DETAILS,CHARITY_DETAILS";
    
    const ebayRes = await fetch(
      `https://api.ebay.com/buy/browse/v1/item/${ebayFullId}?fieldgroups=${fieldGroups}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      }
    );

    const fullData = await ebayRes.json();

    if (fullData.errors) {
      return NextResponse.json({ 
        message: "eBay API Error", 
        details: fullData.errors 
      }, { status: 400 });
    }

    return NextResponse.json(fullData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}