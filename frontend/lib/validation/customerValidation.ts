/**
 * Client-side mirror of backend/src/modules/customers/customers.schemas.ts's
 * createCustomerBodySchema (updateCustomerBodySchema is `.partial()` of
 * the same rules). Hand-duplicated on purpose, same reasoning as
 * lib/validation/productValidation.ts: fast-feedback UX layer only — the
 * backend re-validates every request with the real Zod schema regardless
 * of what passes here, and CustomerFormModal surfaces those field errors
 * too.
 */

const PHONE_REGEX = /^[+0-9()\-.\s]*$/;

export function validateCustomerName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Customer name is required";
  if (trimmed.length > 255) return "Keep it under 255 characters";
  return null;
}

/** Optional — createCustomerBodySchema allows "" or a valid email. */
export function validateCustomerEmail(value: string): string | null {
  if (!value.trim()) return null;
  if (value.length > 320) return "Keep it under 320 characters";
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
  return null;
}

/** Optional — free-text but bounded, matches z.string().trim().max(32). */
export function validateCustomerPhone(value: string): string | null {
  if (!value.trim()) return null;
  if (value.length > 32) return "Keep it under 32 characters";
  if (!PHONE_REGEX.test(value)) return "Digits, spaces, and + ( ) - . only";
  return null;
}

export function validateCustomerExternalId(value: string): string | null {
  if (!value.trim()) return null;
  if (value.length > 255) return "Keep it under 255 characters";
  return null;
}
