// app/api/goat-fetch/route.ts

export async function GET() {
    const url =
      "https://www.goat.com/web-api/consumer-search/get-product-search-results?queryString=crocs&pageNumber=1&pageLimit=12&sortType=1&salesChannelId=1&includeAggregations=true&collectionSlug=&inStock=undefined&sale=undefined&instantShip=undefined&underRetail=undefined&priceCentsMin=undefined&priceCentsMax=undefined&productFilter=%7B%22conditions%22%3A%5B%5D%2C%22sizes%22%3A%5B%5D%2C%22categories%22%3A%5B%5D%2C%22releaseYears%22%3A%5B%5D%2C%22activities%22%3A%5B%5D%2C%22brands%22%3A%5B%5D%2C%22colors%22%3A%5B%5D%2C%22genders%22%3A%5B%5D%2C%22productTypes%22%3A%5B%5D%7D&pageCount=3";
  
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        cache: "no-store", // prevent caching
      });
  
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch GOAT data" }),
          { status: res.status }
        );
      }
  
      const data = await res.json();
      return Response.json(data);
    } catch (error) {
      return new Response(JSON.stringify({ error: "Something went wrong", detail: error }), {
        status: 500,
      });
    }
  }
  