// /api/home-data/route.js

import { client as sanityClient } from '../../../../lib/sanity';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sectionIndex = searchParams.get('section');
        const collectionUrl = searchParams.get('collection.url'); // New parameter for dynamic URL
        
        // Fetch all essential metadata in parallel
        const [collectionsRes, sanityDocsRes, currencyRes] = await Promise.all([
            fetch(`${process.env.INTERNAL_API_URL || 'http://localhost:3000'}/api/payload/collections?sort=order`)
                .then(res => res.ok ? res.json() : Promise.reject(`Collections fetch failed: ${res.status}`)),
            sanityClient.fetch(`*[_type == "productCategoryUrls"] | order(order asc) {
                docCategory, 
                order, 
                el1{url, label}, 
                el2{url, label}, 
                el3{url, label}, 
                el4{url, label}
            }`),
            fetch('https://hexarate.paikama.co/api/rates/latest/USD?target=MNT')
                .then(res => res.ok ? res.json() : Promise.reject(`Currency fetch failed: ${res.status}`))
        ]);

        // Process collections
        const collectionsArray = Array.isArray(collectionsRes) ? collectionsRes : (collectionsRes?.docs || []);
        const sortedCollections = collectionsArray
            .map((c) => ({ url: c.url?.trim(), name: c.name?.trim(), order: c.order }))
            .filter((c) => !!c.url && !!c.name && typeof c.order === 'number')
            .sort((a, b) => a.order - b.order);

        const mntRate = currencyRes.data?.mid;
        if (!mntRate) throw new Error('MNT currency rate not available.');

        // If requesting specific section data
        if (sectionIndex !== null) {
            const index = parseInt(sectionIndex);
            
            // Determine which URL to use - either from collection.url parameter or from collections
            let targetUrl;
            let collectionName;
            
            if (collectionUrl) {
                // Use the provided collection.url parameter
                targetUrl = collectionUrl;
                collectionName = `Dynamic Collection ${index}`;
                console.log(`Using dynamic collection URL for section ${index}:`, targetUrl);
            } else {
                // Use the original collection from the database
                const collection = sortedCollections[index];
                if (!collection) {
                    return Response.json({ error: 'Collection not found' }, { status: 404 });
                }
                targetUrl = collection.url;
                collectionName = collection.name;
                console.log(`Using database collection URL for section ${index}:`, targetUrl);
            }

            // Validate the target URL
            try {
                new URL(targetUrl);
            } catch (urlError) {
                return Response.json(
                    { error: 'Invalid URL format', details: urlError.message },
                    { status: 400 }
                );
            }

            // Fetch products and category previews for this section
            const [productRes, categoryPreviews] = await Promise.all([
                fetch(targetUrl, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'NextJS-API/1.0'
                    },
                    cache: 'no-store'
                }).then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch from ${targetUrl}: ${res.status} ${res.statusText}`);
                    }
                    return res.json();
                }),
                fetchCategoryPreviewsForIndex(index, sanityDocsRes, collectionUrl)
            ]);

            console.log('Raw productRes:', productRes);
            console.log('categoryPreviews:', categoryPreviews);

            const categoryUrl = determineUrl(productRes);
            
            // Updated mapping for new GOAT API structure
            const items = productRes?.data?.productsList?.flatMap((product) => 
                product.variantsList?.map((variant) => ({
                    data: {
                        // Map the new structure to your expected format
                        image_url: variant.pictureUrl,
                        title: variant.title,
                        slug: variant.slug,
                        brand: variant.brandName,
                        category: variant.category,
                        price: variant.localizedRetailPriceCents?.amountCents,
                        currency: variant.localizedRetailPriceCents?.currency,
                        in_stock: variant.inStock,
                        id: variant.id,
                        status: variant.status
                    },
                    value: variant.title || collectionName,
                    category: collectionName,
                    categoryUrl: categoryUrl,
                })) || []
            ) || [];

            return Response.json({
                sectionData: {
                    sectionId: `${collectionName}-${index}`,
                    items,
                    categoryPreviews,
                    sourceUrl: targetUrl, // Include the source URL in response
                    isDynamicUrl: !!collectionUrl // Flag to indicate if dynamic URL was used
                }
            });
        }

        // Return metadata for initial page load
        return Response.json({
            collections: sortedCollections,
            sanityCategoryDocs: sanityDocsRes,
            mntRate
        });

    } catch (error) {
        console.error('Home data API error:', error);
        return Response.json(
            { error: 'Failed to fetch home data', details: error.message },
            { status: 500 }
        );
    }
}

// Updated helper function for new GOAT API structure
function determineUrl(apiRes) {
    // Since GOAT API structure changed, we need to adapt this function
    // You might need to check what's available in the new structure
    if (apiRes.data?.collection?.id) return `/browse/collection_id/${apiRes.data.collection.id}`;
    if (apiRes.data?.request?.term) {
        const groupValue = apiRes.data.facets?.group_id?.values?.[0]?.value;
        return groupValue ? `/browse/group_id/${groupValue}?q=${apiRes.data.request.term}` : `/search/${apiRes.data.request.term}`;
    }
    if (apiRes.data?.facets?.group_id?.values?.[0]?.value) return `/browse/group_id/${apiRes.data.facets.group_id.values[0].value}`;
    return '#';
}

// Updated function for new GOAT API structure - now supports dynamic URLs
async function fetchCategoryPreviewsForIndex(index, sanityCategoryDocs, collectionUrl = null) {
    const sanityDoc = sanityCategoryDocs[index];
    if (!sanityDoc) return null;

    const categoryElements = [sanityDoc.el1, sanityDoc.el2, sanityDoc.el3, sanityDoc.el4].filter(Boolean);
    if (categoryElements.length === 0) return null;

    const promises = categoryElements.map(async (catEl) => {
        if (!catEl || !catEl.url || !catEl.label) return null;
        try {
            // Use dynamic URL if provided, otherwise use the original catEl.url
            const fetchUrl = collectionUrl && catEl.url.includes('collection') ? collectionUrl : catEl.url;
            
            const apiRes = await fetch(fetchUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NextJS-API/1.0'
                },
                cache: 'no-store'
            }).then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch category preview: ${res.status} ${res.statusText}`);
                }
                return res.json();
            });
            
            console.log(`API response for ${catEl.label}:`, apiRes);
            
            // Updated for new GOAT API structure
            if (!apiRes?.data?.productsList?.length) return null;
            
            const determinedNavUrl = determineUrl(apiRes);

            // Extract products from new structure
            const productsForCard = apiRes.data.productsList
                .flatMap((product) => product.variantsList || [])
                .filter((variant) => variant?.pictureUrl) // Updated field name
                .slice(0, 3)
                .map((variant) => ({
                    data: {
                        image_url: variant.pictureUrl,
                        title: variant.title,
                        slug: variant.slug,
                        brand: variant.brandName,
                        category: variant.category,
                        price: variant.localizedRetailPriceCents?.amountCents,
                        currency: variant.localizedRetailPriceCents?.currency,
                        in_stock: variant.inStock,
                        id: variant.id
                    },
                    value: variant.title || catEl.label,
                    category: catEl.label,
                    categoryUrl: determinedNavUrl,
                }));

            if (productsForCard.length > 0) {
                return {
                    id: `${catEl.label.replace(/\s+/g, '-')}-${index}`,
                    label: catEl.label,
                    items: productsForCard,
                    sourceUrl: fetchUrl // Include source URL for debugging
                };
            }
            return null;
        } catch (e) {
            console.warn(`Error processing preview for ${catEl.label}:`, e);
            return null;
        }
    });

    const results = await Promise.all(promises);
    return results.filter((r) => r !== null);
}