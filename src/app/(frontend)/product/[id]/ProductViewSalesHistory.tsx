'use client';

import type { SaleItem } from '@/types/product';

interface SalesHistoryContentProps {
  salesData: SaleItem[];
  mntRate: number | null;
}

export function SalesHistoryContent({ salesData, mntRate }: SalesHistoryContentProps) {
  return (
    <div className="text-white/90 space-y-3">
      <div className="bg-indigo-500/20 backdrop-blur-sm p-4 rounded-xl border border-indigo-400/30 mb-4">
        <p className="text-indigo-100 font-semibold">
          {salesData.length} recent sale{salesData.length !== 1 ? 's' : ''}{' '}
          recorded
        </p>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {salesData.map((sale, index) => (
          <div
            key={`${sale.purchased_at}-${index}`}
            className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">
                Size US {sale.size_us}
              </span>
              <span className="text-white/50 text-xs mt-0.5">
                {new Date(sale.purchased_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {sale.location && (
                <span className="text-white/40 text-xs">{sale.location}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-white font-bold text-base">
                {mntRate
                  ? `₮${(sale.amount * mntRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                  : `$${sale.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <div className="text-white/40 text-xs mt-0.5">
                ${sale.amount} USD
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
