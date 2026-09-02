export interface PasswordCheck {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasUpper: boolean;
  hasSymbol: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Business email is required";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address";
  return null;
}

export function validateOrganizationName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Workspace name is required";
  if (trimmed.length > 255) return "Keep it under 255 characters";
  return null;
}

export function validateName(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > 120) return "Keep it under 120 characters";
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Confirm your password";
  if (password !== confirm) return "Passwords don't match";
  return null;
}

/**
 * Mirrors backend/src/modules/auth/auth.schemas.ts's registerBodySchema
 * password rule (8–128 chars, at least one letter, at least one digit).
 * minLength/hasLetter/hasNumber are what the backend actually enforces;
 * hasUpper/hasSymbol are extra UX-only signals for the strength meter
 * and are never required to submit — see isPasswordValidForBackend.
 */
export function checkPassword(value: string): PasswordCheck {
  return {
    minLength: value.length >= 8 && value.length <= 128,
    hasLetter: /[A-Za-z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasUpper: /[A-Z]/.test(value),
    hasSymbol: /[^A-Za-z0-9]/.test(value),
  };
}

export function isPasswordValidForBackend(check: PasswordCheck): boolean {
  return check.minLength && check.hasLetter && check.hasNumber;
}

export function passwordStrengthScore(check: PasswordCheck): number {
  return [check.minLength, check.hasLetter, check.hasNumber, check.hasUpper, check.hasSymbol].filter(
    Boolean
  ).length;
}

/**
 * Cosmetic-only preview of the workspace slug shown in step 1. The real
 * slug is generated server-side — slugify(name) + a random 8-char suffix
 * (see backend/src/modules/auth/auth.service.ts) — so this mirrors the
 * same base-slug logic for a realistic-looking preview, but the actual
 * value always gets a unique suffix the client can't predict ahead of
 * time. Never sent to the backend as an editable field.
 */
export function slugPreview(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "your-workspace";
}
