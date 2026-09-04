import {
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Undo2,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import type { OrderStatus, PaymentAttemptStatus, PaymentStatus } from "@/lib/api/orders";

interface StatusMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

/**
 * orders.status — the order lifecycle (orders.types.ts's
 * ORDER_STATUS_TRANSITIONS on the backend). Distinct from payment
 * status below: an order can be "paid" while its payment record shows
 * "partially_refunded", and a "pending" order can have zero or several
 * payment attempts behind it.
 */
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: { label: "Pending", color: "var(--accent-amber)", icon: Clock },
  paid: { label: "Paid", color: "var(--accent-emerald)", icon: CheckCircle2 },
  partially_paid: { label: "Partially paid", color: "var(--accent-cyan)", icon: PieChart },
  failed: { label: "Failed", color: "var(--accent-rose)", icon: XCircle },
  cancelled: { label: "Cancelled", color: "var(--muted)", icon: Ban },
  refunded: { label: "Refunded", color: "var(--accent-violet)", icon: Undo2 },
};

/**
 * The latest payment_attempt's status (payment.constants.ts's
 * ATTEMPT_STATUS_TRANSITIONS) — shown as "Payment Status", always kept
 * visually distinct from the order status badge above so the merchant
 * never confuses the two state machines.
 */
export const PAYMENT_ATTEMPT_STATUS_META: Record<PaymentAttemptStatus, StatusMeta> = {
  created: { label: "Created", color: "var(--muted)", icon: Clock },
  pending: { label: "Pending", color: "var(--accent-amber)", icon: Clock },
  authorized: { label: "Authorized", color: "var(--accent-cyan)", icon: CheckCircle2 },
  captured: { label: "Captured", color: "var(--accent-emerald)", icon: CheckCircle2 },
  failed: { label: "Failed", color: "var(--accent-rose)", icon: XCircle },
  cancelled: { label: "Cancelled", color: "var(--muted)", icon: Ban },
};

/** The captured `payments` row's own status — distinct again from both
 * of the above (payments.ts's paymentStatusEnum). Only ever present once
 * an attempt has actually captured. */
export const PAYMENT_RECORD_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  captured: { label: "Captured", color: "var(--accent-emerald)", icon: CheckCircle2 },
  partially_refunded: { label: "Partially refunded", color: "var(--accent-cyan)", icon: PieChart },
  refunded: { label: "Refunded", color: "var(--accent-violet)", icon: Undo2 },
  failed: { label: "Failed", color: "var(--accent-rose)", icon: XCircle },
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = (
  Object.keys(ORDER_STATUS_META) as OrderStatus[]
).map((value) => ({ value, label: ORDER_STATUS_META[value].label }));
