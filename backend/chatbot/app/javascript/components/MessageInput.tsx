import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled: boolean;
    isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled, isLoading }) => {
    const [inputValue, setInputValue] = useState<string>('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [inputValue]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedValue = inputValue.trim();
        if (!trimmedValue || disabled) return;

        onSend(trimmedValue);
        setInputValue('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    // Handle Enter key (submit) and Shift+Enter (new line)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 sm:p-4">
            <div className="flex items-end space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? "Please wait..." : "Type your message..."}
                        disabled={disabled}
                        rows={1}
                        aria-label="Message input"
                        className="w-full px-4 py-2.5 pr-4 md:pr-64 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 placeholder:text-gray-400"
                        style={{ maxHeight: '120px' }}
                    />
                    <div className="hidden md:block absolute bottom-2.5 right-3 text-xs text-gray-400 pointer-events-none select-none">
                        {!disabled && (
                            <span className="bg-white/80 px-1.5 py-0.5 rounded">
                                <kbd className="font-mono text-xs">Enter</kbd> to send • <kbd className="font-mono text-xs">Shift+Enter</kbd> for new line
                            </span>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={disabled || !inputValue.trim()}
                    aria-label={isLoading ? "Sending message" : "Send message"}
                    className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:shadow-none font-medium"
                >
                    {isLoading ? (
                        <>
                            <svg
                                className="animate-spin h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            <span className="hidden sm:inline">Sending</span>
                        </>
                    ) : (
                        <>
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                            <span className="hidden sm:inline">Send</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default MessageInput;
