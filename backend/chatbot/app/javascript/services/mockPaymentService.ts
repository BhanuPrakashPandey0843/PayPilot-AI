/**
 * Mock Payment Service
 * Simulates a payment provider and calls webhooks directly
 */

import api from '../utils/api';
import { PaymentMetadata } from '../types/models';

export interface PaymentMethod {
    type: 'credit_card' | 'debit_card' | 'paypal';
    brand?: string;
}

export interface PaymentResult {
    success: boolean;
    paymentId: string;
    message: string;
    error?: string;
}

/**
 * Generates a random payment ID
 */
const generatePaymentId = (): string => {
    return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Simulates payment processing delay
 */
const simulateProcessingDelay = (ms: number = 2000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock Payment Service
 * Simulates payment processing and triggers webhooks
 */
class MockPaymentService {
    /**
     * Process a payment
     * @param metadata - Metadata related to payment, for eg - order_id
     * @param amount - The payment amount
     * @param paymentMethod - The payment method details
     * @param shouldFail - Force payment to fail (for testing)
     * @returns Payment result
     */
    async processPayment(
        metadata: PaymentMetadata,
        amount: number,
        paymentMethod: PaymentMethod,
        shouldFail: boolean = false
    ): Promise<PaymentResult> {
        const paymentId = generatePaymentId();

        // Simulate processing delay
        await simulateProcessingDelay(1000);

        try {
            if (shouldFail) {
                // Trigger failure webhook
                await api.webhooks.paymentFailure(
                    paymentId,
                    amount,
                    paymentMethod.type,
                    metadata
                );

                return {
                    success: false,
                    paymentId,
                    message: 'Payment declined',
                    error: 'Your payment was declined. Please try a different payment method.',
                };
            }

            // Trigger success webhook
            await api.webhooks.paymentSuccess(
                paymentId,
                amount,
                paymentMethod.type,
                metadata
            );

            return {
                success: true,
                paymentId,
                message: 'Payment processed successfully',
            };
        } catch (error: any) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                paymentId,
                message: 'Payment processing failed',
                error: error.message || 'An unexpected error occurred during payment processing.',
            };
        }
    }

    /**
     * Get available payment methods (mock)
     * @returns List of available payment methods
     */
    getAvailablePaymentMethods(): PaymentMethod[] {
        return [
            { type: 'credit_card', brand: 'Visa' },
            { type: 'debit_card', brand: 'Mastercard' },
            { type: 'paypal' },
        ];
    }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();
export default mockPaymentService;
