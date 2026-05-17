// components/HomePageWrapper.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';

interface HomePageWrapperProps {
  children: ReactNode;
}

export default function HomePageWrapper({ children }: HomePageWrapperProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if this is the first visit in this session
    const hasVisited = sessionStorage.getItem('hasVisitedSaintoHome');
    
    if (hasVisited) {
      // Not first visit, skip loading screen
      setShowContent(true);
    } else {
      // First visit, show loading screen
      sessionStorage.setItem('hasVisitedSaintoHome', 'true');
      
      // Hide loading screen after 2.5 seconds (1.5s display + 1s animation)
      const timer = setTimeout(() => {
        // Show content immediately after loading screen disappears
        setTimeout(() => setShowContent(true), 100);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={`
      transition-all duration-1000 ease-out
      ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {children}
    </div>
  );
}