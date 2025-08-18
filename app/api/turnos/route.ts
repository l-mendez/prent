import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { Turno } from '../../product/types';

function isValidDateString(dateStr: string): boolean {
  // Expect format YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function isWeekday(dateStr: string): boolean {
  // Use UTC to avoid TZ issues; date-only strings are interpreted as UTC by spec
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  return day >= 1 && day <= 5;
}

function zeroPad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parseAndNormalizeTime(input: string): { ok: true; time: string } | { ok: false; error: string } {
  // Accept H, HH, H:MM, HH:MM, H:MM:SS, HH:MM:SS
  const match = input.trim().match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/);
  if (!match) return { ok: false, error: 'Formato de hora inválido. Usa HH:MM' };

  let hour = Number(match[1]);
  let minute = match[2] !== undefined ? Number(match[2]) : 0;
  const second = match[3] !== undefined ? Number(match[3]) : 0;

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || !Number.isInteger(second)) {
    return { ok: false, error: 'Hora inválida' };
  }

  // Allow minutes 0, 15, 30, 45, 60 (special case -> normalize to next hour)
  const allowedMinutes = new Set([0, 15, 30, 45, 60]);
  if (!allowedMinutes.has(minute)) {
    return { ok: false, error: 'Los minutos deben ser 0, 15, 30, 45 o 60' };
  }

  if (second !== 0) {
    return { ok: false, error: 'Los segundos deben ser 00' };
  }

  // Normalize 60 -> next hour : 00
  if (minute === 60) {
    hour += 1;
    minute = 0;
  }

  // Hours must be between 8 and 17 inclusive
  if (hour < 8 || hour > 17) {
    return { ok: false, error: 'La hora debe estar entre 8 y 17' };
  }

  // Disallow minutes after 17:00 (17:15/30/45 no permitidos)
  if (hour === 17 && minute !== 0) {
    return { ok: false, error: 'La última hora disponible del día es 17:00' };
  }

  const normalized = `${zeroPad(hour)}:${zeroPad(minute)}:00`;
  return { ok: true, time: normalized };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const url = new URL(request.url);
    const date = url.searchParams.get('date'); // YYYY-MM-DD
    const time = url.searchParams.get('time'); // HH:MM or HH:MM:SS

    // New interval parameters
    const startDate = url.searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = url.searchParams.get('endDate'); // YYYY-MM-DD
    const startTimeRaw = url.searchParams.get('startTime'); // HH:MM or HH:MM:SS
    const endTimeRaw = url.searchParams.get('endTime'); // HH:MM or HH:MM:SS

    // Helper to compare times in HH:MM:SS
    const timeToMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map((n) => Number(n));
      return hh * 60 + mm;
    };
    const minutesToTime = (m: number) => {
      const hh = Math.floor(m / 60);
      const mm = m % 60;
      return `${zeroPad(hh)}:${zeroPad(mm)}:00`;
    };

    // If any of the range params are present, we switch to availability mode
    const hasRangeParams = startDate || endDate || startTimeRaw || endTimeRaw;
    if (hasRangeParams) {
      // Validate presence of all required params
      if (!startDate || !endDate || !startTimeRaw || !endTimeRaw) {
        return NextResponse.json({ error: 'Se requieren startDate, endDate, startTime y endTime' }, { status: 400 });
      }
      if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        return NextResponse.json({ error: 'Parámetros de fecha inválidos. Usa YYYY-MM-DD' }, { status: 400 });
      }
      // Normalize and validate times
      const startTimeParsed = parseAndNormalizeTime(startTimeRaw);
      const endTimeParsed = parseAndNormalizeTime(endTimeRaw);
      if (!startTimeParsed.ok) {
        return NextResponse.json({ error: `startTime inválido: ${startTimeParsed.error}` }, { status: 400 });
      }
      if (!endTimeParsed.ok) {
        return NextResponse.json({ error: `endTime inválido: ${endTimeParsed.error}` }, { status: 400 });
      }

      const startTime = startTimeParsed.time; // HH:MM:00
      const endTime = endTimeParsed.time; // HH:MM:00

      // Validate chronological order
      if (startDate > endDate) {
        return NextResponse.json({ error: 'startDate no puede ser posterior a endDate' }, { status: 400 });
      }
      if (startDate === endDate && timeToMinutes(startTime) > timeToMinutes(endTime)) {
        return NextResponse.json({ error: 'En la misma fecha, startTime no puede ser mayor que endTime' }, { status: 400 });
      }

      // Fetch existing turnos within date range (filter times later in memory)
      const { data: existing, error: fetchError } = await supabase
        .from('turnos')
        .select('date,time,paciente')
        .gte('date', startDate)
        .lte('date', endDate);
      if (fetchError) {
        console.error('Error obteniendo turnos (intervalo):', fetchError);
        return NextResponse.json({ error: 'No se pudieron obtener los turnos' }, { status: 500 });
      }

      // Build a set of reserved slots (solo si tienen paciente asignado)
      const reservedSet = new Set<string>();
      (existing || []).forEach((t: { date: string; time: string; paciente: string }) => {
        const hasPaciente = t && typeof t.paciente === 'string' ? t.paciente.trim().length > 0 : !!t?.paciente;
        if (hasPaciente) {
          reservedSet.add(`${t.date}T${t.time}`);
        }
      });

      // Iterate dates from startDate to endDate inclusive
      const dayStart = '08:00:00';
      const dayEnd = '17:00:00';
      const results: { date: string; time: string }[] = [];

      const iterDate = (d: string) => new Date(`${d}T00:00:00Z`);
      const cursor = iterDate(startDate);
      const endCursor = iterDate(endDate);

      while (cursor.getTime() <= endCursor.getTime()) {
        const yyyy = cursor.getUTCFullYear();
        const mm = zeroPad(cursor.getUTCMonth() + 1);
        const dd = zeroPad(cursor.getUTCDate());
        const currentDate = `${yyyy}-${mm}-${dd}`;

        if (isWeekday(currentDate)) {
          // Determine time bounds for this day
          const isFirstDay = currentDate === startDate;
          const isLastDay = currentDate === endDate;
          const lower = isFirstDay ? startTime : dayStart;
          const upper = isLastDay ? endTime : dayEnd;

          let m = timeToMinutes(lower);
          const mUpper = timeToMinutes(upper);

          // If bounds inverted due to clamping, skip the day
          if (m <= mUpper) {
            for (; m <= mUpper; m += 15) {
              const t = minutesToTime(m);
              const key = `${currentDate}T${t}`;
              if (!reservedSet.has(key)) {
                results.push({ date: currentDate, time: t });
              }
            }
          }
        }

        // advance to next day
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      return NextResponse.json({ available: results });
    }

    let query = supabase.from('turnos').select('*').order('date', { ascending: true }).order('time', { ascending: true });

    if (date) {
      if (!isValidDateString(date)) {
        return NextResponse.json({ error: 'Parámetro date inválido. Usa YYYY-MM-DD' }, { status: 400 });
      }
      query = query.eq('date', date);
    }

    if (time) {
      const parsed = parseAndNormalizeTime(time);
      if (!parsed.ok) {
        return NextResponse.json({ error: `Parámetro time inválido: ${parsed.error}` }, { status: 400 });
      }
      query = query.eq('time', parsed.time);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error obteniendo turnos:', error);
      return NextResponse.json({ error: 'No se pudieron obtener los turnos' }, { status: 500 });
    }

    return NextResponse.json({ turnos: (data as Turno[]) ?? [] });
  } catch (err) {
    console.error('Error en GET /api/turnos:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json().catch(() => ({}));
    const { paciente, info, date, time } = body || {};

    if (!date || typeof date !== 'string' || !isValidDateString(date)) {
      return NextResponse.json({ error: 'El campo date es requerido y debe tener formato YYYY-MM-DD' }, { status: 400 });
    }
    if (!isWeekday(date)) {
      return NextResponse.json({ error: 'El día debe ser de semana (lunes a viernes)' }, { status: 400 });
    }

    if (!time || typeof time !== 'string') {
      return NextResponse.json({ error: 'El campo time es requerido y debe tener formato HH:MM' }, { status: 400 });
    }
    const parsed = parseAndNormalizeTime(time);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const insertPayload: Partial<Turno> = {
      paciente: paciente ?? null,
      info: info ?? null,
      date,
      time: parsed.time,
    };

    const { data, error } = await supabase
      .from('turnos')
      .insert([insertPayload])
      .select('*')
      .single();

    if (error) {
      console.error('Error creando turno:', error);
      return NextResponse.json({ error: 'No se pudo crear el turno' }, { status: 500 });
    }

    return NextResponse.json({ turno: data as Turno }, { status: 201 });
  } catch (err) {
    console.error('Error en POST /api/turnos:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    let id: number | null = null;
    if (idParam) {
      const n = Number(idParam);
      if (Number.isInteger(n) && n > 0) id = n;
    }
    if (!id) {
      // Try body fallback
      const body = await request.json().catch(() => ({}));
      const bodyId = body?.id;
      const n = Number(bodyId);
      if (Number.isInteger(n) && n > 0) id = n; else id = null;
    }

    if (!id) {
      return NextResponse.json({ error: 'Se requiere un id numérico para borrar' }, { status: 400 });
    }

    const { error } = await supabase.from('turnos').delete().eq('id', id);
    if (error) {
      console.error('Error borrando turno:', error);
      return NextResponse.json({ error: 'No se pudo borrar el turno' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('Error en DELETE /api/turnos:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json().catch(() => ({}));
    const idRaw = body?.id;
    const info = body?.info ?? null;

    const idNum = Number(idRaw);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Se requiere un id numérico válido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('turnos')
      .update({ info })
      .eq('id', idNum)
      .select('*')
      .single();

    if (error) {
      console.error('Error actualizando info del turno:', error);
      return NextResponse.json({ error: 'No se pudo actualizar el turno' }, { status: 500 });
    }

    return NextResponse.json({ turno: data });
  } catch (err) {
    console.error('Error en PATCH /api/turnos:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}


