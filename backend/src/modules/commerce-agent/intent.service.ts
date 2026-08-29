/**
 * Deterministic intent + filter extraction (Phase 2).
 *
 * Per Rule 3 of the milestone spec: no fake AI reasoning. This is plain
 * pattern matching — good enough for a demo, and deliberately isolated
 * behind `extractIntent`/`extractFilters` so a real LLM-based extractor
 * can be swapped in later (see `IntentExtractor` below) without touching
 * commerce.service.ts or anything downstream of it.
 */
import type { CommerceIntent, SearchFilters } from "./types.js";

interface IntentPattern {
  intent: CommerceIntent;
  patterns: RegExp[];
}

// Order matters — first match wins, so more specific intents (checkout,
// compare, cart ops) are checked before the broad PRODUCT_SEARCH catch-all.
const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "ORDER_PREVIEW",
    patterns: [/\bcheckout\b/i, /\border\s*preview\b/i, /\bplace\s+(the\s+)?order\b/i, /\bproceed\s+to\s+(pay|checkout)\b/i, /\breview\s+(my\s+)?cart\b/i],
  },
  {
    intent: "PRODUCT_COMPARE",
    patterns: [/\bcompare\b/i, /\bversus\b/i, /\bvs\.?\b/i, /\bdifference\s+between\b/i],
  },
  {
    intent: "REMOVE_FROM_CART",
    patterns: [/\bremove\b/i, /\btake\s+.*\bout\b/i, /\bdelete\b.*\bcart\b/i, /\bdon'?t\s+want\b/i],
  },
  {
    intent: "ADD_TO_CART",
    patterns: [/\badd\b/i, /\bi'?ll\s+take\b/i, /\bi\s+want\s+to\s+buy\b/i, /\bput\b.*\bin\s+(my\s+)?cart\b/i],
  },
  {
    intent: "PRODUCT_DETAILS",
    patterns: [/\btell me more\b/i, /\bmore\s+(details|info(rmation)?)\b/i, /\bwhat\s+is\b/i, /\bdetails\s+(on|about)\b/i, /\babout\s+the\b/i],
  },
  {
    intent: "PRODUCT_SEARCH",
    patterns: [
      /\bneed\b/i,
      /\blooking for\b/i,
      /\bshow me\b/i,
      /\bfind\b/i,
      /\bsearch\b/i,
      /\bwant\b/i,
      /\bshoes?\b/i,
      /\bsocks?\b/i,
      /\bcap\b/i,
      /\bbottle\b/i,
      /\bhat\b/i,
    ],
  },
];

export function extractIntent(message: string): CommerceIntent {
  const trimmed = message.trim();
  if (!trimmed) return "UNKNOWN";
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(trimmed))) return intent;
  }
  return "UNKNOWN";
}

const COLOR_WORDS = [
  "black", "white", "red", "blue", "green", "yellow", "grey", "gray",
  "orange", "pink", "purple", "brown", "navy", "beige", "maroon",
];

const CATEGORY_KEYWORDS: Array<{ keyword: RegExp; category: string }> = [
  { keyword: /\brunning shoes?\b|\bsneakers?\b/i, category: "Running Shoes" },
  { keyword: /\bshoes?\b/i, category: "Running Shoes" },
  { keyword: /\bsocks?\b/i, category: "Accessories" },
  { keyword: /\bbottle\b/i, category: "Accessories" },
  { keyword: /\b(cap|hat)\b/i, category: "Accessories" },
];

const TAG_KEYWORDS = ["waterproof", "trekking", "running", "sports", "fitness", "lightweight", "breathable"];

/**
 * Parses buyer-supplied filters out of free text. All amounts are
 * converted to integer minor units (paise) to match the catalog's money
 * representation. Only fields the regexes are confident about are set —
 * everything else is left `undefined` rather than guessed.
 */
export function extractFilters(message: string): SearchFilters {
  const text = message.toLowerCase();
  const filters: SearchFilters = {};

  const maxPriceMatch = text.match(
    /(?:under|below|less than|max(?:imum)?(?:\s+budget)?(?:\s+of)?)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i
  );
  if (maxPriceMatch) {
    const rupees = Number(maxPriceMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(rupees) && rupees > 0) filters.maxPrice = rupees * 100;
  }

  const minPriceMatch = text.match(/(?:above|over|more than|min(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i);
  if (minPriceMatch) {
    const rupees = Number(minPriceMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(rupees) && rupees > 0) filters.minPrice = rupees * 100;
  }

  for (const color of COLOR_WORDS) {
    if (new RegExp(`\\b${color}\\b`, "i").test(text)) {
      filters.color = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }

  const qtyMatch = text.match(/\b(\d+)\s*(?:x|pairs?|units?|pieces?)\b/i);
  if (qtyMatch) {
    const qty = Number(qtyMatch[1]);
    if (qty > 0) filters.quantity = qty;
  }

  const tags = TAG_KEYWORDS.filter((tag) => new RegExp(`\\b${tag}\\b`, "i").test(text));
  if (tags.length > 0) filters.tags = tags;

  if (/\bavailable\b|\bin stock\b/i.test(text)) filters.available = true;

  for (const { keyword, category } of CATEGORY_KEYWORDS) {
    if (keyword.test(text)) {
      filters.category = category;
      break;
    }
  }

  return filters;
}

export interface IntentExtractionResult {
  intent: CommerceIntent;
  filters: SearchFilters;
}

/**
 * Pluggable extractor interface. `deterministicIntentExtractor` is the
 * only implementation today; a future LLM-backed implementation (Claude/
 * OpenAI) would satisfy the same interface and be swapped in at the
 * commerce.service.ts call site with no other code changes.
 */
export interface IntentExtractor {
  extract(message: string): IntentExtractionResult;
}

export const deterministicIntentExtractor: IntentExtractor = {
  extract(message: string): IntentExtractionResult {
    return { intent: extractIntent(message), filters: extractFilters(message) };
  },
};
