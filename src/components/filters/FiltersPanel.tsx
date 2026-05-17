'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  ChevronDown, X, Filter, Search, Grid, Zap, ChevronUp, Palette, Ruler, Calendar, Tag, DollarSign, Gem, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner' // Added Toaster and toast

// --- TYPE DEFINITIONS ---
interface FilterOption {
  value: string
  label: string
  count?: number
  colorHex?: string
  icon?: React.ReactNode
}

interface FilterSection {
  id: string
  title: string
  type: 'checkbox' | 'radio' | 'range'
  options: FilterOption[]
  icon?: React.ReactNode
}

// --- UTILITY COMPONENTS ---
const ColorIndicator = ({ colorHex, size = 'sm' }: { colorHex: string, size?: 'xs' | 'sm' | 'md' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full border border-white/20 shadow-sm flex-shrink-0`}
      style={{ backgroundColor: colorHex }}
    />
  )
}

// --- MAIN COMPONENT ---
const FiltersPanel = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // --- COMPREHENSIVE FILTER DATA (WITH ICONS & MONGOLIAN TEXTS) ---
  const filterSections: FilterSection[] = useMemo(() => [
    {
      id: 'brand',
      title: 'Брэнд', // Brand
      type: 'checkbox',
      icon: <Zap size={18} />,
      options: [
        { value: 'adidas', label: 'adidas' },
        { value: 'air jordan', label: 'Air Jordan' },
        { value: 'asics', label: 'ASICS' },
        { value: 'balenciaga', label: 'Balenciaga' },
        { value: 'bape', label: 'BAPE' },
        { value: 'burberry', label: 'Burberry' },
        { value: 'comme des garcons play', label: 'CDG Play' },
        { value: 'converse', label: 'Converse' },
        { value: 'dior', label: 'Dior' },
        { value: 'fear of god', label: 'Fear Of God' },
        { value: 'gucci', label: 'Gucci' },
        { value: 'kith', label: 'Kith' },
        { value: 'louis vuitton', label: 'Louis Vuitton' },
        { value: 'new balance', label: 'New Balance' },
        { value: 'nike', label: 'Nike' },
        { value: 'off white', label: 'Off-White' },
        { value: 'puma', label: 'Puma' },
        { value: 'stone island', label: 'Stone Island' },
        { value: 'stussy', label: 'Stussy' },
        { value: 'supreme', label: 'Supreme' },
        { value: 'the north face', label: 'The North Face' },
        { value: 'ugg', label: 'Ugg' },
        { value: 'vans', label: 'Vans' },
        { value: 'yeezy', label: 'Yeezy' },
      ],
    },
    {
      id: 'web_groups',
      title: 'Ангилал', // Category
      type: 'checkbox',
      icon: <Grid size={18} />,
      options: [
        { value: 'sneakers', label: 'Пүүз' }, // Sneakers
        { value: 'apparel', label: 'Хувцас' }, // Apparel
        { value: 'space', label: 'Гэр ахуй' }, // Home
      ],
    },
    {
      id: 'gender',
      title: 'Хүйс', // Gender
      type: 'checkbox',
      icon: <img src="https://placehold.co/20x20/000000/FFFFFF?text=G" alt="Gender" className="w-5 h-5 text-white" />, // Placeholder image for gender icon
      options: [
        { value: 'men', label: 'Эрэгтэй' }, // Men
        { value: 'women', label: 'Эмэгтэй' }, // Women
        { value: 'youth', label: 'Өсвөр нас' }, // Youth
        { value: 'infant', label: 'Хүүхэд' }, // Infant
      ],
    },
    {
      id: 'color',
      title: 'Өнгө', // Color
      type: 'checkbox',
      icon: <Palette size={18} />,
      options: [
        { value: 'white', label: 'Цагаан', colorHex: '#FFFFFF' }, // White
        { value: 'grey', label: 'Саарал', colorHex: '#8B8B8B' }, // Grey
        { value: 'black', label: 'Хар', colorHex: '#000000' }, // Black
        { value: 'green', label: 'Ногоон', colorHex: '#34D399' }, // Green
        { value: 'blue', label: 'Цэнхэн', colorHex: '#60A5FA' }, // Blue
        { value: 'purple', label: 'Ягаан', colorHex: '#A78BFA' }, // Purple (Note: 'Ягаан' is often pink, 'Нил ягаан' is purple. Using 'Ягаан' for simplicity as per common usage.)
        { value: 'pink', label: 'Ягаан', colorHex: '#F472B6' }, // Pink
        { value: 'red', label: 'Улаан', colorHex: '#F87171' }, // Red
        { value: 'orange', label: 'Улбар шар', colorHex: '#FB923C' }, // Orange
        { value: 'yellow', label: 'Шар', colorHex: '#FBBF24' }, // Yellow
        { value: 'cream', label: 'Цөцгий', colorHex: '#FEF3C7' }, // Cream
        { value: 'tan', label: 'Бор шаргал', colorHex: '#D2B48C' }, // Tan
        { value: 'brown', label: 'Бор', colorHex: '#A16207' }, // Brown
        { value: 'silver', label: 'Мөнгөлөг', colorHex: '#C0C0C0' }, // Silver
        { value: 'gold', label: 'Алтлаг', colorHex: '#FFD700' }, // Gold
      ]
    },
    {
      id: 'size_converted',
      title: 'Хэмжээ', // Size
      type: 'checkbox',
      icon: <Ruler size={18} />,
      options: [
        { value: 'us_sneakers_men_4', label: '4' },
        { value: 'us_sneakers_men_5', label: '5' },
        { value: 'us_sneakers_men_6', label: '6' },
        { value: 'us_sneakers_men_7', label: '7' },
        { value: 'us_sneakers_men_8', label: '8' },
        { value: 'us_sneakers_men_9', label: '9' },
        { value: 'us_sneakers_men_10', label: '10' },
        { value: 'us_sneakers_men_11', label: '11' },
        { value: 'us_sneakers_men_12', label: '12' },
        { value: 'us_sneakers_men_13', label: '13' },
      ],
    },
    {
      id: 'product_condition',
      title: 'Байдал', // Condition
      type: 'checkbox',
      icon: <Tag size={18} />,
      options: [
        { value: 'new_no_defects', label: 'Шинэ' }, // New
        { value: 'new_with_defects', label: 'Гэмтэлтэй шинэ' }, // New with Defects
        { value: 'used', label: 'Хуучин' }, // Used
      ],
    },
    {
      id: 'gp_instant_ship_lowest_price_cents',
      title: 'Үнэ', // Price
      type: 'checkbox',
      icon: <DollarSign size={18} />,
      options: [
        { value: '0-10000', label: '$100-аас доош' }, // Under $100
        { value: '10000-20000', label: '$100 - $200' },
        { value: '20000-50000', label: '$200 - $500' },
        { value: '50000-', label: '$500-аас дээш' }, // Over $500
      ],
    },
    {
      id: 'release_date_year',
      title: 'Гарсан он', // Release Year
      type: 'checkbox',
      icon: <Calendar size={18} />,
      options: [
        { value: '2025', label: '2025' },
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' },
        { value: '2021', label: '2021' },
        { value: '2020', label: '2020' },
        { value: '2019', label: '2019' },
      ]
    },
    {
      id: 'material',
      title: 'Материал', // Material
      type: 'checkbox',
      icon: <Gem size={18} />,
      options: [
        { value: 'leather', label: 'Арьс' }, // Leather
        { value: 'suede', label: 'Үдшийн арьс' }, // Suede
        { value: 'mesh', label: 'Торгомсог' }, // Mesh
        { value: 'primeknit', label: 'Primeknit' },
        { value: 'flyknit', label: 'Flyknit' },
      ]
    },
  ], [])

  // --- EFFECTS ---
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const newActiveFilters: Record<string, string[]> = {}
    filterSections.forEach(section => {
      const values = params.getAll(section.id)
      if (values.length > 0) {
        newActiveFilters[section.id] = values
      }
    })
    setActiveFilters(newActiveFilters)

    // Ensure body scroll is managed properly
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = ''; // Clean up on unmount
    };
  }, [searchParams, filterSections, isExpanded])

  // --- HANDLERS ---
  const updateURL = useCallback((filters: Record<string, string[]>) => {
    const params = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (!filterSections.some(section => section.id === key)) {
        params.append(key, value)
      }
    })

    Object.entries(filters).forEach(([key, values]) => {
      values.forEach(val => params.append(key, val))
    })

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    setTimeout(() => setIsLoading(false), 300);
  }, [pathname, router, searchParams, filterSections])

  const handleFilterChange = useCallback((sectionId: string, value: string) => {
    setIsLoading(true)
    const newActiveFilters = { ...activeFilters }
    const currentValues = newActiveFilters[sectionId] || []

    if (currentValues.includes(value)) {
      newActiveFilters[sectionId] = currentValues.filter(v => v !== value)
      if (newActiveFilters[sectionId].length === 0) {
        delete newActiveFilters[sectionId]
      }
      toast.info(`'${filterSections.find(s => s.id === sectionId)?.options.find(o => o.value === value)?.label || value}' шүүлтүүр устгагдлаа.`) // Filter removed
    } else {
      if (filterSections.find(s => s.id === sectionId)?.type === 'radio') {
        newActiveFilters[sectionId] = [value]
      } else {
        newActiveFilters[sectionId] = [...currentValues, value]
      }
      toast.success(`'${filterSections.find(s => s.id === sectionId)?.options.find(o => o.value === value)?.label || value}' шүүлтүүр нэмэгдлээ.`) // Filter added
    }
    setActiveFilters(newActiveFilters)
    updateURL(newActiveFilters)
  }, [activeFilters, filterSections, updateURL])


  const clearAllFilters = useCallback(() => {
    if (Object.keys(activeFilters).length === 0) return
    setIsLoading(true)
    setActiveFilters({})
    updateURL({})
    toast.info('Бүх шүүлтүүрийг арилгалаа.') // All filters cleared
  }, [activeFilters, updateURL])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // --- RENDER LOGIC ---
  const totalActiveFilters = useMemo(() => Object.values(activeFilters).reduce(
    (sum, values) => sum + values.length,
    0,
  ), [activeFilters])

  const FilterSectionButton = ({ section, isActive }: { section: FilterSection, isActive: boolean }) => (
    <motion.button
      onClick={() => toggleSection(section.id)}
      className={`relative flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl text-base font-medium transition-all duration-300 w-full font-sans tracking-tight ${
        isActive
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
          : 'bg-white/8 text-white/80 hover:bg-white/12 hover:text-white'
      }`}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Corrected way to clone and pass className to the icon */}
        {section.icon && React.isValidElement(section.icon) && (
          React.cloneElement(section.icon as React.ReactElement<{ className?: string }>, {
            className: `${(section.icon as React.ReactElement<{ className?: string }>).props.className || ''} text-white/80 flex-shrink-0`
          })
        )}
        <span>{section.title}</span>
        {activeFilters[section.id] && activeFilters[section.id].length > 0 && (
          <motion.div
            className="bg-white/20 text-xs px-2 py-0.5 rounded-full min-w-[20px] flex items-center justify-center font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {activeFilters[section.id].length}
          </motion.div>
        )}
      </div>
      <motion.div
        animate={{ rotate: expandedSections[section.id] ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown size={18} className="text-white/60" />
      </motion.div>
    </motion.button>
  )

  const CollapsedFilterBar = ({ totalActiveFilters, activeFilters, toggleExpanded, handleFilterChange, filterSections }: {
    totalActiveFilters: number;
    activeFilters: Record<string, string[]>;
    toggleExpanded: () => void;
    handleFilterChange: (sectionId: string, value: string) => void;
    filterSections: FilterSection[];
  }) => {
    // Collect all active filter options to display in the "Dynamic Island"
    const activeFilterPills = useMemo(() => {
      const pills: { sectionId: string; option: FilterOption }[] = []
      Object.entries(activeFilters).forEach(([sectionId, values]) => {
        const section = filterSections.find(s => s.id === sectionId)
        if (section) {
          values.forEach(val => {
            const option = section.options.find(o => o.value === val)
            if (option) {
              pills.push({ sectionId, option })
            }
          })
        }
      })
      return pills
    }, [activeFilters, filterSections])

    return (
      <motion.div
        // Changed max-w to be tighter for the collapsed state
        className="relative bg-black/80 backdrop-blur-3xl rounded-[3rem] border border-neutral-700 shadow-2xl shadow-black/40 overflow-hidden font-sans antialiased
                   w-full md:max-w-xl lg:max-w-md xl:max-w-sm mx-auto" // Control width for larger screens
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {totalActiveFilters > 0 ? (
          // "Second Dynamic Island" for active filters
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 h-[60px] overflow-hidden"> {/* Reduced height */}
            <motion.button
              onClick={toggleExpanded}
              className="flex-shrink-0 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/90 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Expand filters"
            >
              <Filter size={18} /> {/* Smaller icon */}
            </motion.button>

            <div className="flex-1 flex overflow-x-auto custom-scrollbar-horizontal py-2 -my-2 gap-2">
              {activeFilterPills.map(({ sectionId, option }) => (
                <motion.div
                  key={`${sectionId}-${option.value}`}
                  className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30 flex-shrink-0" // Tighter padding
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {sectionId === 'color' && option.colorHex && (
                    <ColorIndicator colorHex={option.colorHex} size="xs" />
                  )}
                  <span className="whitespace-nowrap">{option.label}</span>
                  <motion.button
                    onClick={() => handleFilterChange(sectionId, option.value)}
                    className="p-0.5 hover:bg-blue-400/20 rounded-full transition-colors duration-200"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    aria-label={`Remove filter: ${option.label}`}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={toggleExpanded}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200" // Smaller text/padding
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Expand filters"
            >
              <span className="hidden sm:inline">Шүүлтүүр</span> ({totalActiveFilters})
            </motion.button>
          </div>
        ) : (
          // Slimmer "Open Filters" button when no filters are active
          <motion.button
            onClick={toggleExpanded}
            className="flex items-center justify-center gap-2 px-6 py-3 w-full h-[60px] text-white/90 hover:text-white transition-colors duration-200 text-sm sm:text-base" // Reduced height, smaller text
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Open filters panel"
          >
            <Search size={16} strokeWidth={2} className="text-white/60" /> {/* Smaller icon */}
            <span className="font-medium">Хайлт & Шүүлтүүр</span>
            <ChevronUp size={16} className="text-white/60" /> {/* Smaller icon */}
          </motion.button>
        )}
      </motion.div>
    )
  }

  return (
    <>
      {/* Overlay for expanded state */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)} // Click outside to close
          />
        )}
      </AnimatePresence>

      {/* Main Filter Panel Container */}
      <motion.div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full px-4 font-sans antialiased"
        // This outer div now only provides the fixed positioning and overall padding.
        // The max-width for the expanded/collapsed state is handled by the children.
        initial={{ y: 100, opacity: 0 }} // Initial animation for the whole container appearing
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded-panel"
              // Adjusted max-width for the expanded panel to align with aesthetic
              className="mx-auto bg-black/80 backdrop-blur-3xl rounded-2xl border border-neutral-700 shadow-2xl shadow-black/40 overflow-hidden
                         w-full max-w-2xl md:max-w-2xl lg:max-w-xl" // Added more explicit max-widths for expanded
              initial={{ height: 0, opacity: 0, borderRadius: '3rem' }}
              animate={{ height: 'auto', opacity: 1, borderRadius: '2rem' }}
              exit={{ height: 0, opacity: 0, borderRadius: '3rem' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Loading Indicator */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-700"> {/* Changed border color */}
                <div className="flex items-center gap-4">
                  <Filter size={24} className="text-blue-400" strokeWidth={2} />
                  <div>
                    <h3 className="font-semibold text-white text-xl">Шүүлтүүр</h3>
                    <p className="text-neutral-400 text-sm"> {/* Changed text color */}
                      {totalActiveFilters > 0 ? `${totalActiveFilters} идэвхтэй шүүлтүүр` : 'Хайлтаа тохируулах'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {totalActiveFilters > 0 && (
                    <motion.button
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Бүгдийг арилгах
                    </motion.button>
                  )}
                  <motion.button
                    onClick={toggleExpanded}
                    className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors duration-200" // Changed background
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close filters panel"
                  >
                    <X size={20} className="text-white/60" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>

              {/* Active Filters Pills (Expanded State - still visible for context) */}
              <AnimatePresence>
                {totalActiveFilters > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-6 pb-0 overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(activeFilters).map(([sectionId, values]) => (
                        values.map(value => {
                          const section = filterSections.find(s => s.id === sectionId)
                          const option = section?.options.find(o => o.value === value)
                          return (
                            <motion.div
                              key={`${sectionId}-${value}`}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {section?.id === 'color' && option?.colorHex && (
                                <ColorIndicator colorHex={option.colorHex} size="xs" />
                              )}
                              <span>{option?.label || value}</span>
                              <motion.button
                                onClick={() => handleFilterChange(sectionId, value)}
                                className="p-1 hover:bg-blue-400/20 rounded-full transition-colors duration-200"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.8 }}
                                aria-label={`Remove filter: ${option?.label || value}`}
                              >
                                <X size={12} strokeWidth={2.5} />
                              </motion.button>
                            </motion.div>
                          )
                        })
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter Sections */}
              <div className={`p-6 space-y-3 ${totalActiveFilters > 0 ? 'pt-3' : ''} max-h-80 overflow-y-auto custom-scrollbar`}>
                {filterSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 + 0.1 }}
                    className="space-y-3"
                  >
                    <FilterSectionButton section={section} isActive={!!activeFilters[section.id] && activeFilters[section.id].length > 0} />

                    {/* Section Options */}
                    <AnimatePresence>
                      {expandedSections[section.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden ml-4"
                        >
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-white/5 rounded-xl border border-neutral-700 max-h-52 overflow-y-auto custom-scrollbar"> {/* Changed border color */}
                            {section.options.map((option) => {
                              const isActive = activeFilters[section.id]?.includes(option.value) || false
                              return (
                                <motion.button
                                  key={option.value}
                                  onClick={() => handleFilterChange(section.id, option.value)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap overflow-hidden text-ellipsis ${
                                    isActive
                                      ? 'bg-blue-500 text-white shadow-sm'
                                      : 'bg-black border border-neutral-700 text-white/70 hover:bg-neutral-900 hover:border-neutral-600' // Matches inspiration
                                  }`}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  {section.id === 'color' && option.colorHex && (
                                    <ColorIndicator colorHex={option.colorHex} size="xs" />
                                  )}
                                  <span className="truncate">{option.label}</span>
                                </motion.button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* "Done" Button */}
              <div className="p-6 pt-3 border-t border-neutral-700"> {/* Changed border color */}
                <motion.button
                  onClick={toggleExpanded}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <CheckCircle size={20} />
                  Болсон
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // Collapsed state rendered via a separate component
            <CollapsedFilterBar
              totalActiveFilters={totalActiveFilters}
              activeFilters={activeFilters}
              toggleExpanded={toggleExpanded}
              handleFilterChange={handleFilterChange}
              filterSections={filterSections}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Custom Styles for Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.45);
        }

        /* Styles for horizontal scrollbar in collapsed "Dynamic Island" */
        .custom-scrollbar-horizontal::-webkit-scrollbar {
          height: 4px; /* Slimmer horizontal scrollbar */
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
      <Toaster position="bottom-center" richColors theme="dark" />
    </>
  )
}

export default FiltersPanel
