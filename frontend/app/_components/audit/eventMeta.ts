/**
 * Presentation metadata for a raw AuditEvent.action string.
 *
 * The backend's action values are the AuditEventType union in
 * backend/src/utils/audit.ts (e.g. "PAYMENT_CAPTURED",
 * "POLICY_REJECTED", "AI_ACTION_EXECUTED") — free-form-looking but
 * actually a closed enum. Rather than hardcode all ~45 of them here
 * (which drifts the moment a new one is added server-side), this file
 * classifies by substring into a small set of categories/tones that
 * cover every current and future value in that enum by naming
 * convention.
 */
import type { ComponentType } from "react";
import {
  User,
  Bot,
  Cog,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CreditCard,
  Webhook,
  ShoppingCart,
  Sparkles,
  BarChart3,
  Building2,
  Package,
  type LucideIcon,
} from "lucide-react";

export type EventTone = "success" | "failure" | "neutral";

export type EventCategory =
  | "auth"
  | "rbac"
  | "policy"
  | "payment"
  | "checkout"
  | "webhook"
  | "ai"
  | "revenue"
  | "analytics"
  | "organization"
  | "catalog"
  | "other";

export interface EventMeta {
  category: EventCategory;
  tone: EventTone;
  icon: LucideIcon;
  color: string; // CSS var name, e.g. "var(--accent-cyan)"
  label: string; // human-readable form of the action
}

const CATEGORY_ORDER: Array<{ test: (a: string) => boolean; category: EventCategory; icon: LucideIcon; color: string }> = [
  { test: (a) => a.startsWith("AI_") || a.includes("RECOMMENDATION"), category: "ai", icon: Bot, color: "var(--accent-violet)" },
  { test: (a) => a.startsWith("REVENUE_OPPORTUNITY") || a === "REVENUE_ANALYSIS_STARTED" || a === "REVENUE_ACTION_POLICY_CHECKED", category: "revenue", icon: Sparkles, color: "var(--accent-violet)" },
  { test: (a) => a.startsWith("POLICY_"), category: "policy", icon: ShieldCheck, color: "var(--accent-emerald)" },
  { test: (a) => a.startsWith("PAYMENT_") || a.startsWith("RAZORPAY_"), category: "payment", icon: CreditCard, color: "var(--accent-gold)" },
  { test: (a) => a.startsWith("WEBHOOK_"), category: "webhook", icon: Webhook, color: "var(--accent-cyan)" },
  { test: (a) => a.startsWith("CHECKOUT_") || a.startsWith("ORDER_") || a.startsWith("INVENTORY_"), category: "checkout", icon: ShoppingCart, color: "var(--accent-blue)" },
  { test: (a) => a.startsWith("ANALYTICS_"), category: "analytics", icon: BarChart3, color: "var(--accent-cyan)" },
  { test: (a) => a.startsWith("ROLE_") || a.startsWith("PERMISSION_") || a === "AUTHORIZATION_DENIED", category: "rbac", icon: ShieldAlert, color: "var(--accent-amber)" },
  { test: (a) => a === "ORGANIZATION_CREATED", category: "organization", icon: Building2, color: "var(--accent-gold)" },
  { test: (a) => a.startsWith("USER_") || a === "AUTHENTICATION_FAILED", category: "auth", icon: User, color: "var(--accent-blue)" },
  { test: (a) => a.startsWith("CATALOG_") || a.startsWith("PRODUCT_"), category: "catalog", icon: Package, color: "var(--accent-amber)" },
];

function classifyTone(action: string): EventTone {
  if (/(FAILED|DENIED|INVALID|REJECTED|NO_MEMBERSHIP|INACTIVE)/.test(action)) return "failure";
  if (/(SUCCESS|CAPTURED|VERIFIED|APPROVED|GRANTED|EXECUTED|CREATED|RESERVED|RESTORED|REGISTERED)/.test(action)) return "success";
  return "neutral";
}

const TONE_COLOR: Record<EventTone, string> = {
  success: "var(--accent-emerald)",
  failure: "var(--accent-rose)",
  neutral: "var(--muted)",
};

const TONE_ICON: Record<EventTone, LucideIcon> = {
  success: ShieldCheck,
  failure: ShieldX,
  neutral: Cog,
};

export function formatActionLabel(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function getEventMeta(action: string): EventMeta {
  const tone = classifyTone(action);
  const match = CATEGORY_ORDER.find((c) => c.test(action));

  // A failure/success tone wins visually over the category color (a red
  // "Payment Failed" should read as red, not gold), but the category
  // still decides the icon so the shape stays recognizable.
  const icon = match?.icon ?? TONE_ICON[tone];
  const color = tone === "neutral" ? match?.color ?? TONE_COLOR.neutral : TONE_COLOR[tone];

  return {
    category: match?.category ?? "other",
    tone,
    icon,
    color,
    label: formatActionLabel(action),
  };
}

export const ACTOR_ICON: Record<"USER" | "AI_AGENT" | "SYSTEM", ComponentType<{ className?: string }>> = {
  USER: User,
  AI_AGENT: Bot,
  SYSTEM: Cog,
};

export function formatResourceType(resourceType: string): string {
  return resourceType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
