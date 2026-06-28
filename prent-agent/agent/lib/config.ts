// Base URL of the existing Prent Next.js app that serves /api/turnos and /api/doctores/agent.
// eve tools run outside any HTTP request, so the origin comes from the environment.
export function getBaseUrl(): string {
  return (
    process.env.TURNOS_API_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

// "turnos" = scheduler (Claudia); "consultorio"/"urgencias" = clinical interview / ER triage;
// "resumen" = summary+triage generator (the migrated /api/summary), called by the frontend with
// a {summary, triage} outputSchema.
export type Mode = "turnos" | "consultorio" | "urgencias" | "resumen";
export const MODES: readonly Mode[] = ["turnos", "consultorio", "urgencias", "resumen"];

// Reads the per-session mode an authenticated caller carries on its auth attributes.
// Defaults to "turnos" (the original primary agent) for header-less callers (e.g. the eve TUI).
export function modeFromAttributes(
  attributes: Record<string, unknown> | undefined,
): Mode {
  const raw = attributes?.mode;
  return typeof raw === "string" && (MODES as readonly string[]).includes(raw)
    ? (raw as Mode)
    : "turnos";
}
