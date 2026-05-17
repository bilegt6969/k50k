'use client';

import { useMemo } from 'react';
import type { DailySaleItem } from '@/types/product';

interface DailySalesContentProps {
  dailySalesData: DailySaleItem[];
  mntRate: number | null;
}

export function DailySalesContent({
  dailySalesData,
  mntRate,
}: DailySalesContentProps) {
  const maxCount = useMemo(
    () => Math.max(...dailySalesData.map((d) => d.count), 1),
    [dailySalesData]
  );

  return (
    <div className="text-white/90 space-y-3">
      <div className="bg-teal-500/20 backdrop-blur-sm p-4 rounded-xl border border-teal-400/30 mb-4">
        <p className="text-teal-100 font-semibold">
          Sales trend over the last {dailySalesData.length} day
          {dailySalesData.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {dailySalesData.map((day, index) => (
          <div
            key={`${day.date}-${index}`}
            className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:border-white/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">
                {new Date(day.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <div className="text-right">
                <span className="text-teal-300 font-bold text-sm">
                  {day.count} sold
                </span>
                {day.total_amount > 0 && (
                  <div className="text-white/50 text-xs mt-0.5">
                    {mntRate
                      ? `₮${(day.total_amount * mntRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      : `$${day.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}{' '}
                    total
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-teal-400/70 transition-all duration-500"
                style={{ width: `${(day.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
