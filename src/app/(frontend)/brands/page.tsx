'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Loader2, Search } from 'lucide-react'

// --- Interface Definition (Matches API Route Output) ---
interface BrandInfo {
    name: string;
    slug: string;
}

// --- Grouped Brands Structure ---
interface GroupedBrands {
    [key: string]: BrandInfo[];
}

// --- Helper function to group and sort brands ---
const groupAndSortBrands = (brands: BrandInfo[]): { groups: GroupedBrands, letters: string[] } => {
    const groups: GroupedBrands = {};
    const letters = new Set<string>();

    brands.forEach(brand => {
        let firstChar = brand.name.charAt(0).toUpperCase();
        if (!firstChar.match(/[A-Z]/)) {
            firstChar = '#';
        }
        if (!groups[firstChar]) {
            groups[firstChar] = [];
        }
        groups[firstChar].push(brand);
        letters.add(firstChar);
    });

    Object.keys(groups).forEach(letter => {
        groups[letter].sort((a, b) => a.name.localeCompare(b.name));
    });

    const sortedLetters = Array.from(letters).sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
    });

    return { groups, letters: sortedLetters };
};


// --- Alphabet Sidebar Component ---
interface AlphabetSidebarProps {
    letters: string[];
    onLetterClick: (letter: string) => void;
}

const AlphabetSidebar: React.FC<AlphabetSidebarProps> = ({ letters, onLetterClick }) => {
    return (
        // Sticky sidebar, hidden below 'md' breakpoint. Adjusted padding/spacing.
        <nav className="sticky top-24 h-[calc(100vh-12rem)] w-16 md:flex flex-col items-center justify-start space-y-0.5 hidden pr-5 pt-4">
             {/* Optional Title */}
             {/* <span className="text-[10px] font-semibold text-neutral-400 mb-2 tracking-wider uppercase">Index</span> */}
            {letters.map((letter) => (
                <button
                    key={letter}
                    onClick={() => onLetterClick(letter)}
                    className="text-xs font-medium text-neutral-500 hover:text-blue-600 focus:outline-none focus:text-blue-700 w-full text-center py-0.5 transition-colors duration-150 rounded"
                    aria-label={`Scroll to brands starting with ${letter}`}
                >
                    {letter}
                </button>
            ))}
        </nav>
    );
};


// --- Main All Brands Page Component ---
export default function AllBrandsPage() {
    const [allBrands, setAllBrands] = useState<BrandInfo[]>([]); // Stores the full list
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Fetch Data from Internal API Route ---
    useEffect(() => {
        const fetchBrands = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log("Fetching brands from /api/brands...");
                const response = await fetch('/api/brands');
                if (!response.ok) {
                     const errorData = await response.json().catch(() => ({})); // Try to parse error
                    throw new Error(errorData.error || `API error! status: ${response.status}`);
                }
                const data: { brands?: BrandInfo[], error?: string } = await response.json();

                if (data.error) {
                     throw new Error(data.error);
                }

                setAllBrands(data.brands || []);
                console.log(`Received ${data.brands?.length || 0} brands from API.`);

            } catch (err) {
                console.error("Error fetching brands:", err);
                setError(err instanceof Error ? err.message : "Failed to load brands");
                setAllBrands([]); // Clear brands on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchBrands();
    }, []); // Runs once on mount

    // --- Filter Brands based on Search Term ---
    const filteredBrands = useMemo(() => {
        if (!searchTerm) {
            return allBrands;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return allBrands.filter(brand =>
            brand.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [allBrands, searchTerm]);

    // --- Group and Sort Filtered Brands ---
    const { groups: filteredGroupedBrands, letters: filteredAvailableLetters } = useMemo(() => {
        return groupAndSortBrands(filteredBrands);
    }, [filteredBrands]);


    // --- Smooth Scroll Handler ---
    const handleLetterClick = useCallback((letter: string) => {
        const element = document.getElementById(`section-${letter}`);
        if (element) {
            const headerOffset = 80; // Adjust based on any fixed header height
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        } else {
            console.warn(`Element with id 'section-${letter}' not found.`);
        }
    }, []);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gray-50 text-neutral-900 rounded-[3rem]"> {/* Slightly off-white bg */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 py-10 md:py-16">

                {/* Page Header */}
                <header className="mb-8 md:mb-12 text-center animate-fade-in">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                        Brands
                    </h1>
                    <p className="text-neutral-600 text-lg md:text-xl max-w-2xl mx-auto">
                        Explore the official pages for world-renowned brands available on our platform.
                    </p>
                </header>

                {/* Search Bar */}
                <div className="mb-10 md:mb-12 max-w-xl mx-auto relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <input
                        type="text"
                        placeholder="Search by brand name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-300 rounded-full text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 shadow-sm text-base" // Increased padding/size
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>

                {/* Layout: Sidebar + Main Content */}
                <div className="flex flex-row">

                    {/* Sticky Sidebar */}
                    <AlphabetSidebar letters={filteredAvailableLetters} onLetterClick={handleLetterClick} />

                    {/* Main Content Area */}
                    <main className="flex-1 md:pl-8 lg:pl-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="w-10 h-10 text-neutral-400 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="p-6 bg-red-100 border border-red-300 rounded-lg text-red-800 text-center">
                                <p className='font-medium'>Error loading brands</p>
                                <p className='text-sm mt-1'>{error}</p>
                                <button
                                    onClick={() => window.location.reload()} // Simple retry
                                    className="mt-4 px-4 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredAvailableLetters.length === 0 ? (
                            <div className="text-center py-16 text-neutral-500">
                                <h3 className='text-xl font-medium mb-2'>No brands found</h3>
                                {searchTerm ? (
                                      <p>Your search for &quot{searchTerm}&quot did not match any brands.</p>
                                ):(
                                     <p>There are currently no brands to display.</p>
                                )}

                            </div>
                        ) : (
                            // Render Filtered Brand Sections
                            <div className="space-y-12">
                                {filteredAvailableLetters.map((letter) => (
                                    <section key={letter} id={`section-${letter}`} className="scroll-mt-24"> {/* scroll-mt matches offset */}
                                        <h2 className="text-2xl sm:text-3xl font-semibold border-b border-neutral-200 pb-3 mb-5 text-neutral-800 tracking-tight">
                                            {letter}
                                        </h2>
                                        {/* Adjusted column count and styling */}
                                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-3">
                                            {(filteredGroupedBrands[letter] || []).map((brand) => (
                                                <li key={brand.slug}>
                                                    <Link
                                                        href={`/brands/${brand.slug}`}
                                                        className="block py-1 text-base text-neutral-700 hover:text-blue-600 focus:outline-none focus:text-blue-700 transition-colors duration-150"
                                                    >
                                                        {brand.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

             {/* Global Styles */}
            <style>{`
                html { scroll-behavior: smooth; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
                /* Improve focus visibility for accessibility */
                *:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; } /* Example blue ring */
            `}</style>
        </div>
    );
}