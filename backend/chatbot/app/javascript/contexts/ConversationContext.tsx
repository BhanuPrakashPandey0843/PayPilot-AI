import React, { createContext, useContext, ReactNode } from 'react';

interface ConversationContextType {
    conversationId: number | null;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider = ({
    conversationId,
    children
}: {
    conversationId: number | null;
    children: ReactNode
}) => {
    return (
        <ConversationContext.Provider value={{ conversationId }}>
            {children}
        </ConversationContext.Provider>
    );
};

export const useConversation = () => {
    const context = useContext(ConversationContext);
    if (!context) {
        return { conversationId: null };
    }
    return context;
};
