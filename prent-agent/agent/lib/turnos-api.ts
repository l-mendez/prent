// Thin client for the existing Prent `/api/turnos` REST endpoint (Supabase-backed).
//
// The original route built an absolute URL from the incoming request's origin. eve tools run
// outside any HTTP request, so the base URL comes from the environment (see lib/config.ts).
import { getBaseUrl } from "./config.js";

export type AvailableSlot = { date: string; time: string };
export type Interval = { start: string; end: string };

export type AvailabilityResponse = {
  available?: AvailableSlot[];
  error?: string;
};

export type Turno = {
  id: number;
  paciente: string | null;
  info: unknown;
  date: string;
  time: string;
};

export type BookResponse = {
  turno?: Turno;
  error?: string;
};

function turnosUrl(params?: Record<string, string>): URL {
  const url = new URL("/api/turnos", getBaseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

export async function fetchAvailability(args: {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}): Promise<{ ok: boolean; data: AvailabilityResponse }> {
  const url = turnosUrl({
    startDate: args.startDate,
    endDate: args.endDate,
    startTime: args.startTime,
    endTime: args.endTime,
  });
  const res = await fetch(url.toString());
  const data = (await res.json()) as AvailabilityResponse;
  return { ok: res.ok, data };
}

export async function bookTurno(args: {
  paciente: string;
  date: string;
  time: string;
}): Promise<{ ok: boolean; data: BookResponse }> {
  const res = await fetch(turnosUrl().toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = (await res.json()) as BookResponse;
  return { ok: res.ok, data };
}

// Group contiguous 15-minute slots for a single date into [start, end) intervals.
// Ported verbatim from the obtener_intervalos_libres tool in the original route.
export function groupIntoIntervals(
  available: AvailableSlot[],
  date: string,
): Interval[] {
  const toMinutes = (t: string) => {
    const [hh, mm] = t.split(":").map((n) => Number(n));
    return hh * 60 + mm;
  };
  const toTime = (m: number) => {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const minutes = available
    .filter((s) => s.date === date)
    .map((s) => s.time)
    .sort()
    .map(toMinutes);

  const intervals: Interval[] = [];
  if (minutes.length > 0) {
    let start = minutes[0];
    let prev = minutes[0];
    for (let i = 1; i < minutes.length; i++) {
      const m = minutes[i];
      if (m !== prev + 15) {
        intervals.push({ start: toTime(start), end: toTime(prev + 15) });
        start = m;
      }
      prev = m;
    }
    intervals.push({ start: toTime(start), end: toTime(prev + 15) });
  }
  return intervals;
}
