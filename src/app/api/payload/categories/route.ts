// app/api/category-urls/route.js
// This is your Next.js API endpoint to fetch product category URLs.

import { NextResponse } from 'next/server';
import { getCategoryUrlsByKey } from '../../../../../lib/api'; // Adjust path as per your project structure

/**
 * Handles GET requests to fetch all product category URLs.
 * This endpoint no longer requires any query parameters.
 *
 * @param {Request} request The incoming Next.js request object.
 * @returns {NextResponse} A JSON response containing all category URLs or an error message.
 */
export async function GET() {
  // No need to extract 'key' from searchParams anymore as it's not used.
  // const { searchParams } = new URL(request.url);
  // const key = searchParams.get('key');

  // No 'key' validation needed as the endpoint now fetches all categories.
  // if (!key) {
  //   return NextResponse.json(
  //     { error: 'Missing key parameter. Please provide a category name.' },
  //     { status: 400 }
  //   );
  // }

  try {
    // Call the Sanity API function to fetch all data.
    // No arguments are passed to getCategoryUrlsByKey as it now fetches all documents.
    const data = await getCategoryUrlsByKey();

    // If no data is found (e.g., empty array or null if Sanity returns nothing),
    // return a 404 response indicating no categories are available.
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'No product category URLs found in Sanity.' },
        { status: 404 }
      );
    }

    // Return the fetched data as a JSON response
    return NextResponse.json(
      data,
      { status: 200 }
    );
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error fetching all category URLs in API endpoint:', error);
    // Return a 500 Internal Server Error response
    return NextResponse.json(
      { error: 'Failed to fetch category URLs due to an internal server error.' },
      { status: 500 }
    );
  }
}
