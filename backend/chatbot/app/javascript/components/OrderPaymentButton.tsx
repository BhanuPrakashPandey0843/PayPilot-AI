import React, { useState } from 'react';
import type { Order } from '../types/models';
import OrderPayment from './OrderPayment';
import Modal from './Modal';

interface OrderPaymentButtonProps {
    order: Order;
    onPaymentDone?: () => void;
}

const OrderPaymentButton: React.FC<OrderPaymentButtonProps> = ({ order, onPaymentDone }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);

    const handlePaymentSuccess = (paymentId: string) => {
        console.log('Payment successful:', paymentId);
        setPaymentCompleted(true);
        setIsModalOpen(false);
        if (onPaymentDone) {
            onPaymentDone();
        }
        alert('Payment successful!');
    };

    const handlePaymentFailure = (error: string) => {
        console.error('Payment failed:', error);
        setIsModalOpen(false);
        if (onPaymentDone) {
            onPaymentDone();
        }
        alert('Payment failed!');
    };

    return (
        <>
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-900">
                            Payment Required: ${Number(order.total_amount).toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={paymentCompleted}
                        className={`px-4 py-2 text-white text-sm rounded-lg transition-colors font-medium ${paymentCompleted
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {paymentCompleted ? 'Payment Completed' : 'Pay Now'}
                    </button>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Complete Payment"
                size="lg"
            >
                <OrderPayment
                    order={order}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentFailure={handlePaymentFailure}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </>
    );
};

export default OrderPaymentButton;
