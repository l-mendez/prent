import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defineState } from "eve/context";

// Token/cost tracking, ported from db/utils.ts (calculateCost / createChat / updateChat) and
// app/api/price/route.ts (GPT5 pricing). Writes one row per conversation into the Supabase
// `chats` table, incremented each turn. Degrades to a log line when the analytics DB / key env
// is absent, so the agent runs fine without it.

// USD per token (GPT-5). CHANGE WHEN CHANGING MODEL.
const GPT5 = {
  inputTokenCost: 1.25e-6,
  cachedInputTokenCost: 0.125e-6,
  outputTokenCost: 10e-6,
};

export type TurnUsage = { input: number; output: number; cache: number };

export function calcCost(u: TurnUsage): number {
  return (
    u.input * GPT5.inputTokenCost +
    u.output * GPT5.outputTokenCost +
    u.cache * GPT5.cachedInputTokenCost
  );
}

// Per-session durable state: the current turn's accumulating usage (token usage rides on
// step.completed; we flush per turn) and the id of this conversation's row in `chats`.
export const turnUsageState = defineState<TurnUsage>("prent.turnUsage", () => ({
  input: 0,
  output: 0,
  cache: 0,
}));
export const chatRowState = defineState<{ id: number | null }>(
  "prent.chatRow",
  () => ({ id: null }),
);

let cached: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

async function getApiKeyId(sb: SupabaseClient, apiKey: string): Promise<number | null> {
  const { data } = await sb.from("api_keys").select("id").eq("api_key", apiKey).single();
  return (data?.id as number | undefined) ?? null;
}

async function bumpApiKeyUsage(sb: SupabaseClient, apiKey: string, costInc: number): Promise<void> {
  if (!costInc || costInc <= 0) return;
  const { data } = await sb.from("api_keys").select("usage").eq("api_key", apiKey).single();
  await sb
    .from("api_keys")
    .update({ usage: (data?.usage || 0) + costInc })
    .eq("api_key", apiKey);
}

// Writes one turn's usage to `chats`: creates the conversation row on the first turn (storing its
// id in session state) and increments it thereafter — the eve-session equivalent of the original
// per-request createChat/updateChat. Never throws (a throwing hook would fail the turn).
export async function recordTurnUsage(usage: TurnUsage): Promise<void> {
  const cost = calcCost(usage);
  const total = usage.input + usage.output + usage.cache;
  const apiKey = process.env.PRENT_API_KEY;
  const sb = getSupabase();

  if (!sb || !apiKey) {
    console.log("[usage]", { ...usage, total, cost });
    return;
  }

  try {
    const existingId = chatRowState.get().id;
    if (existingId == null) {
      const apiKeyId = await getApiKeyId(sb, apiKey);
      if (!apiKeyId) {
        console.error("[usage] PRENT_API_KEY not found in api_keys table");
        return;
      }
      const { data, error } = await sb
        .from("chats")
        .insert({
          api_key_id: apiKeyId,
          cache_tokens: usage.cache,
          input_tokens: usage.input,
          output_tokens: usage.output,
          total_tokens: total,
          chat_cost: cost,
          messages_amount: 2,
        })
        .select("id")
        .single();
      if (error || !data) {
        console.error("[usage] insert chat failed", error);
        return;
      }
      chatRowState.update(() => ({ id: data.id as number }));
      await bumpApiKeyUsage(sb, apiKey, cost);
    } else {
      const { data: cur, error } = await sb
        .from("chats")
        .select("cache_tokens,input_tokens,output_tokens,total_tokens,chat_cost,messages_amount")
        .eq("id", existingId)
        .single();
      if (error) {
        console.error("[usage] fetch chat failed", error);
        return;
      }
      await sb
        .from("chats")
        .update({
          cache_tokens: (cur?.cache_tokens || 0) + usage.cache,
          input_tokens: (cur?.input_tokens || 0) + usage.input,
          output_tokens: (cur?.output_tokens || 0) + usage.output,
          total_tokens: (cur?.total_tokens || 0) + total,
          chat_cost: (cur?.chat_cost || 0) + cost,
          messages_amount: (cur?.messages_amount || 0) + 2,
        })
        .eq("id", existingId);
      await bumpApiKeyUsage(sb, apiKey, cost);
    }
  } catch (e) {
    console.error("[usage] recordTurnUsage error", e);
  }
}
