/**
 * Session Management Utility
 * Handles session ID generation and persistence in localStorage
 */

const SESSION_KEY = 'conversational_checkout_session_id';

/**
 * Generates a UUID v4 session ID
 */
export const generateSessionId = (): string => {
    return crypto.randomUUID();
};

/**
 * Retrieves the session ID from localStorage or creates a new one
 */
export const getSessionId = (): string => {
    try {
        // Try to get existing session ID from localStorage
        let sessionId = localStorage.getItem(SESSION_KEY);

        // If no session ID exists, generate and store a new one
        if (!sessionId) {
            sessionId = generateSessionId();
            localStorage.setItem(SESSION_KEY, sessionId);
        }

        return sessionId;
    } catch (error) {
        // generate a session ID for this session only
        console.warn('localStorage not available, using temporary session ID:', error);
        return generateSessionId();
    }
};

/**
 * Clears the current session ID from localStorage
 * Useful for testing or when user wants to start fresh
 */
export const clearSessionId = (): void => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.warn('Could not clear session ID:', error);
    }
};

/**
 * Sets a specific session ID (useful for testing or session restoration)
 */
export const setSessionId = (sessionId: string): void => {
    try {
        localStorage.setItem(SESSION_KEY, sessionId);
    } catch (error) {
        console.warn('Could not set session ID:', error);
    }
};
