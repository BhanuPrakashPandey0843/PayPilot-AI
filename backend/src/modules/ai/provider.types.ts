/**
 * Provider-agnostic content-block format for the AI copilot's tool-use
 * loop (Milestone 6 Phase 7's "AI provider abstraction" requirement).
 *
 * This shape mirrors Anthropic's Messages API content-block format
 * directly (text / tool_use / tool_result) because it is expressive
 * enough to represent both providers' tool-calling without lossy
 * conversion in the common direction; the OpenAI provider adapts TO and
 * FROM this shape internally (see openai.provider.ts) so nothing above
 * this layer (copilot.service.ts) ever needs to know which provider is
 * in use.
 */
export type AIContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface AICanonicalMessage {
  role: "user" | "assistant";
  content: AIContentBlock[];
}

export interface AIToolSpec {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export type AIStopReason = "end_turn" | "tool_use" | "max_tokens" | "error";

export interface AIGenerateResult {
  content: AIContentBlock[];
  stopReason: AIStopReason;
}

export interface AIProvider {
  readonly name: "anthropic" | "openai" | "template";
  generate(params: { system: string; messages: AICanonicalMessage[]; tools: AIToolSpec[] }): Promise<AIGenerateResult>;
}

export class AIProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
