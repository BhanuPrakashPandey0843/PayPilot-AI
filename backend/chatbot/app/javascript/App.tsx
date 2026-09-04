import React, { useState, useEffect } from 'react';
import { getSessionId } from './utils/session';
import api from './utils/api';
import type { Basket } from './types/models';
import ChatInterface from './components/ChatInterface';
import BasketSummary from './components/BasketSummary';

const App: React.FC = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [basket, setBasket] = useState<Basket | null>(null);
    const [isLoadingBasket, setIsLoadingBasket] = useState<boolean>(false);

    // Initialize session on mount
    useEffect(() => {
        const session = getSessionId();
        setSessionId(session);
    }, []);

    // Fetch basket data
    const fetchBasket = async () => {
        if (!sessionId) return;

        setIsLoadingBasket(true);
        try {
            const basketData = await api.baskets.get();
            setBasket(basketData);
        } catch (error) {
            console.error('Error fetching basket:', error);
            // Initialize empty basket on error
            setBasket({
                session_id: sessionId,
                items: [],
                total: 0,
                item_count: 0,
            });
        } finally {
            setIsLoadingBasket(false);
        }
    };

    // Fetch basket when session is initialized
    useEffect(() => {
        if (sessionId) {
            fetchBasket();
        }
    }, [sessionId]);

    // Handler to refresh basket (called by child components)
    const handleBasketUpdate = () => {
        fetchBasket();
    };

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-700 font-medium text-lg">Initializing session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <header className="mb-6 sm:mb-8 animate-fadeIn">
                    <div className="flex items-center space-x-4 mb-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Conversational Checkout
                            </h1>
                            <p className="mt-1 text-base sm:text-lg text-gray-600 font-medium">
                                Chat with our AI assistant to find products and complete your purchase
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 sm:gap-8 animate-slideUp">
                    {/* Chat interface */}
                    <div className="lg:col-span-4">
                        <ChatInterface
                            sessionId={sessionId}
                            onBasketUpdate={handleBasketUpdate}
                        />
                    </div>

                    {/* Basket summary */}
                    <div className="lg:col-span-2">
                        <div className="lg:sticky lg:top-6">
                            <BasketSummary
                                basket={basket}
                                isLoading={isLoadingBasket}
                                onBasketUpdate={handleBasketUpdate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
