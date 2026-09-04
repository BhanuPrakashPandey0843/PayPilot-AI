/**
 * Client-side mirror of backend/src/modules/products/products.schemas.ts's
 * createProductBodySchema — same "duplicated on purpose for instant inline
 * feedback" reasoning as lib/validation/authValidation.ts. The backend's
 * Zod schema (via parseOrThrow) remains the actual source of truth; this
 * only prevents an obviously-invalid submit and mirrors the same limits
 * so a merchant isn't surprised by a 422 for something checkable client-side.
 */

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateProductName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Product name is required";
  if (trimmed.length > 255) return "Keep it under 255 characters";
  return null;
}

export function validateProductSlug(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // optional — auto-derived from name when omitted
  if (trimmed.length > 255) return "Keep it under 255 characters";
  if (!SLUG_REGEX.test(trimmed)) return "Lowercase letters, numbers, and hyphens only (e.g. wireless-mouse)";
  return null;
}

export function validateProductDescription(value: string): string | null {
  if (value.length > 10_000) return "Keep it under 10,000 characters";
  return null;
}

export function validateProductCategory(value: string): string | null {
  if (value.length > 128) return "Keep it under 128 characters";
  return null;
}

export function validateProductTag(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Tag can't be empty";
  if (trimmed.length > 64) return "Keep each tag under 64 characters";
  return null;
}

export function validateProductTags(tags: string[]): string | null {
  if (tags.length > 20) return "Up to 20 tags";
  return null;
}

/** `value` is the major-unit decimal string typed into the price input
 * (e.g. "499.00"), not the minor-unit integer sent to the backend. */
export function validateProductPrice(value: string): string | null {
  if (!value.trim()) return "Price is required";
  const num = Number(value);
  if (Number.isNaN(num)) return "Enter a valid number";
  if (num < 0) return "Price can't be negative";
  return null;
}

export function validateProductCurrency(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Currency is required";
  if (trimmed.length !== 3) return "Use a 3-letter currency code, e.g. INR";
  return null;
}

export function validateProductInventory(value: string): string | null {
  if (!value.trim()) return "Inventory quantity is required";
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) return "Enter a whole number";
  if (num < 0) return "Can't be negative";
  return null;
}

export function validateProductImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // optional
  if (trimmed.length > 2048) return "Keep the URL under 2048 characters";
  try {
    new URL(trimmed);
    return null;
  } catch {
    return "Enter a valid URL";
  }
}

/** Mirrors service.ts's slugify() for a live preview only — the real
 * slug is generated server-side when the field is left blank, and may
 * differ (e.g. a random suffix on collision). Never sent as-is unless
 * the merchant explicitly edited the slug field themselves. */
export function slugifyPreview(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "product";
}
