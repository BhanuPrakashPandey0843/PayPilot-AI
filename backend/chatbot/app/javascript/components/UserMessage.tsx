import React from 'react';

interface UserMessageProps {
    content: string;
    timestamp: Date;
}

const UserMessage: React.FC<UserMessageProps> = ({ content, timestamp }) => {
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="flex justify-end animate-slideInRight">
            <div className="max-w-[85%] sm:max-w-[80%]">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{content}</p>
                </div>
                <div className="mt-1.5 text-xs text-gray-500 text-right">
                    <time dateTime={timestamp.toISOString()}>{formatTime(timestamp)}</time>
                </div>
            </div>
        </div>
    );
};

export default UserMessage;
