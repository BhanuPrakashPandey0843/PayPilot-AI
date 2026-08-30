/**
 * MOCK DATA — audit trail entries for the `/demo` audit timeline and
 * `/product/checkout` / `/security` illustrations. Synthetic, mirrors
 * the shape of the real `audit_logs` table's actor/action/result model.
 */

export type MockAuditEvent = {
  id: string;
  actorType: "USER" | "AI_AGENT" | "SYSTEM";
  actor: string;
  action: string;
  result: "success" | "blocked" | "info";
  timestamp: string; // relative label for demo purposes
};

export const MOCK_AUDIT_TRAIL: MockAuditEvent[] = [
  {
    id: "audit_01",
    actorType: "AI_AGENT",
    actor: "Revenue Engine",
    action: "Detected CROSS_SELL opportunity (score 87) for ORD-8841",
    result: "info",
    timestamp: "T+0s",
  },
  {
    id: "audit_02",
    actorType: "SYSTEM",
    actor: "Policy Engine",
    action: "Evaluated discount (12%) against merchant policy ceiling (15%)",
    result: "success",
    timestamp: "T+1s",
  },
  {
    id: "audit_03",
    actorType: "USER",
    actor: "Merchant (Ops role)",
    action: "Approved opportunity opp_01 for execution",
    result: "success",
    timestamp: "T+42s",
  },
  {
    id: "audit_04",
    actorType: "AI_AGENT",
    actor: "Checkout Service",
    action: "Prepared bundled order via existing idempotent retry path",
    result: "success",
    timestamp: "T+43s",
  },
  {
    id: "audit_05",
    actorType: "SYSTEM",
    actor: "Razorpay Webhook",
    action: "payment.captured received and deduplicated (webhook_events)",
    result: "success",
    timestamp: "T+58s",
  },
];
