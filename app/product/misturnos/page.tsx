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
    <div className="relative min-h-screen w-screen flex flex-col">
      {/* Background effects similar to marketing page */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-10 sm:-top-20 -left-10 sm:-left-20 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute top-20 sm:top-40 -right-8 sm:-right-16 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />
      
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-y-auto flex flex-col min-h-0">
        <div className="mb-4 sm:mb-6 text-center flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            Calendario de <span className="bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">Turnos</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-black/70 dark:text-white/70 max-w-2xl mx-auto px-2">
            Vista semanal del consultorio con gestión inteligente de citas (Lun - Vie)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 flex-shrink-0">
          <div className="text-black/70 dark:text-white/70 text-center sm:text-left" suppressHydrationWarning>
            <span className="font-medium">Semana:</span> {monday ? formatWeekRangeText(monday) : '—'}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-end">
            <button 
              onClick={previousWeek} 
              className="group px-3 sm:px-4 py-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-black dark:text-white font-medium transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/20 hover:shadow-md active:scale-95 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">← Anterior</span>
              <span className="sm:hidden">←</span>
            </button>
            <button 
              onClick={thisWeek} 
              className="group px-3 sm:px-4 py-2 rounded-2xl bg-brand text-white font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 active:scale-95 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Esta semana</span>
              <span className="sm:hidden">Hoy</span>
            </button>
            <button 
              onClick={nextWeek} 
              className="group px-3 sm:px-4 py-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-black dark:text-white font-medium transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/20 hover:shadow-md active:scale-95 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Siguiente →</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente o info…"
              className="w-full sm:w-64 md:w-80 px-3 sm:px-4 py-2 sm:py-3 border border-black/10 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs sm:text-sm text-black/70 dark:text-white/70">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-brand shadow-lg shadow-brand/30"></span> 
              <span>Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-white/60 dark:bg-white/10 border border-dashed border-black/20 dark:border-white/20"></span> 
              <span>Libre</span>
            </div>
          </div>
        </div>

        {fetchState.loading || !monday ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand/20 border-t-brand"></div>
          </div>
        ) : fetchState.error ? (
          <div className="p-4 rounded-2xl border border-red-300/30 bg-red-50/80 dark:bg-red-900/20 backdrop-blur text-red-700 dark:text-red-300 shadow-lg">
            {fetchState.error}
          </div>
        ) : (
          <div className="flex-1 w-full rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-white/5 backdrop-blur shadow-lg min-h-0 flex flex-col">
            {/* Desktop Grid View */}
            <div className="hidden lg:block flex-1">
              {/* Column headers */}
              <div className="grid grid-cols-6 text-sm bg-white/40 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex-shrink-0" style={{ minWidth: '800px' }}>
                <div className="px-3 py-2 text-black/70 dark:text-white/70 font-medium" style={{ width: '120px' }}>Hora</div>
                {days.map((d) => (
                  <div key={d.toISOString()} className="px-3 py-2 font-semibold text-black dark:text-white" style={{ width: '136px' }}>
                    {formatHumanDate(d)}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-6" style={{ minWidth: '800px' }}>
                {/* Time column */}
                <div className="bg-white/40 dark:bg-white/5 border-r border-black/10 dark:border-white/10">
                  {slots.map((slot) => (
                    <div key={slot} className="h-14 text-xs text-black/60 dark:text-white/60 px-3 py-2 border-b border-black/5 dark:border-white/5 flex items-start font-medium">
                      {timeLabel(slot)}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {dayKeys.map((dayKey) => (
                  <div key={dayKey} className="border-r last:border-r-0 border-black/10 dark:border-white/10">
                    {slots.map((slot) => {
                      const items = turnosByDateAndTime.get(dayKey)?.get(slot) ?? [];
                      if (items.length === 0) {
                        return (
                          <div key={slot} className="h-14 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-white/5">
                            <div className="h-full w-full border border-dashed border-transparent hover:border-black/20 dark:hover:border-white/20 transition-colors"></div>
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
                        <div key={slot} className="h-14 border-b border-black/5 dark:border-white/5 px-2 py-2">
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
                              className="cursor-pointer group w-full rounded-xl bg-brand text-white px-3 py-2 flex flex-col justify-center shadow-lg shadow-brand/30 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 transition-all duration-300 ease-in-out active:scale-95"
                            >
                              <div className="text-sm font-semibold truncate">{t.paciente ?? 'Sin nombre'}</div>
                              {compactInfo(t.info) && (
                                <div className="text-xs opacity-90 truncate">{compactInfo(t.info)}</div>
                              )}
                              {openTurnoId === t.id && (
                                <div className="mt-2 text-xs bg-white/90 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10 rounded-lg px-2 py-2 shadow-lg backdrop-blur max-h-40 overflow-auto whitespace-pre-wrap">
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
            </div>

            {/* Mobile List View */}
            <div className="lg:hidden flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 w-full">
                {days.map((day, dayIndex) => {
                  const dayKey = dayKeys[dayIndex];
                  const dayTurnos = filteredTurnos.filter(t => t.date === dayKey);
                  
                  return (
                    <div key={dayKey} className="bg-white/40 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden w-full">
                      <div className="px-3 sm:px-4 py-3 bg-white/60 dark:bg-white/10 border-b border-black/10 dark:border-white/10">
                        <h3 className="font-semibold text-black dark:text-white text-sm sm:text-base truncate">
                          {formatHumanDate(day)}
                        </h3>
                      </div>
                      <div className="p-2 sm:p-3">
                        {dayTurnos.length === 0 ? (
                          <p className="text-black/50 dark:text-white/50 text-center py-4 text-sm">
                            No hay turnos programados
                          </p>
                        ) : (
                          <div className="space-y-2 w-full">
                            {dayTurnos
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map((turno) => (
                                <div
                                  key={turno.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => setOpenTurnoId((prev) => (prev === turno.id ? null : turno.id))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setOpenTurnoId((prev) => (prev === turno.id ? null : turno.id));
                                    }
                                  }}
                                  className="cursor-pointer group w-full rounded-xl bg-brand text-white p-3 shadow-lg shadow-brand/30 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 transition-all duration-300 ease-in-out active:scale-95 min-w-0"
                                >
                                  <div className="w-full min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full flex-shrink-0">
                                        {timeLabel(turno.time.length === 5 ? `${turno.time}:00` : turno.time)}
                                      </span>
                                    </div>
                                    <div className="text-sm font-semibold truncate w-full mb-1">{turno.paciente ?? 'Sin nombre'}</div>
                                    {compactInfo(turno.info) && (
                                      <div className="text-xs opacity-90 truncate w-full">{compactInfo(turno.info)}</div>
                                    )}
                                  </div>
                                  {openTurnoId === turno.id && (
                                    <div className="mt-3 text-xs bg-white/90 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 shadow-lg backdrop-blur max-h-40 overflow-auto break-words w-full">
                                      {fullInfo(turno.info) || 'Sin descripción'}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
