import { z } from "zod";
import { paginationQuerySchema, paginationQueryJsonSchema } from "../../utils/pagination.js";

export const auditQuerySchema = paginationQuerySchema.extend({
  resourceType: z.string().min(1).max(64).optional(),
  resourceId: z.string().min(1).max(255).optional(),
  action: z.string().min(1).max(128).optional(),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

export const auditQueryJsonSchema = {
  type: "object",
  properties: {
    ...paginationQueryJsonSchema.properties,
    resourceType: { type: "string" },
    resourceId: { type: "string" },
    action: { type: "string" },
  },
} as const;

export const auditListResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          organizationId: { type: "string", format: "uuid" },
          actorType: { type: "string", enum: ["USER", "AI_AGENT", "SYSTEM"] },
          actorId: { type: "string", format: "uuid" },
          action: { type: "string" },
          resourceType: { type: "string" },
          resourceId: { type: "string" },
          reason: { type: "string" },
          metadata: { type: "object" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    meta: {
      type: "object",
      properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } },
    },
  },
} as const;
