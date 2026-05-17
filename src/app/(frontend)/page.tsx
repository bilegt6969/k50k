
// app/(frontend)/page.tsx
import React from 'react';
import Product from './product/page';
import { client } from '@/lib/sanity';
import { heroQuery } from '@/lib/queries';
import HeroSection from '../../components/HeroSection';
import HomePageWrapper from '../../components/HomePageWrapper';
import {Inter_Tight } from 'next/font/google';


const inter = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export default async function HomePage() {
  let heroData;
  
  
  try {
    // Fetch the data from Sanity
    const fetchedData = await client.fetch(heroQuery);
    
    // THE FIX: Ensure heroData has a valid structure, even if the fetch returns nulls.
    // This creates a clean, predictable object to pass to the client component.
    heroData = {
      slides: fetchedData?.slides || [],
      carouselSettings: fetchedData?.carouselSettings || {}
    };

  } catch (error) {
    console.error('Failed to fetch hero data:', error);
    // If the entire fetch fails, provide a default structure to prevent crashes.
    heroData = {
      slides: [],
      carouselSettings: {}
    };
  }

  return (
    <HomePageWrapper>
      <main className='page-container'>
        <div className="px-3 sm:px-3 md:px-3 lg:px-1 xl:px-0">
          <HeroSection heroData={heroData} />
        </div>
        
        {/* Rest of your page content */}
        <section className={`py-12  antialiased ${inter.variable}`}>
          {/* Your product grid or other content */}
          <Product />
        </section>
      </main>
    </HomePageWrapper>
  );
}

// Using force-dynamic is good for ensuring the data is fresh on each request.
export const dynamic = 'force-dynamic';