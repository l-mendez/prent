import { defineDynamic, defineInstructions } from "eve/instructions";
import { modeFromAttributes } from "../lib/config.js";
import {
  TURNOS_PERSONA,
  CONSULTORIO_PERSONA,
  URGENCIAS_PERSONA,
  SUMMARY_PROMPT,
  turnosFechaBlock,
} from "../lib/prompts.js";

// Resolves the session's persona by the caller-supplied mode (carried on auth attributes; see
// agent/channels/eve.ts). Runs at turn.started so the scheduler's date context refreshes each turn.
// Header-less callers (e.g. the eve TUI) default to "turnos", preserving the Phase-1 behavior.
export default defineDynamic({
  events: {
    "turn.started": (_event, ctx) => {
      const attributes = ctx.session.auth.current?.attributes as
        | Record<string, unknown>
        | undefined;
      const mode = modeFromAttributes(attributes);
      if (mode === "consultorio") {
        return defineInstructions({ markdown: CONSULTORIO_PERSONA });
      }
      if (mode === "urgencias") {
        return defineInstructions({ markdown: URGENCIAS_PERSONA });
      }
      if (mode === "resumen") {
        return defineInstructions({ markdown: SUMMARY_PROMPT });
      }
      return defineInstructions({
        markdown: `${TURNOS_PERSONA}\n\n${turnosFechaBlock()}`,
      });
    },
  },
});
