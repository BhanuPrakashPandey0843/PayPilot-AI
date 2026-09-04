import React, { useState } from 'react';
import Modal from './Modal';
import { Product } from '../types/models';

interface ProductDetailsModalProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
    onAddToBasket?: (productId: number, quantity: number) => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
    product,
    isOpen,
    onClose,
    onAddToBasket
}) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [isAdding, setIsAdding] = useState<boolean>(false);

    const handleAddToBasket = async () => {
        if (!onAddToBasket || isAdding) return;

        setIsAdding(true);
        try {
            onAddToBasket(product.id, quantity);
            setQuantity(1);
            onClose(); // Close modal after adding to basket
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

    // Get product attributes
    const attributes = product.product_attributes || {};

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="lg">
            <div className="space-y-6">
                {/* Product Image */}
                <div className="aspect-square w-full max-w-md mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={`${product.name} product image`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-100 to-purple-100">
                            <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                        <p className="text-gray-600 leading-relaxed">{product.description}</p>
                    </div>

                    {/* Price and Stock */}
                    <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
                        <div>
                            <span className="text-3xl font-bold text-green-600">
                                ${formatPrice(product.price)}
                            </span>
                        </div>
                        <div>
                            {isOutOfStock ? (
                                <span className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    Out of Stock
                                </span>
                            ) : isLowStock ? (
                                <span className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                    Only {product.inventory_quantity} left
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    {product.inventory_quantity} in stock
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Attributes */}
                    {Object.keys(attributes).length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(attributes).map(([key, value]) => {
                                    if (!value) return null; // Skip empty values

                                    const formatKey = (key: string) => {
                                        return key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                                    };

                                    const formatValue = (key: string, value: string) => {
                                        // Special formatting for specific attributes
                                        if (key === 'color') {
                                            return (
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: value.toLowerCase() }}
                                                        title={value}
                                                    ></div>
                                                    <span className="capitalize">{value}</span>
                                                </div>
                                            );
                                        }
                                        if (key === 'size') {
                                            return (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium uppercase">
                                                    {value}
                                                </span>
                                            );
                                        }
                                        if (key === 'category') {
                                            return (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-sm font-medium capitalize">
                                                    {value}
                                                </span>
                                            );
                                        }
                                        return <span className="capitalize font-semibold">{String(value)}</span>;
                                    };

                                    return (
                                        <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <dt className="text-sm font-medium text-gray-600 mb-2">
                                                {formatKey(key)}
                                            </dt>
                                            <dd className="text-base text-gray-900">
                                                {formatValue(key, String(value))}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add to Basket Section */}
                    {!isOutOfStock && onAddToBasket && (
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Add to Basket</h3>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                                        disabled={isAdding || quantity <= 1}
                                        aria-label="Decrease quantity"
                                        type="button"
                                    >
                                        −
                                    </button>
                                    <span className="px-6 py-3 text-lg font-bold text-gray-900 border-x-2 border-gray-300 min-w-[4rem] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.inventory_quantity, quantity + 1))}
                                        className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                                        disabled={isAdding || quantity >= product.inventory_quantity}
                                        aria-label="Increase quantity"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={handleAddToBasket}
                                    disabled={isAdding || isOutOfStock}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    {isAdding ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Adding to Basket...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Add {quantity} to Basket
                                        </span>
                                    )}
                                </button>
                            </div>

                            <p className="text-sm text-gray-500">
                                Total: <span className="font-semibold text-gray-900">${formatPrice(product.price * quantity)}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProductDetailsModal;
