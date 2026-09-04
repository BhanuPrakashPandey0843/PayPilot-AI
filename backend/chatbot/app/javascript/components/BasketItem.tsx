import React, { useState } from 'react';
import type { BasketItem as BasketItemType } from '../types/models';
import api from '../utils/api';

interface BasketItemProps {
    item: BasketItemType;
    onUpdate: () => void;
}

const BasketItem: React.FC<BasketItemProps> = ({ item, onUpdate }) => {
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isRemoving, setIsRemoving] = useState<boolean>(false);

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 0 || isUpdating) return;

        setIsUpdating(true);
        try {
            await api.baskets.updateItem(item.product_id, newQuantity);
            onUpdate();
        } catch (error) {
            console.error('Error updating quantity:', error);
            // TODO: Show error message to user
        } finally {
            setIsUpdating(false);
        }
    };

    const handleIncrement = () => {
        handleQuantityChange(item.quantity + 1);
    };

    const handleDecrement = () => {
        if (item.quantity > 0) {
            handleQuantityChange(item.quantity - 1);
        }
    };

    const handleRemove = async () => {
        if (isRemoving) return;

        setIsRemoving(true);
        try {
            await api.baskets.removeItem(item.product_id);
            onUpdate();
        } catch (error) {
            console.error('Error removing item:', error);
            // TODO: Show error message to user
        } finally {
            setIsRemoving(false);
        }
    };

    const formatPrice = (price: number): string => {
        return Number(price).toFixed(2);
    };

    const isDisabled = isUpdating || isRemoving;

    return (
        <div className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0">
            {/* Item Details */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                    {item.product_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    ${formatPrice(item.price)} each
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                            onClick={handleDecrement}
                            disabled={isDisabled || item.quantity < 1}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-gray-900 border-x border-gray-300 min-w-[2.5rem] text-center">
                            {item.quantity}
                        </span>
                        <button
                            onClick={handleIncrement}
                            disabled={isDisabled}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={handleRemove}
                        disabled={isDisabled}
                        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Remove item"
                    >
                        {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                </div>
            </div>

            {/* Line Total */}
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                    ${formatPrice(item.line_total)}
                </p>
                {isUpdating && (
                    <p className="text-xs text-gray-500 mt-1">Updating...</p>
                )}
            </div>
        </div>
    );
};

export default BasketItem;
