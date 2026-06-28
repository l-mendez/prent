import { defineHook } from "eve/hooks";
import { turnUsageState, recordTurnUsage } from "../lib/usage.js";

// Migrated from the createChat/updateChat calls the original routes made after each generateText/
// generateObject. Token usage rides on `step.completed`; we accumulate across the turn's steps and
// flush one `chats` row-write per turn (one row per conversation/session). See lib/usage.ts.
export default defineHook({
  events: {
    "turn.started": () => {
      turnUsageState.update(() => ({ input: 0, output: 0, cache: 0 }));
    },
    "step.completed": (event) => {
      const u = event.data.usage;
      if (!u) return;
      // In ai@7, inputTokens is the TOTAL prompt count and cacheReadTokens is a SUBSET of it.
      // Store only the non-cached prompt tokens in `input` so calcCost/total don't bill cached
      // tokens twice (once at the input rate, once at the cached rate).
      const cache = u.cacheReadTokens ?? 0;
      const nonCachedInput = Math.max(0, (u.inputTokens ?? 0) - cache);
      turnUsageState.update((prev) => ({
        input: prev.input + nonCachedInput,
        output: prev.output + (u.outputTokens ?? 0),
        cache: prev.cache + cache,
      }));
    },
    "turn.completed": async () => {
      await recordTurnUsage(turnUsageState.get());
    },
  },
});
