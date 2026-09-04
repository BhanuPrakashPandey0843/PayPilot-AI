import React, { useEffect, useRef } from 'react';
import UserMessage from './UserMessage';
import SystemMessage from './SystemMessage';
import { Message } from '../types/message';

interface MessageListProps {
    messages: Message[];
    onBasketUpdate?: () => void;
    onPaymentDone?: () => void;
    onSendMessage?: (message: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onBasketUpdate, onPaymentDone, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle empty state
    if (messages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center max-w-md animate-fadeIn">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl">
                            <svg
                                className="h-12 w-12 text-white animate-bounce"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Start a conversation
                    </h3>
                    <p className="text-base text-gray-600 mb-8 leading-relaxed">
                        Ask me to help you find products, manage your basket, or complete your order
                    </p>
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Try asking:</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={() => onSendMessage?.('Show me red shirts')}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                                aria-label="Send message: Show me red shirts"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                "Show me red shirts"
                            </button>
                            <button
                                onClick={() => onSendMessage?.("What's in my basket?")}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-95"
                                aria-label="Send message: What's in my basket?"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                "What's in my basket?"
                            </button>
                            <button
                                onClick={() => onSendMessage?.('Add 2 blue t-shirts')}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 active:scale-95"
                                aria-label="Send message: Add 2 blue t-shirts"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                "Add 2 blue t-shirts"
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-gradient-to-b from-gray-50 to-white" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.map((message, index) => (
                <div key={message.id} className={`transform transition-all duration-300 ${index === messages.length - 1 ? 'animate-slideUp' : ''}`}>
                    {message.role === 'user' ? (
                        <UserMessage
                            content={message.content}
                            timestamp={message.timestamp}
                        />
                    ) : (
                        <SystemMessage
                            content={message.content}
                            timestamp={message.timestamp}
                            uiContext={message.uiContext}
                            toolCall={message.toolCall}
                            onBasketUpdate={onBasketUpdate}
                            onPaymentDone={onPaymentDone}
                        />
                    )}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
