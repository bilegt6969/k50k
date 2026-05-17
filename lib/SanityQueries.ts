// // lib/sanity/queries.ts
// import { client } from '../../sanity/schemas';

// export interface TrendingSection {
//   title: string;
//   subTitle: string;
//   searchKeyword: string;
//   viewMoreKeyword: string;
//   order: number;
// }

// export async function getTrendingSections(): Promise<TrendingSection[]> {
//   try {
//     const query = `*[_type == "trendingSection"] | order(order asc) {
//       title,
//       subTitle,
//       searchKeyword,
//       viewMoreKeyword,
//       order
//     }`;

//     const sections = await client.fetch<TrendingSection[]>(query);
//     return sections || [];
//   } catch (error) {
//     console.error('Error fetching trending sections from Sanity:', error);
//     return [];
//   }
// }




 
function SanityQueries() {
  return (
null
  )
}

export default SanityQueries
