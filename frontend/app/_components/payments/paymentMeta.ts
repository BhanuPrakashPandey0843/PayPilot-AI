import {
  CheckCircle2,
  XCircle,
  Undo2,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import type { PaymentStatus } from "@/lib/api/payments";

interface StatusMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

/**
 * UI mapping for the backend's real paymentStatusEnum — only the four
 * values Postgres actually defines: captured / partially_refunded /
 * refunded / failed (db/schema/payments.ts's pgEnum). Never invent
 * additional statuses here.
 *
 * Each status is visually distinguishable without relying solely on
 * color: a distinct icon + descriptive label always accompanies the
 * tinted badge, per WCAG 1.4.1 (Use of Color) and the phase 6 spec.
 */
export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  captured: {
    label: "Captured",
    color: "var(--accent-emerald)",
    icon: CheckCircle2,
  },
  partially_refunded: {
    label: "Partially refunded",
    color: "var(--accent-cyan)",
    icon: PieChart,
  },
  refunded: {
    label: "Refunded",
    color: "var(--accent-violet)",
    icon: Undo2,
  },
  failed: {
    label: "Failed",
    color: "var(--accent-rose)",
    icon: XCircle,
  },
};

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = (
  Object.keys(PAYMENT_STATUS_META) as PaymentStatus[]
).map((value) => ({ value, label: PAYMENT_STATUS_META[value].label }));
