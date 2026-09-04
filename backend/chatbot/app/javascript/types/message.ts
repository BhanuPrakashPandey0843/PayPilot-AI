/**
 * Message Type Definition
 */

import type { UIContext } from './actions';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    uiContext?: UIContext;
    toolCall?: {
        toolName: string;
        uiDescriptor?: string;
    };
}
