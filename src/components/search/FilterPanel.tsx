'use client';

import { memo, useState } from 'react';

// Interfaces for Ebay's refinement data
interface AspectValue {
  value: string;
  count: number;
  refinementHref: string;
}

interface Aspect {
  name: string;
  values: AspectValue[];
}

interface CategoryValue {
  id: string;
  name: string;
  count: number;
  refinementHref: string;
}

export interface EbayFilters {
  aspectRefinements?: Aspect[];
  categoryRefinements?: CategoryValue[];
  dominantCategoryRefinement?: CategoryValue; // <-- ADDED
}

interface FilterPanelProps {
  filters: EbayFilters | null;
  appliedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, value: string, isChecked: boolean) => void;
}

const FilterSection = memo(
  ({
    title,
    filterId,
    values,
    applied,
    onFilterChange,
  }: {
    title: string;
    filterId: string;
    values: { name: string; value: string; count: number }[];
    applied: string[];
    onFilterChange: (filterId: string, value: string, isChecked: boolean) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!values || values.length === 0) return null;

    return (
      // COLOR CHANGE: border-neutral-700 -> border-neutral-300
      <div className="border-b border-neutral-300 py-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center text-left font-semibold text-black"
        >
          <span>{title}</span>
          <span className="text-xl">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-2">
            {values.map((v) => (
              <label
                key={v.value}
                // COLOR CHANGE: text-neutral-300 hover:text-white -> text-neutral-700 hover:text-black
                className="flex items-center space-x-2 text-sm text-neutral-700 hover:text-black cursor-pointer"
              >
                <input
                  type="checkbox"
                  // COLOR CHANGE: bg-neutral-800 border-neutral-600 text-blue-500 focus:ring-blue-600 -> bg-white border-neutral-400 text-blue-600 focus:ring-blue-500
                  className="rounded bg-white border-neutral-400 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  checked={applied.includes(v.value)}
                  onChange={(e) =>
                    onFilterChange(filterId, v.value, e.target.checked)
                  }
                />
                <span>
                  {v.name} ({v.count.toLocaleString()})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  },
);
FilterSection.displayName = 'FilterSection';

export const FilterPanel = ({
  filters,
  appliedFilters,
  onFilterChange,
}: FilterPanelProps) => {
  // --- MODIFICATION: Handle all category filter types ---
  const allCategories: CategoryValue[] = filters?.categoryRefinements
    ? [...filters.categoryRefinements]
    : [];

  // Check for dominant category and add it if it's not already in the list
  if (filters?.dominantCategoryRefinement) {
    const dominantCat = filters.dominantCategoryRefinement;
    if (!allCategories.some((cat) => cat.id === dominantCat.id)) {
      // Add it to the beginning of the list for prominence
      allCategories.unshift(dominantCat);
    }
  }

  const hasCategories = allCategories.length > 0;
  const hasAspects = (filters?.aspectRefinements?.length || 0) > 0;
  // --- END MODIFICATION ---

  // Don't show panel if no filters are available at all
  if (!filters || (!hasCategories && !hasAspects)) {
    // Show a lightweight placeholder on desktop so layout doesn't jump
    return (
      <aside className="hidden md:block w-full md:w-64 lg:w-72 md:pr-6 space-y-4">
        <h3 className="text-xl font-bold mb-2 hidden md:block">Filters</h3>
        <div className="border-b border-neutral-300 py-4">
          <div className="h-6 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
        </div>
        <div className="border-b border-neutral-300 py-4">
          <div className="h-6 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
        </div>
      </aside>
    );
  }

  // --- MODIFICATION: Use allCategories ---
  const categoryValues =
    allCategories.map((cat) => ({
      name: cat.name,
      value: cat.id,
      count: cat.count,
    })) || [];
  // --- END MODIFICATION ---

  const appliedCategory = appliedFilters['categoryIds'] || [];

  return (
    <aside className="w-full md:w-64 lg:w-72 md:pr-6 md:space-y-4 mb-6 md:mb-0">
      <h3 className="text-xl font-bold mb-2 hidden md:block">Filters</h3>
      {hasCategories && (
        <FilterSection
          title="Categories"
          filterId="categoryIds"
          values={categoryValues}
          applied={appliedCategory}
          onFilterChange={onFilterChange}
        />
      )}
      {filters.aspectRefinements?.map((aspect) => (
        <FilterSection
          key={aspect.name}
          title={aspect.name}
          filterId={aspect.name} // Using aspect name as filter ID
          values={aspect.values.map((v) => ({
            name: v.value,
            value: v.value,
            count: v.count,
          }))}
          applied={appliedFilters[aspect.name] || []}
          onFilterChange={onFilterChange}
        />
      ))}
    </aside>
  );
};

