import { Ban, CheckCircle2, XCircle, type LucideIcon } from "lucide-react";
import type { CustomerStatus } from "@/lib/api/customers";

interface StatusMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

/** customers.status (customers.schemas.ts's z.enum(["active","inactive","blocked"])). */
export const CUSTOMER_STATUS_META: Record<CustomerStatus, StatusMeta> = {
  active: { label: "Active", color: "var(--accent-emerald)", icon: CheckCircle2 },
  inactive: { label: "Inactive", color: "var(--muted)", icon: XCircle },
  blocked: { label: "Blocked", color: "var(--accent-rose)", icon: Ban },
};

export const CUSTOMER_STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = (
  Object.keys(CUSTOMER_STATUS_META) as CustomerStatus[]
).map((value) => ({ value, label: CUSTOMER_STATUS_META[value].label }));
