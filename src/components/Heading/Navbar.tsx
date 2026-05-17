'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/functions';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, XIcon, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import Icons from '@/components/global/icons';
import Wrapper from '@/components/global/wrapper';
import Menu from './menu';
import MobileMenu from './mobile-menu';
import AuthButton from '@/app/(frontend)/auth/AuthButton';
import useCartStore from '@/app/store/cartStore';
import { NavbarSearchModal } from './NavbarSearchModal';
import CartPanel from './CartPanel'; // Import the new CartPanel component
import Logo from '../../../public/images/Logo.svg';

const smoothEase: [number, number, number, number] = [0.4, 0, 0.2, 1];

type NavbarVariant = 'default' | 'black' | 'white';

export default function Navbar({ variant = 'default' }: { variant?: NavbarVariant }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // New state for cart panel
  const [isVisible, setIsVisible] = useState(false);
  const isLargeScreen = useMediaQuery('(min-width:1024px)');
  const isMdScreen = useMediaQuery('(min-width:768px)');
  const isMobile = !isLargeScreen;
  const cart = useCartStore((state) => state.cart);
  const itemCount = cart.reduce(
    (total: number, item: { quantity: number }) => total + item.quantity,
    0
  );
  const isBlackVariant = variant === 'black';
  const isWhiteVariant = variant === 'white';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLargeScreen && isOpen) setIsOpen(false);
  }, [isLargeScreen, isOpen]);

  useEffect(() => {
    const isMobileMenuOpen = isOpen && isMobile;
    const isMobileSearchOpen = isSearchOpen && !isMdScreen;
    const shouldLockScroll = isMobileMenuOpen || isMobileSearchOpen || isCartOpen;
    document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile, isSearchOpen, isMdScreen, isCartOpen]);

  const navbarVariants: Variants = {
    hidden: { y: -50, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 28,
        mass: 0.8,
        opacity: { duration: 0.4, ease: smoothEase },
      },
    },
  };

  return (
    <div className="relative w-full text-neutral-400">
      <div className="z-[99] fixed pointer-events-none inset-x-0 h-[88px]" />
      <AnimatePresence>
        {isVisible && (
          <motion.header
            variants={navbarVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className={cn(
              'fixed top-4 inset-x-0 mx-auto max-w-6xl px-2 md:px-12 z-[100]',
              'h-12'
            )}
          >
            <Wrapper
              className={cn(
                'relative h-full flex items-center justify-start px-1 sm:px-2 md:px-2',
                'rounded-full',
                isWhiteVariant
                  ? 'bg-white/90 backdrop-blur-xl border border-neutral-200'
                  : isBlackVariant
                    ? 'bg-black border border-white/20'
                    : 'bg-black/70 backdrop-blur-xl border border-white/20 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-b before:from-white/25 before:to-transparent before:opacity-75 before:pointer-events-none'
              )}
            >
              <div className="flex items-center mx-1 sm:mx-0 justify-between w-full">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <Link
                    href="/"
                    className="text-lg font-semibold transition-colors text-foreground bg-[#232323] hover:bg-neutral-900 py-0 px-[5px] rounded-full border border-neutral-700 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Homepage"
                  >
                    <Image
                      height={60}
                      width={60}
                      src={Logo}
                      alt="saintoLogo"
                      priority
                      className="transition-transform duration-300 transform px-1"
                    />
                  </Link>
                  <div className="items-center hidden lg:flex">
                    <Menu variant={isWhiteVariant ? 'white' : 'default'} />
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-4">
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => setIsSearchOpen((prev) => !prev)}
                    className={`rounded-full transition-all items-center duration-200 px-3 py-2 glossy-button-effect hover:brightness-125 ${
                      isWhiteVariant 
                        ? 'text-black bg-neutral-100 hover:bg-neutral-200' 
                        : 'text-white bg-neutral-800 hover:bg-neutral-700'
                    }`}
                    aria-label={isSearchOpen ? 'Хайх талбарыг хаах' : 'Хайх'}
                    aria-expanded={isSearchOpen}
                  >
                    <Search className="w-4 h-4 relative z-10" />
                    <span className="ml-0 sm:ml-2 hidden sm:inline font-medium relative z-10">
                      Хайх
                    </span>
                  </Button>

                  {/* Cart Button - Opens Panel instead of navigating */}
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className={`relative flex items-center duration-300 transition-all ease-soft-spring p-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isWhiteVariant 
                        ? 'text-black hover:text-black hover:bg-neutral-100' 
                        : 'text-white hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                    aria-label={`Shopping bag with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                  >
                    <ShoppingBag className="w-6 h-6" />
                    <AnimatePresence>
                      {itemCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, y: 5 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                          className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-medium rounded-full px-1.5 leading-tight flex items-center justify-center min-w-[16px] h-[16px]"
                          aria-hidden
                        >
                          {itemCount > 9 ? '9+' : itemCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <div className="hidden lg:inline">
                    <AuthButton />
                  </div>

                  <div className="lg:hidden">
                    <AuthButton variant="mobile-header" />
                  </div>

                  <div className="lg:hidden">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsOpen((prev) => !prev)}
                      className="p-2 w-8 h-8 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-full"
                      aria-label={isOpen ? 'Close menu' : 'Open menu'}
                      aria-expanded={isOpen}
                      aria-controls="mobile-menu-content"
                    >
                      <AnimatePresence initial={false} mode="wait">
                        <motion.div
                          key={isOpen ? 'x' : 'menu'}
                          initial={{
                            rotate: isOpen ? 90 : -90,
                            opacity: 0,
                            scale: 0.5,
                          }}
                          animate={{ rotate: 0, opacity: 1, scale: 1 }}
                          exit={{
                            rotate: isOpen ? -90 : 90,
                            opacity: 0,
                            scale: 0.5,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {isOpen ? (
                            <XIcon className="w-4 h-4" />
                          ) : (
                            <Icons.menu className="w-3.5 h-3.5" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </div>
                </div>
              </div>

              {!isLargeScreen && (
                <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} />
              )}
            </Wrapper>
          </motion.header>
        )}
      </AnimatePresence>
      <NavbarSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpen={() => setIsSearchOpen(true)}
      />
      
      {/* Cart Panel */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}