import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/db/supabaseClient';
import type { DoctorWithCurrent, PacienteRel } from '@/app/(product)/types';

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const [{ data: doctores, error: doctoresError }, { data: asignaciones, error: asignacionesError }] = await Promise.all([
      supabase.from('doctores').select('id, nombre, especialidad, ocupado').order('id', { ascending: true }),
      supabase
        .from('asignaciones')
        .select('id, doctor_id, paciente_id, hora_asignacion, pacientes ( id, nombre, prioridad, hora_llegada, atendido )')
        .order('hora_asignacion', { ascending: false }),
    ]);

    if (doctoresError) {
      console.error('Error obteniendo doctores:', doctoresError);
      return NextResponse.json({ error: 'No se pudieron obtener doctores' }, { status: 500 });
    }
    if (asignacionesError) {
      console.error('Error obteniendo asignaciones:', asignacionesError);
      return NextResponse.json({ error: 'No se pudieron obtener asignaciones' }, { status: 500 });
    }

    const activeByDoctor = new Map<number, DoctorWithCurrent['currentPaciente']>();
    for (const a of asignaciones ?? []) {
      const rel = (a as unknown as { pacientes?: PacienteRel | PacienteRel[] | null }).pacientes ?? null;
      const p: PacienteRel | null = Array.isArray(rel) ? (rel[0] ?? null) : rel;
      if (p && p.atendido === false && !activeByDoctor.has(a.doctor_id)) {
        activeByDoctor.set(a.doctor_id, {
          id: p.id,
          nombre: p.nombre,
          prioridad: p.prioridad,
          hora_llegada: p.hora_llegada,
          asignacion_id: a.id,
          hora_asignacion: a.hora_asignacion,
        });
      }
    }

    const result: DoctorWithCurrent[] = (doctores ?? []).map((d) => ({
      id: d.id,
      nombre: d.nombre,
      especialidad: d.especialidad,
      ocupado: d.ocupado,
      currentPaciente: activeByDoctor.get(d.id) ?? null,
    }));

    return NextResponse.json({ doctores: result });
  } catch (err) {
    console.error('Error en GET /api/doctores:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

