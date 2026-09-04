import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Message } from '../types/message';
import { UI_ACTIONS, type UIContext } from '../types/actions';
import { ConversationProvider } from '../contexts/ConversationContext';

interface ChatInterfaceProps {
    sessionId: string;
    onBasketUpdate: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId, onBasketUpdate }) => {
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Create conversation on mount
    useEffect(() => {
        const createConversation = async () => {
            try {
                const conversation = await api.conversations.create();
                setConversationId(conversation.id);
            } catch (err: any) {
                console.error('Error creating conversation:', err);
                setError('Failed to start conversation. Please refresh the page.');
            }
        };

        createConversation();
    }, []);

    // Handle sending a message
    const handleSendMessage = async (messageText: string) => {
        if (!conversationId || !messageText.trim()) return;

        // Add user message to the list
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        // Create assistant message placeholder
        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        let accumulatedContent = '';

        // Cleanup previous SSE connection if exists
        if (cleanupRef.current) {
            cleanupRef.current();
        }

        // Send message and handle streaming response
        const cleanup = api.conversations.sendMessage(
            conversationId,
            messageText,
            // onContent
            (content: string) => {
                accumulatedContent += content;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedContent, toolCall: undefined }
                            : msg
                    )
                );
            },
            // onUIContext
            (uiContext: UIContext) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, uiContext }
                            : msg
                    )
                );
                // Refresh basket if UI context suggests basket changes
                if (uiContext.action === UI_ACTIONS.SHOW_BASKET) {
                    onBasketUpdate();
                }
            },
            // onToolCall
            (toolName: string, uiDescriptor?: string) => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, toolCall: { toolName, uiDescriptor } }
                            : msg
                    )
                );
            },
            // onDone
            () => {
                setIsLoading(false);
                cleanupRef.current = null;
            },
            // onError
            (errorMessage: string) => {
                setError(errorMessage);
                setIsLoading(false);
                // Remove the empty assistant message on error
                setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
                cleanupRef.current = null;
            }
        );

        cleanupRef.current = cleanup;
    };

    // Handle starting a new conversation
    const handleNewConversation = async () => {
        try {
            // Create new conversation
            const conversation = await api.conversations.create();
            setConversationId(conversation.id);
            setMessages([]);
            setError(null);
        } catch (err: any) {
            console.error('Error starting new conversation:', err);
            setError('Failed to start new conversation. Please try again.');
        }
    };

    const onPaymentDone = async () => {
        if (onBasketUpdate) {
            onBasketUpdate();
        }

        if (!conversationId) return;

        let conversation = await api.conversations.get(conversationId);
        let lastMessage = conversation.messages[conversation.messages.length - 1];
        if (lastMessage.role === 'assistant' && messages[messages.length - 1].content != lastMessage.content) {
            let assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: lastMessage.content,
                timestamp: new Date(),
            };
            if (lastMessage.ui_context) {
                assistantMessage.uiContext = lastMessage.ui_context;
            }
            setMessages(prev => [...prev, assistantMessage]);
        }
    }

    if (!conversationId) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6" role="status" aria-live="polite">
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 font-medium">Starting conversation...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ConversationProvider conversationId={conversationId}>
            <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px] md:h-[calc(100vh-4rem)] md:max-h-[900px] transition-shadow hover:shadow-lg">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Chat Assistant</h2>
                    </div>
                    <button
                        onClick={handleNewConversation}
                        className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-md transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                        aria-label="Start new conversation"
                    >
                        <span className="hidden sm:inline">New Conversation</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md shadow-sm animate-slideDown" role="alert">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-hidden">
                    <MessageList
                        messages={messages}
                        onBasketUpdate={onBasketUpdate}
                        onPaymentDone={onPaymentDone}
                        onSendMessage={handleSendMessage}
                    />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 bg-gray-50">
                    <MessageInput
                        onSend={handleSendMessage}
                        disabled={isLoading || !conversationId}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </ConversationProvider>
    );
};

export default ChatInterface;
