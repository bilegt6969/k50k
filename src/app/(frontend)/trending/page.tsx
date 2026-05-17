import { Suspense } from 'react';
import { Metadata } from 'next';
import TrendingDisplay from '@/components/TrendingDisplay';

export const metadata: Metadata = {
  title: 'Trending Collections',
  description: 'Explore our curated trending sections from eBay.',
};

export default function TrendingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl">
        {/* We wrap the component in Suspense. 
          Since TrendingDisplay fetches data from Sanity AND eBay, 
          this allows the page shell to load immediately while the data streams in.
        */}
        <Suspense fallback={<TrendingSkeleton />}>
          <TrendingDisplay />
        </Suspense>
      </div>
    </main>
  );
}

// A simple loading skeleton to match the layout of your component
function TrendingSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 w-full px-4 py-6 sm:py-8 animate-pulse">
      {/* Simulating 3 columns/sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 w-full">
          <div className="h-3 w-20 bg-gray-200 mb-1 rounded" />
          <div className="h-6 w-32 bg-gray-200 mb-4 rounded" />
          <div className="grid grid-cols-2 gap-[2px]">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="pt-[100%] bg-gray-200 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}