'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';

type Turno = {
  id: number;
  created_at: string;
  paciente: string | null;
  info: unknown;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM[:SS]
};

type FetchState = {
  loading: boolean;
  error: string | null;
};

function toDateOnlyString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(date: Date): Date {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy;
}

function addDaysUTC(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const LOCALE = 'es';

function formatHumanDate(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

function formatWeekRangeText(monday: Date): string {
  const friday = addDaysUTC(monday, 4);
  const baseOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', timeZone: 'UTC' };
  const start = new Intl.DateTimeFormat(LOCALE, baseOpts).format(monday);
  const end = new Intl.DateTimeFormat(LOCALE, {
    ...baseOpts,
    year: monday.getUTCFullYear() !== friday.getUTCFullYear() ? 'numeric' : undefined,
  }).format(friday);
  return `${start} — ${end}`;
}

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour <= 16; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      slots.push(`${h}:${m}:00`);
    }
  }
  slots.push('17:00:00');
  return slots;
}

function timeLabel(t: string): string {
  // expects HH:MM:SS
  const [hh, mm] = t.split(':');
  return `${hh}:${mm}`;
}

function compactInfo(info: unknown): string {
  if (info == null) return '';
  if (typeof info === 'string') return info;
  try {
    const json = JSON.stringify(info);
    return json.length > 140 ? json.slice(0, 140) + '…' : json;
  } catch {
    return String(info);
  }
}

function fullInfo(info: unknown): string {
  if (info == null) return '';
  if (typeof info === 'string') return info;
  try {
    return JSON.stringify(info, null, 2);
  } catch {
    return String(info);
  }
}

export default function MisTurnosPage() {
  const [monday, setMonday] = useState<Date | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>({ loading: true, error: null });
  const [search, setSearch] = useState<string>('');
  const [openTurnoId, setOpenTurnoId] = useState<number | null>(null);

  useEffect(() => {
    // Compute current week strictly on client to avoid SSR/CSR mismatch
    setMonday(getMonday(new Date()));

    let cancelled = false;
    async function load() {
      setFetchState({ loading: true, error: null });
      try {
        const res = await fetch('/api/turnos', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudieron obtener los turnos');
        const data = (await res.json()) as { turnos: Turno[] };
        if (!cancelled) {
          setTurnos(Array.isArray(data.turnos) ? data.turnos : []);
          setFetchState({ loading: false, error: null });
        }
      } catch (e: unknown) {
        if (!cancelled) setFetchState({ loading: false, error: e instanceof Error ? e.message : 'Error inesperado' });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(() => (monday ? Array.from({ length: 5 }, (_, i) => addDaysUTC(monday, i)) : []), [monday]);
  const dayKeys = useMemo(() => days.map((d) => toDateOnlyString(d)), [days]);
  const slots = useMemo(() => buildTimeSlots(), []);

  const filteredTurnos = useMemo(() => {
    const lower = search.trim().toLowerCase();
    if (!lower) return turnos;
    return turnos.filter((t) => {
      const paciente = (t.paciente ?? '').toString().toLowerCase();
      const infoStr = compactInfo(t.info).toLowerCase();
      return paciente.includes(lower) || infoStr.includes(lower);
    });
  }, [turnos, search]);

  const turnosByDateAndTime = useMemo(() => {
    const map = new Map<string, Map<string, Turno[]>>();
    for (const t of filteredTurnos) {
      if (!map.has(t.date)) map.set(t.date, new Map());
      const byTime = map.get(t.date)!;
      const normalizedTime = t.time.length === 5 ? `${t.time}:00` : t.time;
      if (!byTime.has(normalizedTime)) byTime.set(normalizedTime, []);
      byTime.get(normalizedTime)!.push(t);
    }
    return map;
  }, [filteredTurnos]);

  function previousWeek() {
    setMonday((m) => (m ? addDaysUTC(m, -7) : m));
  }
  function nextWeek() {
    setMonday((m) => (m ? addDaysUTC(m, 7) : m));
  }
  function thisWeek() {
    setMonday(getMonday(new Date()));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Calendario de Turnos</h2>
            <p className="text-gray-500">Vista semanal del consultorio (Lun - Vie)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={previousWeek} className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100">← Semana anterior</button>
            <button onClick={thisWeek} className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100">Esta semana</button>
            <button onClick={nextWeek} className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100">Semana siguiente →</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div className="text-gray-600" suppressHydrationWarning>
            <span className="font-medium">Semana:</span> {monday ? formatWeekRangeText(monday) : '—'}
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente o info…"
              className="w-full md:w-80 rounded-lg border-gray-300 focus-medical px-3 py-2"
            />
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span> Ocupado
              <span className="inline-block w-3 h-3 rounded-sm bg-white border border-dashed border-gray-300"></span> Libre
            </div>
          </div>
        </div>

        {fetchState.loading || !monday ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : fetchState.error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {fetchState.error}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white medical-shadow">
            {/* Column headers */}
            <div className="grid grid-cols-6 text-sm bg-gray-50 border-b border-gray-200">
              <div className="px-3 py-2 text-gray-500">Hora</div>
              {days.map((d) => (
                <div key={d.toISOString()} className="px-3 py-2 font-medium text-gray-700">
                  {formatHumanDate(d)}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-6">
              {/* Time column */}
              <div className="bg-gray-50 border-r border-gray-200">
                {slots.map((slot) => (
                  <div key={slot} className="h-14 text-xs text-gray-500 px-3 py-2 border-b border-gray-100 flex items-start">
                    {timeLabel(slot)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dayKeys.map((dayKey) => (
                <div key={dayKey} className="border-r last:border-r-0 border-gray-200">
                  {slots.map((slot) => {
                    const items = turnosByDateAndTime.get(dayKey)?.get(slot) ?? [];
                    if (items.length === 0) {
                      return (
                        <div key={slot} className="h-14 border-b border-gray-100 bg-white">
                          <div className="h-full w-full border border-dashed border-transparent hover:border-gray-200 transition-colors"></div>
                        </div>
                      );
                    }
                    // Order by patient name, then id
                    const ordered = [...items].sort((a, b) => {
                      const an = (a.paciente ?? '').toString().toLowerCase();
                      const bn = (b.paciente ?? '').toString().toLowerCase();
                      if (an && bn) return an.localeCompare(bn);
                      if (an) return -1;
                      if (bn) return 1;
                      return a.id - b.id;
                    });
                    return (
                      <div key={slot} className="h-14 border-b border-gray-100 px-2 py-2">
                        {ordered.map((t) => (
                          <div
                            key={t.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setOpenTurnoId((prev) => (prev === t.id ? null : t.id))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setOpenTurnoId((prev) => (prev === t.id ? null : t.id));
                              }
                            }}
                            className="cursor-pointer group w-full rounded-lg bg-emerald-500 text-white px-3 py-2 flex flex-col justify-center medical-shadow"
                          >
                            <div className="text-sm font-semibold truncate">{t.paciente ?? 'Sin nombre'}</div>
                            {compactInfo(t.info) && (
                              <div className="text-xs opacity-90 truncate">{compactInfo(t.info)}</div>
                            )}
                            {openTurnoId === t.id && (
                              <div className="mt-2 text-xs bg-white text-gray-800 border border-gray-200 rounded-md px-2 py-2 shadow-sm max-h-40 overflow-auto whitespace-pre-wrap">
                                {fullInfo(t.info) || 'Sin descripción'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


