/**
 * API Client Utility
 * Handles all API communication with the backend
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getSessionId } from './session';
import type { UIContext } from '../types/actions';
import type {
    Product,
    Basket,
    Order,
    Conversation,
    PaginationParams,
    ProductSearchParams,
    WebhookResponse,
    PaymentMetadata,
} from '../types/models';

const API_BASE_URL = '/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    status: number;
    data: any;

    constructor(message: string, status: number, data: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Delays execution for a specified time
 */
const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wraps a fetch request with a timeout
 */
const fetchWithTimeout = async (
    url: string,
    options: RequestInit & { timeout?: number } = {}
): Promise<Response> => {
    const { timeout = REQUEST_TIMEOUT } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

/**
 * Makes a fetch request with error handling and retry logic
 */
const fetchWithRetry = async <T>(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
): Promise<T> => {
    try {
        const response = await fetchWithTimeout(url, options);

        // Parse response
        let data: any;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Handle error responses
        if (!response.ok) {
            throw new ApiError(
                data.error || data.message || `HTTP ${response.status}`,
                response.status,
                data
            );
        }

        return data as T;
    } catch (error: any) {
        // Retry on network errors or 5xx server errors
        const isNetworkError = error.name === 'TypeError';
        const isServerError = error.status >= 500 && error.status < 600;

        const shouldRetry = retryCount < MAX_RETRIES && (isNetworkError || isServerError);

        if (shouldRetry) {
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return fetchWithRetry<T>(url, options, retryCount + 1);
        }

        throw error;
    }
};

/**
 * Gets the CSRF token from the meta tag in the document head
 * 
 * @returns {string|null} The CSRF token or null if not found
 */
const getCsrfToken = () => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
};

/**
 * Makes an API request with session ID and CSRF token
 */
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const csrfToken = getCsrfToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    const finalOptions: RequestInit = {
        ...options,
        headers,
    };

    return fetchWithRetry<T>(url, finalOptions);
};

/**
 * API Client object with methods for each endpoint
 */
