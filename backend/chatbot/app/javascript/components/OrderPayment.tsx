import React, { useState } from 'react';
import type { Order, PaymentMetadata } from '../types/models';
import { mockPaymentService, type PaymentMethod, type PaymentResult } from '../services/mockPaymentService';
import { useConversation } from '../contexts/ConversationContext';

interface OrderPaymentProps {
    order: Order;
    onPaymentSuccess: (paymentId: string) => void;
    onPaymentFailure: (error: string) => void;
    onCancel?: () => void;
}

const OrderPayment: React.FC<OrderPaymentProps> = ({
    order,
    onPaymentSuccess,
    onPaymentFailure,
    onCancel,
}) => {
    const { conversationId } = useConversation();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod['type']>('credit_card');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forceFailure, setForceFailure] = useState<boolean>(false);

    const paymentMethods = mockPaymentService.getAvailablePaymentMethods();

    const handlePayment = async () => {
        setIsProcessing(true);
        setError(null);

        const paymentMethod: PaymentMethod = {
            type: selectedMethod,
            ...(selectedMethod !== 'paypal' && {
                brand: selectedMethod === 'credit_card' ? 'Visa' : 'Mastercard',
            }),
        };

        try {
            const metadata: PaymentMetadata = {
                order_number: order.order_number,
                ...(conversationId !== null && { conversation_id: conversationId }),
            };
            const result: PaymentResult = await mockPaymentService.processPayment(
                metadata,
                order.total_amount,
                paymentMethod,
                forceFailure
            );

            if (result.success) {
                onPaymentSuccess(result.paymentId);
            } else {
                setError(result.error || 'Payment failed');
                onPaymentFailure(result.error || 'Payment failed');
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            const errorMsg = err.message || 'An unexpected error occurred';
            setError(errorMsg);
            onPaymentFailure(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
        switch (type) {
            case 'credit_card':
            case 'debit_card':
                return (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                    </svg>
                );
            case 'paypal':
                return (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.68H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z" />
                        <path d="M2.379 0C1.94 0 1.6.358 1.549.79L.05 11.625a.783.783 0 00.774.906h4.147l1.04-6.594L5.96 6.5h3.464c3.018 0 5.274.614 6.534 2.126a4.171 4.171 0 011.004 1.852c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.68H3.615a.483.483 0 01-.477-.558l2.995-18.99A.783.783 0 016.907 4h13.716a.783.783 0 01.774.906l-2.995 18.99a.483.483 0 01-.477.558h-4.347a.805.805 0 01-.794-.68l-.028-.15-.63-3.993-.04-.22a.805.805 0 00-.794-.68h-.5c-3.238 0-5.774-1.314-6.514-5.12-.256-1.313-.192-2.447.3-3.327z" />
                    </svg>
                );
        }
    };

    const getPaymentMethodLabel = (method: PaymentMethod) => {
        switch (method.type) {
            case 'credit_card':
                return `Credit Card ${method.brand ? `(${method.brand})` : ''}`;
            case 'debit_card':
                return `Debit Card ${method.brand ? `(${method.brand})` : ''}`;
            case 'paypal':
                return 'PayPal';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Payment</h2>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Order Number</span>
                    <span className="text-sm font-medium text-gray-900">{order.order_number}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">Amount Due</span>
                    <span className="text-2xl font-bold text-gray-900">
                        ${Number(order.total_amount).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Payment Method
                </label>
                <div className="space-y-3">
                    {paymentMethods.map((method) => (
                        <label
                            key={method.type}
                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedMethod === method.type
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={method.type}
                                checked={selectedMethod === method.type}
                                onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod['type'])}
                                className="sr-only"
                                disabled={isProcessing}
                            />
                            <div className="flex items-center flex-1">
                                <div className={`mr-3 ${selectedMethod === method.type ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {getPaymentMethodIcon(method.type)}
                                </div>
                                <span className="font-medium text-gray-900">
                                    {getPaymentMethodLabel(method)}
                                </span>
                            </div>
                            {selectedMethod === method.type && (
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            {/* Testing Controls (for demo purposes) */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-sm text-yellow-800 font-medium mb-2">
                            Demo Mode - Testing Controls
                        </p>
                        <label className="flex items-center text-sm text-yellow-700">
                            <input
                                type="checkbox"
                                checked={forceFailure}
                                onChange={(e) => setForceFailure(e.target.checked)}
                                disabled={isProcessing}
                                className="mr-2 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                            />
                            Force payment failure (for testing)
                        </label>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {/* Security Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-800">
                        Your payment information is secure and encrypted.
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isProcessing ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
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
                            Processing Payment...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pay ${Number(order.total_amount).toFixed(2)}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OrderPayment;
