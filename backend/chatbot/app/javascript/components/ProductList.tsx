import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types/models';

interface ProductListProps {
    products: Product[];
    onAddToBasket?: (productId: number, quantity: number) => void;
    compact?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ products, onAddToBasket, compact = true }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Handle empty state
    if (!products || products.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-gray-500 text-sm">No products found</p>
            </div>
        );
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollContainerRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Compact mode: horizontal scrollable carousel
    if (compact) {
        return (
            <div className="relative py-3">
                {/* Left Arrow */}
                {products.length > 1 && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all hover:scale-110"
                        aria-label="Scroll left"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-8 sm:px-10"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px]">
                            <ProductCard
                                product={product}
                                onAddToBasket={onAddToBasket}
                                compact={compact}
                            />
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                {products.length > 1 && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all hover:scale-110"
                        aria-label="Scroll right"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                {/* Hide scrollbar with CSS */}
                <style>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            </div>
        );
    }

    // Full mode: grid layout
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onAddToBasket={onAddToBasket}
                    compact={compact}
                />
            ))}
        </div>
    );
};

export default ProductList;
