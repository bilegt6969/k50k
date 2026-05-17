// components/LayoutClientWrapper.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Heading/Navbar'; // Adjust path if needed
import Footer from '@/components/Footer';     // Adjust path if needed
import Faq from '@/components/faq';

interface LayoutClientWrapperProps {
  children: React.ReactNode;
}

export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps) {
  const pathname = usePathname();
  const [isNotFound, setIsNotFound] = useState(false);
  
  useEffect(() => {
    // Check if the current page has the not-found indicator
    const checkNotFound = () => {
      const hasNotFoundClass = document.body.classList.contains('not-found-page');
      const hasNotFoundData = document.querySelector('[data-page="not-found"]') !== null;
      setIsNotFound(hasNotFoundClass || hasNotFoundData);
    };
    
    // Check immediately and after a short delay
    checkNotFound();
    const timer = setTimeout(checkNotFound, 50);
    
    return () => clearTimeout(timer);
  }, [pathname]);
  
  // Determine if the current page is an authentication page
  const isAuthPage = pathname.includes('/auth/login') || pathname.includes('/auth/signup');
  const isAdminPage = pathname.startsWith('/admin');
  
  // Hide storefront navbar/footer on auth, admin, or 404 pages
  const shouldHideNavAndFooter = isAuthPage || isAdminPage || isNotFound;
  const shouldHideFooter = shouldHideNavAndFooter || isAdminPage;

  // FAQ only on: product view page (/product/[id]), checkout/payment, shipping & returns
  const isProductViewPage = pathname.startsWith('/product/') && pathname !== '/product';
  const isPaymentPage = pathname.includes('/payment');
  const isShippingOrReturnsPage = pathname.includes('/shipping') || pathname.includes('/returns');
  const shouldShowFaq =
    !shouldHideNavAndFooter &&
    (isProductViewPage || isPaymentPage || isShippingOrReturnsPage);

  // White navbar + black footer on: contact, about us, bag, account
  const useWhiteNavbarAndBlackFooter =
    pathname.includes('/contact') ||
    pathname.includes('/about-us') ||
    pathname.includes('/about') ||
    pathname.includes('/bag') ||
    pathname.includes('/account');
  
  return (
    <>
      {/* Portal root for dropdown glass blur – must be first so navbar (z-50) stays on top */}
      {!shouldHideNavAndFooter && (
        <div
          id="dropdown-glass-portal"
          className="fixed inset-0 z-[40] pointer-events-none"
          aria-hidden
        />
      )}

      {/* Fixed Navbar - Only show if not on auth/404 pages */}
      {!shouldHideNavAndFooter && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar variant={useWhiteNavbarAndBlackFooter ? 'white' : 'default'} />
        </div>
      )}

      {/* Main content area */}
      <main
        className={`flex-1 ${useWhiteNavbarAndBlackFooter ? 'bg-black' : 'bg-white'} ${!shouldHideNavAndFooter ? 'pt-20' : ''} relative overflow-hidden`}
      >
        {children}
      </main>
      
      {/* FAQ - Only on product view, payment (checkout), and shipping & returns pages */}
      {shouldShowFaq && (
        <Faq />
      )}
      
      {/* Footer - Black on contact/about/bag/account, white elsewhere */}
      {!shouldHideFooter && (
        <Footer variant={useWhiteNavbarAndBlackFooter ? 'black' : 'white'} />
      )}
    </>
  );
}