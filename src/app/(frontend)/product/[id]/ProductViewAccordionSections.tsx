'use client';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import { AccordionItem } from './ProductViewAccordion';

interface AccordionSectionsProps {
  openAccordion: string | null;
  onToggle: (id: string) => void;
  selectedSize: string | null;
  isEbayProduct?: boolean;
  ebayData?: unknown;
}

export function ProductViewAccordionSections({
  openAccordion,
  onToggle,
  selectedSize,
  isEbayProduct,
  ebayData,
}: AccordionSectionsProps) {
  return (
    <>
      <AccordionItem
        title="Return Policy"
        isOpen={openAccordion === 'return-policy'}
        onToggle={() => onToggle('return-policy')}
        icon={<ArrowPathIcon className="h-5 w-5" />}
      >
        <div className="text-white/90 space-y-4">
          <div className="bg-amber-500/20 backdrop-blur-sm p-4 rounded-xl border border-amber-400/30">
            <p className="text-amber-100 font-medium mb-2">
              Select a size to see return eligibility
            </p>
            <p className="text-amber-200/80 text-sm">
              Psda is a live marketplace, and the return policy will vary with
              each item. This item&apos;s return policy is as follows:
            </p>
          </div>
          {selectedSize ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">14-Day Return Window</p>
                  <p className="text-white/70 text-sm">
                    Return within 14 days of delivery for a full refund
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white">
                    Original Condition Required
                  </p>
                  <p className="text-white/70 text-sm">
                    Items must be in original, unworn condition with all tags
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/60 italic">
              Select a size above to see specific return eligibility for this
              item.
            </p>
          )}
          <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm font-medium">
            Learn More &rarr;
          </button>
        </div>
      </AccordionItem>

      <AccordionItem
        title="No Fee Resale"
        isOpen={openAccordion === 'no-fee-resale'}
        onToggle={() => onToggle('no-fee-resale')}
        icon={<ArrowPathIcon className="h-5 w-5" />}
      >
        <div className="text-white/90 space-y-4">
          <div className="bg-emerald-500/20 backdrop-blur-sm p-4 rounded-xl border border-emerald-400/30">
            <p className="text-emerald-100 font-semibold mb-2">
              Don&apos;t love it? Resell your purchase without any fees within
              90 days of delivery.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Zero Selling Fees</p>
                <p className="text-white/70 text-sm">
                  No commission or listing fees when you resell
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">90-Day Window</p>
                <p className="text-white/70 text-sm">
                  Plenty of time to decide if you want to keep or resell
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">
                  Authenticated Items Only
                </p>
                <p className="text-white/70 text-sm">
                  All items are pre-verified for authenticity
                </p>
              </div>
            </div>
          </div>
          <button className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 text-sm font-medium">
            No Fee Resale Learn More &rarr;
          </button>
        </div>
      </AccordionItem>

      <AccordionItem
        title="Buyer Promise"
        isOpen={openAccordion === 'buyer-promise'}
        onToggle={() => onToggle('buyer-promise')}
        icon={<ShieldCheckIcon className="h-5 w-5" />}
      >
        <div className="text-white/90 space-y-4">
          <div className="bg-blue-500/20 backdrop-blur-sm p-4 rounded-xl border border-blue-400/30">
            <p className="text-blue-100 font-semibold mb-2">
              We stand behind every product sold on Psda. If we make a mistake,
              we&apos;ll make it right.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Authenticity Guarantee</p>
                <p className="text-white/70 text-sm">
                  Every item is verified by our expert authentication team
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Quality Assurance</p>
                <p className="text-white/70 text-sm">
                  Items are inspected for condition and quality before shipping
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Error Protection</p>
                <p className="text-white/70 text-sm">
                  If we make a mistake, we&apos;ll refund or replace at no cost
                  to you
                </p>
              </div>
            </div>
          </div>
          <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm font-medium">
            Learn More &rarr;
          </button>
        </div>
      </AccordionItem>

      <AccordionItem
        title="Our Process"
        isOpen={openAccordion === 'our-process'}
        onToggle={() => onToggle('our-process')}
        icon={<CheckCircleIcon className="h-5 w-5" />}
      >
        <div className="text-white/90 space-y-4">
          <div className="bg-purple-500/20 backdrop-blur-sm p-4 rounded-xl border border-purple-400/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-100 font-semibold">Condition:</span>
              <span className="bg-green-500/30 text-green-100 px-2 py-1 rounded-lg text-sm font-medium">
                New
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-white/90 leading-relaxed">
              This item is verified by Psda or Xpress ships directly from a Psda
              Verified Seller.
            </p>
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-2">
                  Items verified by Psda:
                </h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  Shipped from Sellers to our Verification Centers, where our
                  global team of experts uses a rigorous, multi-step verification
                  process.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h4 className="font-semibold text-white mb-2">
                  Items from Psda Verified Sellers:
                </h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  Shipped directly from the Seller to you. Sellers in this
                  program must meet Psda&apos;s rigorous standards for accuracy,
                  legitimacy and speed.
                </p>
              </div>
            </div>
            <p className="text-white/90 leading-relaxed">
              And if a mistake is made, Psda will make it right through the{' '}
              <span className="text-blue-400 font-semibold">Psda Buyer Promise.</span>
            </p>
          </div>
        </div>
      </AccordionItem>
    </>
  );
}
