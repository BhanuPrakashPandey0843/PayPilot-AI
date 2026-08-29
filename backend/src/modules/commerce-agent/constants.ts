/**
 * Enums / literal unions for the commerce-agent module. Keeping these as
 * `as const` arrays (rather than free-form strings scattered across
 * services) means adding a new intent/status/action is a one-line change
 * HERE, and every consumer (types.ts, schemas, tests) stays in sync.
 */

export const COMMERCE_INTENTS = [
  "PRODUCT_SEARCH",
  "PRODUCT_COMPARE",
  "PRODUCT_DETAILS",
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "ORDER_PREVIEW",
  "UNKNOWN",
] as const;

export const RECOMMENDATION_TYPES = ["UPSELL", "CROSS_SELL"] as const;

export const POLICY_STATUSES = ["PASS", "FAIL", "WARNING"] as const;

export const NEXT_ACTIONS = [
  "SELECT_PRODUCT",
  "VIEW_CART",
  "PROCEED_TO_PREVIEW",
  "REFINE_SEARCH",
  "NONE",
] as const;

export const CONVERSATION_ROLES = ["user", "assistant"] as const;

/** Conversation memory TTL — matches the milestone spec (30 minutes). */
export const CONVERSATION_TTL_SECONDS = 30 * 60;

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CART_ITEMS = 50;
export const DEFAULT_SEARCH_LIMIT = 10;
export const MAX_COMPARE_PRODUCTS = 5;

/** Placeholder tax rate until a real tax engine exists (Phase 8 — order preview only, never charged). */
export const PLACEHOLDER_TAX_RATE = 0.18;
/** Placeholder shipping cost until a shipping module exists. */
export const PLACEHOLDER_SHIPPING_AMOUNT = 0;

/** Inventory count at/below which a policy WARNING (not FAIL) is raised. */
export const LOW_INVENTORY_WARNING_THRESHOLD = 3;
