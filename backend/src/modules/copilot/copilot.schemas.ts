import { z } from "zod";

export const chatBodySchema = z.object({
  message: z.string().trim().min(1, "message is required").max(2000, "message must be 2000 characters or fewer"),
});
export type ChatBody = z.infer<typeof chatBodySchema>;

export const chatBodyJsonSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description:
        'Merchant question, e.g. "How can I increase my revenue?" or "Why did revenue drop this week?"',
    },
  },
  required: ["message"],
} as const;

export const chatResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        reply: { type: "string" },
        provider: { type: "string", enum: ["anthropic", "openai", "template"] },
        toolCalls: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              input: { type: "object" },
              ok: { type: "boolean" },
            },
          },
        },
      },
    },
  },
} as const;
