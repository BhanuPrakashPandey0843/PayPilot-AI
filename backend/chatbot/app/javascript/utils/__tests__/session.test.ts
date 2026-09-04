/**
 * Tests for session utility
 */

import { getSessionId, clearSessionId, setSessionId } from '../session';

describe('Session Utility', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('getSessionId', () => {
        it('should create and store a new session ID if none exists', () => {
            const sessionId = getSessionId();
            expect(sessionId).toBeTruthy();
            expect(localStorage.getItem('conversational_checkout_session_id')).toBe(sessionId);
        });

        it('should return existing session ID from localStorage', () => {
            const existingId = 'test-session-id';
            localStorage.setItem('conversational_checkout_session_id', existingId);

            const sessionId = getSessionId();
            expect(sessionId).toBe(existingId);
        });

        it('should return the same ID on multiple calls', () => {
            const id1 = getSessionId();
            const id2 = getSessionId();
            expect(id1).toBe(id2);
        });
    });

    describe('clearSessionId', () => {
        it('should remove session ID from localStorage', () => {
            localStorage.setItem('conversational_checkout_session_id', 'test-id');
            clearSessionId();
            expect(localStorage.getItem('conversational_checkout_session_id')).toBeNull();
        });
    });

    describe('setSessionId', () => {
        it('should set a specific session ID', () => {
            const customId = 'custom-session-id';
            setSessionId(customId);
            expect(localStorage.getItem('conversational_checkout_session_id')).toBe(customId);
        });
    });
});
