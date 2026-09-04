/**
 * UI Action Types
 * Defines all possible UI actions that can be triggered by the agent
 */

// Cart/Basket related actions
export const CART_ACTIONS = {
    SHOW_BASKET: 'show_basket',
    SHOW_ORDER_PAYMENT: 'show_order_payment',
    SHOW_ORDER_CONFIRMATION: 'show_order_confirmation',
    SHOW_ORDER_DETAILS: 'show_order_details',
} as const;

// Product related actions
export const PRODUCT_ACTIONS = {
    SHOW_PRODUCT_LIST: 'show_product_list',
    SHOW_PRODUCT_DETAILS: 'show_product_details',
} as const;

// All valid UI actions
export const UI_ACTIONS = {
    ...CART_ACTIONS,
    ...PRODUCT_ACTIONS,
} as const;

// Type for all possible UI action values
export type UIActionType = typeof UI_ACTIONS[keyof typeof UI_ACTIONS];

// UI Context structure returned by the agent
export interface UIContext {
    action: UIActionType;
    data?: any;
    tool_name?: string;
}