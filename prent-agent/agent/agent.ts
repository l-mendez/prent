import { defineAgent } from "eve";
import { openai } from "@ai-sdk/openai";

// Migrated from app/api/chat/turnos/route.ts (originally openai("gpt-5") with
// providerOptions.openai.reasoning_effort = "low").
//
// Uses the OpenAI provider DIRECTLY (not the AI Gateway) so it reuses the existing
// OPENAI_API_KEY env var — no new credential to manage. @ai-sdk/openai@4 lines up with
// eve's ai@7 (@ai-sdk/provider@4.0.0).
//
// To route through the Vercel AI Gateway instead, use: model: "openai/gpt-5".
export default defineAgent({
  model: openai("gpt-5"),
  reasoning: "low",
});
