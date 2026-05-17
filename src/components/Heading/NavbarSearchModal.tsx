'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/functions';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Search, XIcon, Clock, X, Reply } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { SearchProduct } from '@/types/product';

const popularSearches = [
  'Nike Air Jordan 1',
  'Supreme Box Logo',
  'Yeezy 350',
  'Off-White Sneakers',
  'Vintage Denim',
  'Designer Bags',
  'Streetwear Hoodies',
  'Luxury Watches',
  'Limited Edition',
  'Rare Collectibles',
];

interface NavbarSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function NavbarSearchModal({
  isOpen,
  onClose,
  onOpen,
}: NavbarSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpen();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose, onOpen]);

  // ✅ FIXED: Now properly resets hasTyped when query becomes empty
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (!hasTyped) setHasTyped(true);
      const filtered = popularSearches
        .filter((item) =>
          item.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setSelectedIndex(-1);
    } else {
      if (hasTyped) setHasTyped(false); // ✅ Reset hasTyped when query is empty
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [searchQuery, hasTyped]);

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('recentSearches');
        setRecentSearches(stored ? JSON.parse(stored) : []);
      } catch {
        setRecentSearches([]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSelectedIndex(-1);
      setSearchProducts([]);
      setHasTyped(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchProducts([]);
      setProductsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setProductsLoading(true);
      fetch(`/api/search/library?query=${encodeURIComponent(q)}&page_limit=4`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((json: { success?: boolean; data?: { products: SearchProduct[] } }) => {
          if (json?.success && Array.isArray(json?.data?.products)) {
            setSearchProducts(json.data.products.slice(0, 4));
          } else {
            setSearchProducts([]);
          }
        })
        .catch(() => setSearchProducts([]))
        .finally(() => setProductsLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!isOpen) return;
      const items = suggestions.length > 0 ? suggestions : recentSearches;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          handleSearchSelect(items[selectedIndex]);
        } else if (searchQuery.trim()) {
          handleSearchSelect(searchQuery);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, searchQuery, recentSearches, selectedIndex, suggestions]);

  const saveSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 10);
    setRecentSearches(updated);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {}
  };

  const deleteRecentSearch = (index: number) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    setSelectedIndex(-1);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {}
  };

  const handleSearchSelect = (query: string) => {
    saveSearch(query);
    router.push(`/search?query=${encodeURIComponent(query)}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) handleSearchSelect(searchQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
    } catch {}
  };

  const formatPriceUsd = (product: SearchProduct) => {
    const c = product.localizedRetailPriceCents?.amountCents;
    if (c == null || c === 0) return 'N/A';
    return `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const showProductsSection =
    searchQuery.trim().length > 0 &&
    (productsLoading || searchProducts.length > 0);

  const easeOutSmooth = [0.16, 1, 0.3, 1] as const;
  const easeInOutSmooth = [0.65, 0, 0.35, 1] as const;

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.6, ease: easeOutSmooth } },
    exit: { opacity: 0, transition: { duration: 0.5, ease: easeInOutSmooth } },
  };

  const searchBarVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 26, mass: 1 } },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.5, ease: easeInOutSmooth } },
  };

  const contentVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.55, ease: easeOutSmooth } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.4, ease: easeInOutSmooth } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -12 },
    show: (i: number) => ({ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.045, duration: 0.5, ease: easeOutSmooth } }),
    exit: { opacity: 0, x: -8, transition: { duration: 0.35, ease: easeInOutSmooth } },
  };

  const dotVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 220, damping: 24 } },
    pulse: { scale: [1, 1.15, 1], opacity: [1, 0.85, 1], transition: { duration: 2.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] } },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.35, ease: easeInOutSmooth } },
  };

  const renderSearchInput = () => (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2.5 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {!hasTyped ? (
            <motion.div
              key="dot"
              variants={dotVariants}
              initial="hidden"
              animate={['show', 'pulse']}
              exit="exit"
              className="w-2.5 h-2.5 bg-white rounded-full shrink-0"
            />
          ) : (
            <motion.span
              key="showme"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-[15px] text-neutral-500 font-semibold tracking-tight"
            >
              Show me
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="outdoor signage..."
        className={cn(
          'w-full h-14 pr-[4.25rem] text-[16px] bg-neutral-800/70 text-white/95 placeholder-white/40 focus:placeholder-white/50 outline-none border-0 rounded-full backdrop-blur-xl focus:ring-2 focus:ring-white/20',
          hasTyped ? 'pl-24' : 'pl-12'
        )}
        style={{
          fontWeight: 400,
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
          transition: 'padding-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        autoComplete="off"
        spellCheck={false}
      />
      {/* ✅ IMPROVED: Smoother animation with better transition configuration */}
      <motion.button
        type="submit"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          backgroundColor: hasTyped ? 'rgb(255, 255, 255)' : 'rgba(82, 82, 82, 0.8)'
        }}
        transition={{ 
          opacity: { delay: 0.2, duration: 0.5, ease: easeOutSmooth },
          scale: { delay: 0.2, duration: 0.5, ease: easeOutSmooth },
          backgroundColor: { duration: 0.4, ease: easeOutSmooth } // ✅ Smoother, faster transition
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10",
          hasTyped 
            ? "hover:bg-neutral-100" 
            : "hover:bg-neutral-500/80"
        )}
        style={{
          transition: 'background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1)' // ✅ CSS fallback for smoother hover
        }}
        aria-label="Search"
      >
        <motion.div
          animate={{ 
            color: hasTyped ? 'rgb(0, 0, 0)' : 'rgba(255, 255, 255, 0.9)'
          }}
          transition={{ duration: 0.4, ease: easeOutSmooth }} // ✅ Smoother color transition
        >
          <Reply className="w-5 h-5 rotate-180" strokeWidth={2} />
        </motion.div>
      </motion.button>
    </form>
  );

  const renderProductGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {searchProducts.map((product) => (
        <Link
          key={product.id}
          href={product.slug ? `/product/${product.slug}` : '#'}
          onClick={() => onClose()}
          className="block rounded-[18px] overflow-hidden bg-white/5 hover:bg-white/10 transition-colors group"
        >
          <div className="relative aspect-square">
            {product.pictureUrl ? (
              <Image
                src={product.pictureUrl}
                alt={product.title || ''}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
                sizes="120px"
              />
            ) : (
              <div className="w-full h-full bg-white/10" />
            )}
          </div>
          <div className="p-2">
            <p className="text-[12px] text-white/90 line-clamp-2 min-h-[2.25rem]">{product.title}</p>
            {formatPriceUsd(product) !== 'N/A' && (
              <p className="text-[11px] text-white/50 mt-0.5">{formatPriceUsd(product)}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );

  const renderSuggestionsPanel = (isMobile = false) =>
    suggestions.length > 0 || recentSearches.length > 0 ? (
      <motion.div
        key="suggestions-panel"
        variants={contentVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className={`bg-neutral-800/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.2)] ${isMobile ? '' : 'mt-4'}`}
      >
        {suggestions.length > 0 ? (
          <div className="p-3">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={() => handleSearchSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-4 py-3.5 rounded-[18px] text-[15px] transition-all flex items-center gap-3 group ${
                  selectedIndex === index
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4 text-white/30 group-hover:text-white/40 transition-colors flex-shrink-0" />
                <span className="flex-1 truncate">{suggestion}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-center justify-between px-4 py-2 mb-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/30" />
                <span className="text-[13px] text-white/40">Recent</span>
              </div>
              <button
                onClick={clearRecentSearches}
                className="text-[13px] text-white/40 hover:text-white/60 transition-colors"
              >
                Clear all
              </button>
            </div>
            {recentSearches.map((search, index) => (
              <motion.div
                key={search}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative group"
              >
                <div
                  onClick={() => handleSearchSelect(search)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-4 py-3.5 rounded-[18px] text-[15px] transition-all flex items-center gap-3 cursor-pointer ${
                    selectedIndex === index
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Search className="w-4 h-4 text-white/30 group-hover:text-white/40 transition-colors flex-shrink-0" />
                  <span className="flex-1 truncate">{search}</span>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecentSearch(index);
                    }}
                    type="button"
                  >
                    <X className="w-3 h-3 text-white/50" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    ) : null;

  const renderProductsPanel = (isMobile = false) =>
    showProductsSection ? (
      <motion.div
        key="products-panel"
        variants={contentVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className={`bg-neutral-800/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.2)] ${isMobile ? '' : 'mt-4'}`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between px-2 py-2 mb-2">
            <span className="text-[13px] text-white/40">Products</span>
            {!productsLoading && searchProducts.length > 0 && (
              <Link
                href={`/search?query=${encodeURIComponent(searchQuery.trim())}`}
                onClick={() => onClose()}
                className="text-[13px] text-white/60 hover:text-white transition-colors"
              >
                See all
              </Link>
            )}
          </div>
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-[18px] bg-white/5 animate-pulse"
                  style={{ aspectRatio: '1/1' }}
                />
              ))}
            </div>
          ) : (
            renderProductGrid()
          )}
        </div>
      </motion.div>
    ) : null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[99] bg-neutral-950/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Desktop */}
          <div className="hidden md:block fixed inset-0 z-[110] pointer-events-none overflow-visible">
            <div className="flex items-start justify-center pt-32 px-4 h-full pointer-events-none overflow-visible">
              <motion.div
                variants={searchBarVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative w-full max-w-2xl pointer-events-auto overflow-visible"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={onClose}
                  className="absolute -top-6 right-7 text-[13px] text-white/40 hover:text-white/60 transition-colors duration-300 z-20 cursor-pointer"
                  aria-label="Close search"
                >
                  Close
                </motion.button>
                <div className="relative">
                  {renderSearchInput()}
                </div>
                <AnimatePresence mode="wait">
                  {renderSuggestionsPanel(false)}
                  {renderProductsPanel(false)}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-[100]">
            <motion.div
              variants={searchBarVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="h-full flex flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 pt-8 pb-6">
                <div className="relative mb-6">
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onClick={onClose}
                    className="absolute -top-6 right-7 text-[13px] text-white/40 hover:text-white/60 active:text-white/60 transition-colors duration-300 z-20 cursor-pointer"
                    aria-label="Close search"
                  >
                    Close
                  </motion.button>
                  {renderSearchInput()}
                </div>
                <AnimatePresence mode="wait">
                  {renderSuggestionsPanel(true)}
                  {renderProductsPanel(true)}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}