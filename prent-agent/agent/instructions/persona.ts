import { defineDynamic, defineInstructions } from "eve/instructions";
import { modeFromAttributes } from "../lib/config.js";
import {
  CONSULTORIO_PERSONA,
  URGENCIAS_PERSONA,
  SUMMARY_PROMPT,
} from "../lib/prompts.js";

// Resolves the session's persona by the caller-supplied mode (carried on auth attributes; see
// agent/channels/eve.ts). Header-less callers (e.g. the eve TUI) default to "consultorio".
export default defineDynamic({
  events: {
    "turn.started": (_event, ctx) => {
      const attributes = ctx.session.auth.current?.attributes as
        | Record<string, unknown>
        | undefined;
      const mode = modeFromAttributes(attributes);
      if (mode === "urgencias") {
        return defineInstructions({ markdown: URGENCIAS_PERSONA });
      }
      if (mode === "resumen") {
        return defineInstructions({ markdown: SUMMARY_PROMPT });
      }
      return defineInstructions({ markdown: CONSULTORIO_PERSONA });
    },
  },
});
