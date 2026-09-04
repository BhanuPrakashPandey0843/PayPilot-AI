/**
 * API Type Definitions
 */
import type { UIContext } from './actions';

export interface ProductAttributes {
    color?: string;
    size?: string;
    category?: string;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    inventory_quantity: number;
    image_url?: string;
    product_attributes: ProductAttributes;
}

export interface BasketItem {
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    line_total: number;
}

export interface Basket {
    session_id: string;
    items: BasketItem[];
    total: number;
    item_count: number;
}

export interface OrderItem {
    product_name: string;
    quantity: number;
    price: number;
    line_total: number;
}

export interface Order {
    order_number: string;
    total_amount: number;
    status: string;
    items: OrderItem[];
    created_at: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    ui_context?: UIContext;
}

export interface Conversation {
    id: number;
    session_id: string;
    messages: ConversationMessage[];
    message_count: number,
    created_at: string;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
}

export interface ProductSearchParams extends PaginationParams {
    query?: string;
    color?: string;
    size?: string;
    min_price?: number;
    max_price?: number;
}

export interface PaymentMetadata {
    order_number:string;
    conversation_id?: number;
}

export interface WebhookResponse {
    status: string;
}

export interface ApiErrorData {
    error?: string;
    message?: string;
    [key: string]: any;
}
