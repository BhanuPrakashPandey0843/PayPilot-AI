/**
 * Conversation session lifecycle + cart operations (Phase 3 + Phase 9).
 * Thin wrapper around memory.service.ts's get/save/delete — this is
 * where the actual cart mutation rules live (dedupe by productId, max
 * cart size, quantity clamping) so commerce.service.ts stays a pure
 * orchestrator.
 */
import { getSession, saveSession, deleteSession, createEmptySession } from "./memory.service.js";
import { MAX_CART_ITEMS } from "./constants.js";
import { Errors } from "../../utils/errors.js";
import type { CommerceIntent, ConversationSession, SearchFilters } from "./types.js";

export async function loadOrCreateSession(
  organizationId: string,
  userId: string,
  sessionId: string
): Promise<ConversationSession> {
  const existing = await getSession(organizationId, sessionId);
  if (existing) return existing;
  return createEmptySession(organizationId, userId, sessionId);
}

export function addToCart(session: ConversationSession, productId: string, quantity: number): ConversationSession {
  const existingIdx = session.cart.findIndex((i) => i.productId === productId);
  if (existingIdx >= 0) {
    session.cart[existingIdx] = {
      productId,
      quantity: session.cart[existingIdx].quantity + quantity,
    };
    return session;
  }
  if (session.cart.length >= MAX_CART_ITEMS) {
    throw Errors.badRequest(`Cart cannot hold more than ${MAX_CART_ITEMS} distinct products`);
  }
  session.cart.push({ productId, quantity });
  return session;
}

export function removeFromCart(session: ConversationSession, productId: string): ConversationSession {
  session.cart = session.cart.filter((i) => i.productId !== productId);
  return session;
}

export function updateCartQuantity(session: ConversationSession, productId: string, quantity: number): ConversationSession {
  const idx = session.cart.findIndex((i) => i.productId === productId);
  if (idx === -1) return session;
  if (quantity <= 0) {
    session.cart.splice(idx, 1);
  } else {
    session.cart[idx] = { productId, quantity };
  }
  return session;
}

export function clearCart(session: ConversationSession): ConversationSession {
  session.cart = [];
  return session;
}

export function recordTurn(
  session: ConversationSession,
  message: string,
  intent: CommerceIntent,
  filters: SearchFilters,
  shownProductIds: string[] = []
): ConversationSession {
  session.lastIntent = intent;
  if (Object.keys(filters).length > 0) {
    session.lastFilters = { ...session.lastFilters, ...filters };
  }
  if (shownProductIds.length > 0) {
    session.recentSearchProductIds = shownProductIds;
  }
  session.messages.push({ role: "user", content: message, at: new Date().toISOString() });
  // Cap history — memory is ephemeral discovery context, not a transcript archive.
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
  return session;
}

export async function persist(session: ConversationSession): Promise<void> {
  await saveSession(session);
}

export async function clearSession(organizationId: string, sessionId: string): Promise<void> {
  await deleteSession(organizationId, sessionId);
}
