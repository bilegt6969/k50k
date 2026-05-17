'use client';

import { CheckIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface SizeSelectorProps {
  sizeOptions: string[];
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
}

export function SizeSelector({
  sizeOptions,
  selectedSize,
  onSizeSelect,
}: SizeSelectorProps) {
  const MOTION_EASE = [0.22, 1, 0.36, 1] as const;
  const CHIP_STAGGER = 0.024;
  const CHIP_DURATION = 0.2;

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hasSizes = sizeOptions.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedSizes = useMemo(
    () =>
      [...sizeOptions].sort((a, b) => {
        const sizeA = parseFloat(a);
        const sizeB = parseFloat(b);
        if (Number.isNaN(sizeA) || Number.isNaN(sizeB)) return a.localeCompare(b);
        return sizeA - sizeB;
      }),
    [sizeOptions]
  );

  const handleSelect = (size: string) => {
    onSizeSelect(size);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold tracking-wide uppercase text-white/70">
          Select size
        </p>
        <Link
          href="/resources/size-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/80 hover:text-white underline decoration-white/30 underline-offset-4 transition-colors"
        >
          Size chart
        </Link>
      </div>

      <div className="rounded-3xl border border-white/15 bg-black/30 backdrop-blur-xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-white/60">Selected</p>
            <p className="text-xl font-semibold text-white">
              {selectedSize ? `US ${selectedSize}` : 'No size selected'}
            </p>
          </div>
          {selectedSize && (
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-300/25">
              Ready to add
            </span>
          )}
        </div>

        <button
          id="size-select-button"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={!hasSizes}
          className={`w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
            hasSizes
              ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
              : 'border-white/10 bg-white/[0.03] text-white/40 cursor-not-allowed'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">
              {hasSizes ? 'Open size selector' : 'No sizes available'}
            </span>
            <ChevronDownIcon
              className={`h-5 w-5 text-white/70 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.button
                  type="button"
                  aria-label="Close size selector"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: MOTION_EASE }}
                  className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-[3px]"
                  onClick={() => setIsOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: MOTION_EASE }}
                  className="fixed inset-x-3 top-1/2 z-[130] mx-auto w-full max-w-2xl -translate-y-1/2 rounded-3xl border border-white/20 bg-[#111111]/95 backdrop-blur-2xl p-4 sm:inset-x-6 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                  role="listbox"
                >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-white text-base font-semibold">Choose your size</p>
                  <p className="text-sm text-white/60">Tap one size to continue checkout</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/15 p-1.5 text-white/70 hover:text-white hover:border-white/30 transition-colors"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <motion.div
                className="grid grid-cols-3 sm:grid-cols-4 gap-2.5"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: CHIP_STAGGER,
                      delayChildren: 0.04,
                    },
                  },
                }}
              >
                {sortedSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <motion.button
                      key={size}
                      type="button"
                      onClick={() => handleSelect(size)}
                      role="option"
                      aria-selected={isSelected}
                      variants={{
                        hidden: { opacity: 0, y: 8, scale: 0.985 },
                        visible: { opacity: 1, y: 0, scale: 1 },
                      }}
                      whileHover={{
                        y: -1.5,
                        scale: 1.015,
                      }}
                      whileTap={{
                        y: 0,
                        scale: 0.97,
                      }}
                      animate={
                        isSelected
                          ? {
                              scale: [1, 1.03, 1],
                              boxShadow: [
                                '0 0 0 rgba(0,0,0,0)',
                                '0 0 0.5rem rgba(110, 231, 183, 0.25)',
                                '0 0 0 rgba(0,0,0,0)',
                              ],
                            }
                          : { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
                      }
                      transition={
                        isSelected
                          ? {
                              opacity: { duration: CHIP_DURATION, ease: MOTION_EASE },
                              y: { duration: CHIP_DURATION, ease: MOTION_EASE },
                              scale: { duration: 0.24, ease: MOTION_EASE },
                              boxShadow: { duration: 0.3, ease: MOTION_EASE },
                            }
                          : {
                              opacity: { duration: 0.18, ease: MOTION_EASE },
                              y: { duration: CHIP_DURATION, ease: MOTION_EASE },
                              scale: { type: 'spring', stiffness: 320, damping: 24 },
                            }
                      }
                      className={`relative h-12 rounded-xl border text-sm font-semibold transition-all ${
                        isSelected
                          ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100'
                          : 'border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      US {size}
                      {isSelected && <CheckIcon className="h-4 w-4 absolute top-1.5 right-1.5" />}
                    </motion.button>
                  );
                })}
              </motion.div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-white/70">
                  Tip: Between sizes? Choose half-size up for a roomier fit.
                </p>
              </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}