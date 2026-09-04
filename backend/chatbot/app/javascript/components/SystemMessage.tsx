import React from 'react';
import ReactMarkdown from 'react-markdown';
import { UI_ACTIONS, type UIContext } from '../types/actions';
import ProductList from './ProductList';
import OrderPaymentButton from './OrderPaymentButton';
import OrderConfirmation from './OrderConfirmation';
import api from '../utils/api';
import { Product, Order } from '../types/models';

interface SystemMessageProps {
    content: string;
    timestamp: Date;
    uiContext?: UIContext;
    toolCall?: {
        toolName: string;
        uiDescriptor?: string;
    };
    onBasketUpdate?: () => void;
    onPaymentDone?: () => void;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ content, timestamp, uiContext, toolCall, onBasketUpdate, onPaymentDone }) => {

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleAddToBasket = async (productId: number, quantity: number) => {
        try {
            await api.baskets.addItem(productId, quantity);
            if (onBasketUpdate) {
                onBasketUpdate();
            }
        } catch (error: any) {
            console.error('Error adding to basket:', error);
            alert(error.message || 'Failed to add item to basket');
        }
    };



    const renderUIContent = () => {
        if (!uiContext) return null;

        switch (uiContext.action) {
            case UI_ACTIONS.SHOW_PRODUCT_LIST:
                if (uiContext.data?.products && Array.isArray(uiContext.data.products)) {
                    return (
                        <ProductList
                            products={uiContext.data.products as Product[]}
                            onAddToBasket={handleAddToBasket}
                        />
                    );
                }
                return null;

            case UI_ACTIONS.SHOW_PRODUCT_DETAILS:
                if (uiContext.data?.product) {
                    return (
                        <ProductList
                            products={[uiContext.data.product as Product]}
                            onAddToBasket={handleAddToBasket}
                        />
                    );
                }
                return null;

            case UI_ACTIONS.SHOW_ORDER_PAYMENT:
                if (uiContext.data?.order) {
                    return (
                        <OrderPaymentButton
                            order={uiContext.data.order as Order}
                            onPaymentDone={onPaymentDone}
                        />
                    );
                }
                return null;

            case UI_ACTIONS.SHOW_ORDER_CONFIRMATION:
                if (uiContext.data?.order) {
                    return (
                        <div className="mt-3">
                            <OrderConfirmation
                                order={uiContext.data.order as Order}
                            />
                        </div>
                    );
                }
                return null;

            default:
                return null;
        }
    };

    return (
        <div className="flex justify-start animate-slideInLeft">
            <div className="max-w-[85%] sm:max-w-[80%]">
                <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-md hover:shadow-lg transition-shadow">
                    {content ? (
                        <div className="text-sm prose prose-sm max-w-none">
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => <p className="whitespace-pre-wrap break-words my-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="ml-2 block">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                                    code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                                    a: ({ href, children }) => (
                                        <a href={href} className="text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded" target="_blank" rel="noopener noreferrer">
                                            {children}
                                        </a>
                                    ),
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 py-1" role="status" aria-label="Assistant is thinking">
                            <div className="flex space-x-1">
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                                {toolCall?.uiDescriptor || "Thinking..."}
                            </span>
                        </div>
                    )}
                </div>

                {/* Render UI content if available */}
                {renderUIContent()}

                <div className="mt-1.5 text-xs text-gray-500">
                    <time dateTime={timestamp.toISOString()}>{formatTime(timestamp)}</time>
                </div>
            </div>
        </div>
    );
};

export default SystemMessage;