const api = {
    // Products endpoints
    products: {
        /**
         * Get all products with optional pagination
         */
        list: (params: PaginationParams = {}): Promise<Product[]> => {
            const queryString = new URLSearchParams(params as any).toString();
            const endpoint = queryString ? `/products?${queryString}` : '/products';
            return apiRequest<Product[]>(endpoint);
        },

        /**
         * Get a single product by ID
         */
        get: (id: number): Promise<Product> => {
            return apiRequest<Product>(`/products/${id}`);
        },

        /**
         * Search products with filters
         */
        search: (params: ProductSearchParams = {}): Promise<Product[]> => {
            const queryString = new URLSearchParams(params as any).toString();
            return apiRequest<Product[]>(`/products/search?${queryString}`);
        },
    },

    // Baskets endpoints
    baskets: {
        /**
         * Get current basket
         */
        get: (): Promise<Basket> => {
            const sessionId = getSessionId();
            return apiRequest<Basket>(`/baskets/${sessionId}`);
        },

        /**
         * Add item to basket
         */
        addItem: (productId: number, quantity: number = 1): Promise<Basket> => {
            const sessionId = getSessionId();
            return apiRequest<Basket>(`/baskets/${sessionId}/items`, {
                method: 'POST',
                body: JSON.stringify({ product_id: productId, quantity }),
            });
        },

        /**
         * Update item quantity in basket
         */
        updateItem: (productId: number, quantity: number): Promise<Basket> => {
            const sessionId = getSessionId();
            return apiRequest<Basket>(`/baskets/${sessionId}/items/${productId}`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity }),
            });
        },

        /**
         * Remove item from basket
         */
        removeItem: (productId: number, quantity?: number): Promise<Basket> => {
            const sessionId = getSessionId();
            let url = `/baskets/${sessionId}/items/${productId}`;
            if (quantity) {
                url = `${url}?quantity=${quantity}`;
            }
            return apiRequest<Basket>(url, {
                method: 'DELETE',
            });
        },

        /**
         * Clear entire basket
         */
        clear: (): Promise<Basket> => {
            const sessionId = getSessionId();
            return apiRequest<Basket>(`/baskets/${sessionId}`, {
                method: 'DELETE',
            });
        },
    },

    // Orders endpoints
    orders: {
        /**
         * Create order from basket
         */
        create: async (): Promise<Order> => {
            const sessionId = getSessionId();

            const response = await apiRequest<{ message: string; order: Order }>('/orders', {
                method: 'POST',
                body: JSON.stringify({ session_id: sessionId }),
            });
            return response.order;
        },

        /**
         * Get order by order number
         */
        get: (orderNumber: string): Promise<Order> => {
            return apiRequest<Order>(`/orders/${orderNumber}`);
        },
    },

    // Conversations endpoints
    conversations: {
        /**
         * Create a new conversation
         */
        create: (): Promise<Conversation> => {
            const sessionId = getSessionId();
            return apiRequest<Conversation>('/conversations', {
                method: 'POST',
                body: JSON.stringify({ session_id: sessionId }),
            });
        },

        /**
         * Get a conversation by ID
         */
        get: (conversationId: number): Promise<Conversation> => {
            return apiRequest<Conversation>(`/conversations/${conversationId}`);
        },

        /**
         * Send a message and receive streaming response via SSE
         */
        sendMessage: (
            conversationId: number,
            message: string,
            onContent: (content: string) => void,
            onUIContext: (uiContext: UIContext) => void,
            onToolCall: (toolName: string, uiDescriptor?: string) => void,
            onDone: () => void,
            onError: (error: string) => void
        ): (() => void) => {
            const sessionId = getSessionId();
            const url = `${API_BASE_URL}/conversations/${conversationId}/messages`;
            const csrfToken = getCsrfToken();

            const ctrl = new AbortController();

            fetchEventSource(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
                },
                body: JSON.stringify({ message, session_id: sessionId }),
                signal: ctrl.signal,
                onopen: async (response) => {
                    if (!response.ok) {
                        const error = await response.text();
                        throw new Error(`HTTP ${response.status}: ${error}`);
                    }
                },
                onmessage: (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        switch (event.event) {
                            case 'content':
                                if (data.content) {
                                    onContent(data.content);
                                }
                                break;
                            case 'tool_call':
                                if (data.tool_name) {
                                    onToolCall(data.tool_name, data.ui_descriptor);
                                }
                                break;
                            case 'render_ui':
                                if (data.ui_context) {
                                    onUIContext(data.ui_context);
                                }
                                break;
                            case 'done':
                                onDone();
                                ctrl.abort();
                                break;
                            case 'error':
                                onError(data.error || 'An error occurred');
                                ctrl.abort();
                                break;
                        }
                    } catch (error) {
                        console.error('Error parsing SSE message:', error);
                    }
                },
                onerror: (error) => {
                    console.error('SSE error:', error);
                    onError('Connection error occurred');
                    throw error;
                },
            });

            // Return cleanup function
            return () => {
                ctrl.abort();
            };
        },

    },

    // Webhook endpoints (for testing/mocking payment provider)
    webhooks: {
        /**
         * Successful payment webhook
         */
        paymentSuccess: (
            paymentId: string,
            amount: number,
            method: string,
            metadata: PaymentMetadata
        ): Promise<WebhookResponse> => {
            return apiRequest<WebhookResponse>('/webhooks/payments', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'payment.succeeded',
                    payment_id: paymentId,
                    amount,
                    method,
                    metadata
                }),
            });
        },

        /**
         * Simulate a failed payment webhook
         */
        paymentFailure: (
            paymentId: string,
            amount: number,
            method: string,
            metadata: PaymentMetadata
        ): Promise<WebhookResponse> => {
            return apiRequest<WebhookResponse>('/webhooks/payments', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'payment.failed',
                    payment_id: paymentId,
                    amount,
                    method,
                    metadata
                }),
            });
        },
    },
};

export default api;
