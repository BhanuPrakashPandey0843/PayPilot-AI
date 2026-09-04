import {
  ShieldCheck,
  Settings2,
  Wallet,
  Headset,
  Eye,
  Check,
  Clock,
  Ban,
  type LucideIcon,
} from "lucide-react";
import type { TeamRole, UserStatus, MembershipStatus } from "@/lib/api/team";

/**
 * Presentation helpers for the Team page. All role definitions (5 total,
 * exactly ROLE_NAMES from lib/permissions.ts) are sourced from the
 * client-side mirror of the backend seed — never invented here.
 *
 * Status badges use BOTH an icon + a label + a tinted color so status is
 * readable without relying on color alone (per phase 29 accessibility
 * reqs and general fintech standards).
 */

export const ROLE_ACCENT: Record<TeamRole, string> = {
  ORG_ADMIN: "var(--accent-violet)",
  OPERATIONS: "var(--accent-blue)",
  FINANCE: "var(--accent-gold)",
  SUPPORT: "var(--accent-cyan)",
  VIEWER: "var(--muted)",
};

export const ROLE_ICON: Record<TeamRole, LucideIcon> = {
  ORG_ADMIN: ShieldCheck,
  OPERATIONS: Settings2,
  FINANCE: Wallet,
  SUPPORT: Headset,
  VIEWER: Eye,
};

/** Exact order the backend seeds roles — matched here so role options in
 *  invite-modal dropdowns read Admin → Ops → Finance → Support → Viewer
 *  (most privileged to least) rather than alphabetical. */
export const ROLE_ORDER: TeamRole[] = ["ORG_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT", "VIEWER"];

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  ORG_ADMIN: "Full access to everything within the organization.",
  OPERATIONS: "Manages catalog, orders, and customers day-to-day.",
  FINANCE: "Manages payments, refunds, and financial visibility.",
  SUPPORT: "Read-focused, with limited customer updates for support tasks.",
  VIEWER: "Read-only access across the organization.",
};

// --- Membership status badges ----------------------------------------

interface StatusMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const USER_STATUS_META: Record<UserStatus, StatusMeta> = {
  active: {
    label: "Active",
    color: "var(--accent-emerald)",
    icon: Check,
  },
  invited: {
    label: "Invited",
    color: "var(--accent-amber)",
    icon: Clock,
  },
  disabled: {
    label: "Disabled",
    color: "var(--muted)",
    icon: Ban,
  },
};

export const MEMBERSHIP_STATUS_META: Record<MembershipStatus, StatusMeta> = {
  active: {
    label: "Active",
    color: "var(--accent-emerald)",
    icon: Check,
  },
  invited: {
    label: "Invitation pending",
    color: "var(--accent-amber)",
    icon: Clock,
  },
  suspended: {
    label: "Suspended",
    color: "var(--accent-rose)",
    icon: Ban,
  },
  removed: {
    label: "Removed",
    color: "var(--muted)",
    icon: Ban,
  },
};
