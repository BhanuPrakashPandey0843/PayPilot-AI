import React, { useState } from 'react';
import { Product } from '../types/models';
import ProductDetailsModal from './ProductDetailsModal';

interface ProductCardProps {
    product: Product;
    onAddToBasket?: (productId: number, quantity: number) => void;
    compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToBasket, compact = false }) => {
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [quantity, setQuantity] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const handleAddToBasket = async () => {
        if (!onAddToBasket || isAdding) return;

        setIsAdding(true);
        try {
            onAddToBasket(product.id, quantity);
            setQuantity(1);
        } catch (error) {
            console.error('Error adding to basket:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const formatPrice = (price: number): string => {
        return `${Number(price).toFixed(2)}`;
    };

    const isOutOfStock = product.inventory_quantity === 0;
    const isLowStock = product.inventory_quantity > 0 && product.inventory_quantity <= 5;

    // Compact version for chat interface
    if (compact) {
        return (
            <>
                <article
                    className="group bg-white border-2 border-gray-200 rounded-2xl overflow-hidden flex flex-col sm:flex-row gap-4 p-4 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 w-full transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                >
                    {/* Compact Image */}
                    <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 w-full sm:w-24 h-36 sm:h-24 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={`${product.name} product image`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-100 to-purple-100">
                                <svg className="w-12 sm:w-8 h-12 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Compact Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div>
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-blue-600 transition-colors duration-200">{product.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-baseline space-x-1">
                                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent" aria-label={`Price: ${formatPrice(product.price)}`}>
                                    ${formatPrice(product.price)}
                                </span>
                            </div>
                            <div className="text-xs">
                                {isOutOfStock ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold border border-red-200" role="status">
                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                                        Out of Stock
                                    </span>
                                ) : isLowStock ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold border border-orange-200" role="status">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                                        {product.inventory_quantity} left
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold border border-green-200" role="status">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        In Stock
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Compact Add to Basket */}
                        {!isOutOfStock && onAddToBasket && (
                            <div className="flex items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 shadow-sm">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setQuantity(Math.max(1, quantity - 1));
                                        }}
                                        className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold focus:outline-none focus:bg-gray-100"
                                        disabled={isAdding || quantity <= 1}
                                        aria-label="Decrease quantity"
                                        type="button"
                                    >
                                        −
                                    </button>
                                    <span className="px-3 py-2 text-sm font-bold text-gray-900 border-x-2 border-gray-300 min-w-[3rem] text-center bg-white" aria-label={`Quantity: ${quantity}`}>
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setQuantity(Math.min(product.inventory_quantity, quantity + 1));
                                        }}
                                        className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold focus:outline-none focus:bg-gray-100"
                                        disabled={isAdding || quantity >= product.inventory_quantity}
                                        aria-label="Increase quantity"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToBasket();
                                    }}
                                    disabled={isAdding || isOutOfStock}
                                    aria-label={`Add ${quantity} ${product.name} to basket`}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
                                >
                                    {isAdding ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Adding...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Add to Basket
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </article>

                {/* Product Details Modal */}
                <ProductDetailsModal
                    product={product}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onAddToBasket={onAddToBasket}
                />
            </>
        );
    }

    // Full version
    return (
        <>
            <div
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="bg-gray-100 h-48 flex items-center justify-center">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">{product.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">${formatPrice(product.price)}</span>
                        <div className="text-sm">
                            {isOutOfStock ? (
                                <span className="text-red-600 font-medium">Out of Stock</span>
                            ) : isLowStock ? (
                                <span className="text-orange-600 font-medium">Only {product.inventory_quantity} left</span>
                            ) : (
                                <span className="text-green-600 font-medium">In Stock</span>
                            )}
                        </div>
                    </div>
                    {!isOutOfStock && onAddToBasket && (
                        <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuantity(Math.max(1, quantity - 1));
                                    }}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                                    disabled={isAdding || quantity <= 1}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max={product.inventory_quantity}
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setQuantity(Math.min(Math.max(1, val), product.inventory_quantity));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 text-center border-x border-gray-300 py-1 focus:outline-none"
                                    disabled={isAdding}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setQuantity(Math.min(product.inventory_quantity, quantity + 1));
                                    }}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                                    disabled={isAdding || quantity >= product.inventory_quantity}
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToBasket();
                                }}
                                disabled={isAdding || isOutOfStock}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                            >
                                {isAdding ? 'Adding...' : 'Add to Basket'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Details Modal */}
            <ProductDetailsModal
                product={product}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToBasket={onAddToBasket}
            />
        </>
    );
};

export default ProductCard;
