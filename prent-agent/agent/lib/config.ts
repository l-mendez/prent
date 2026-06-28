// "consultorio"/"urgencias" = clinical interview / ER triage; "resumen" = summary+triage
// generator (the migrated /api/summary), called by the frontend with a {summary, triage}
// outputSchema.
export type Mode = "consultorio" | "urgencias" | "resumen";
export const MODES: readonly Mode[] = ["consultorio", "urgencias", "resumen"];

// Reads the per-session mode an authenticated caller carries on its auth attributes.
// Defaults to "consultorio" for header-less callers (e.g. the eve TUI).
export function modeFromAttributes(
  attributes: Record<string, unknown> | undefined,
): Mode {
  const raw = attributes?.mode;
  return typeof raw === "string" && (MODES as readonly string[]).includes(raw)
    ? (raw as Mode)
    : "consultorio";
}
