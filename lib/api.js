// lib/api.js
// This file contains functions to interact with your Sanity.io backend.

import { client as sanityClient } from './sanity'; // Adjust path if your sanity client is located elsewhere

/**
 * Fetches all productCategoryUrls documents from Sanity.
 *
 * @returns {Promise<Array<object>>} An array of all fetched category URL documents.
 */
export async function getCategoryUrlsByKey() { // Removed 'key' parameter
  // Sanity GROQ query to fetch all documents of type 'productCategoryUrls'.
  // We are selecting all the relevant fields including the multiple URLs for each element.
  const query = `*[_type == "productCategoryUrls"]{ // Modified query to fetch all documents
    category,
    order,
    el1{
      url1,
      url2,
      url3,
      label
    },
    el2{
      url1,
      url2,
      url3,
      label
    },
    el3{
      url1,
      url2,
      url3,
      label
    },
    el4{
      url1,
      url2,
      url3,
      label
    }
  }`;

  // Execute the query using the Sanity client. No key parameter is needed now.
  const data = await sanityClient.fetch(query);
  return data;
}
