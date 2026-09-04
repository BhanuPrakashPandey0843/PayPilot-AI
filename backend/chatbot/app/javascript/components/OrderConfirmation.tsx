import React from 'react';
import type { Order } from '../types/models';

interface OrderConfirmationProps {
    order: Order;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order }) => {
    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            {/* Success Header */}
            <div className="flex items-center mb-2">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <p className="font-semibold text-green-900">Order Confirmed!</p>
                    <p className="text-xs text-green-700">{order.order_number}</p>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded p-2 mb-2">
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs py-1">
                        <span className="text-gray-700">{item.quantity}× {item.product_name}</span>
                        <span className="font-medium text-gray-900">${Number(item.line_total).toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 mt-1 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${Number(order.total_amount).toFixed(2)}</span>
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center text-xs text-green-700">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Payment successful • Order confirmed
            </div>
        </div>
    );
};

export default OrderConfirmation;
