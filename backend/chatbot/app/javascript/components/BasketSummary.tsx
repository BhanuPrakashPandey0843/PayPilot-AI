import React, { useState } from 'react';
import BasketItem from './BasketItem';
import OrderPayment from './OrderPayment';
import OrderConfirmation from './OrderConfirmation';
import Modal from './Modal';
import api from '../utils/api';
import type { Basket, Order } from '../types/models';

interface BasketSummaryProps {
    basket: Basket | null;
    isLoading: boolean;
    onBasketUpdate: () => void;
}

const BasketSummary: React.FC<BasketSummaryProps> = ({ basket, isLoading, onBasketUpdate }) => {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        setCheckoutError(null);

        try {
            // Create order from basket
            const order = await api.orders.create();
            setCurrentOrder(order);
            setIsPaymentModalOpen(true);
        } catch (error: any) {
            console.error('Checkout error:', error);
            setCheckoutError(error.message || 'Failed to create order. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handlePaymentSuccess = (paymentId: string) => {
        console.log('Payment successful:', paymentId);
        setIsPaymentModalOpen(false);
        setIsConfirmationModalOpen(true);
    };

    const handlePaymentFailure = (error: string) => {
        console.error('Payment failed:', error);
        setIsPaymentModalOpen(false);
        setCheckoutError('Payment failed. Please try again.');
    };

    const handleConfirmationClose = () => {
        setIsConfirmationModalOpen(false);
        setCurrentOrder(null);
        onBasketUpdate();
    };
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Basket</h2>
                </div>
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-200">
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!basket || basket.items.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Basket</h2>
                </div>
                <div className="text-center py-12 animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                        <svg
                            className="h-10 w-10 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    </div>
                    <p className="text-base font-semibold text-gray-900 mb-1">Your basket is empty</p>
                    <p className="text-sm text-gray-500">
                        Start shopping by asking the assistant to find products
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Your Basket</h2>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {basket.item_count} {basket.item_count === 1 ? 'item' : 'items'}
                </span>
            </div>

            {/* Basket Items */}
            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin" role="list" aria-label="Basket items">
                {basket.items.map((item) => (
                    <BasketItem
                        key={item.product_id}
                        item={item}
                        onUpdate={onBasketUpdate}
                    />
                ))}
            </div>

            {/* Total Section */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 -mx-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Subtotal</span>
                    <span className="text-2xl font-bold text-gray-900">
                        ${Number(basket.total).toFixed(2)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 text-right">
                    Tax and shipping calculated at checkout
                </p>
            </div>

            {/* Error Message */}
            {checkoutError && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm animate-slideDown" role="alert">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-800 font-medium">{checkoutError}</p>
                    </div>
                </div>
            )}

            {/* Checkout Button */}
            <div className="mt-6">
                <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    aria-label="Proceed to checkout"
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-200 font-bold text-lg disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isCheckingOut ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Creating Order...
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Proceed to Checkout
                        </>
                    )}
                </button>
            </div>

            {/* Payment Modal */}
            {currentOrder && (
                <Modal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    title="Complete Payment"
                    size="lg"
                >
                    <OrderPayment
                        order={currentOrder}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentFailure={handlePaymentFailure}
                        onCancel={() => setIsPaymentModalOpen(false)}
                    />
                </Modal>
            )}

            {/* Order Confirmation Modal */}
            {currentOrder && (
                <Modal
                    isOpen={isConfirmationModalOpen}
                    onClose={handleConfirmationClose}
                    title="Order Confirmed"
                    size="md"
                >
                    <div className="space-y-4">
                        <OrderConfirmation order={currentOrder} />
                        <button
                            onClick={handleConfirmationClose}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default BasketSummary;
