import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { PacienteRow, AsignacionRow } from '../../../../product/types';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/doctores\/(\d+)\/liberar/);
    const doctorId = pathMatch ? Number(pathMatch[1]) : NaN;
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return NextResponse.json({ error: 'ID de doctor inválido' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 1) Obtener asignación activa (última cuyo paciente no esté atendido)
    const { data: asignacionActual, error: asignacionError } = await supabase
      .from('asignaciones')
      .select('id, paciente_id, hora_asignacion, pacientes ( id, atendido )')
      .eq('doctor_id', doctorId)
      .order('hora_asignacion', { ascending: false })
      .limit(1)
      .single();

    if (asignacionError && asignacionError.code !== 'PGRST116') {
      // PGRST116 puede ser no rows
      console.error('Error obteniendo asignación actual:', asignacionError);
      return NextResponse.json({ error: 'No se pudo obtener la asignación' }, { status: 500 });
    }

    // 2) Marcar paciente como atendido si hay asignación activa y no está atendido
    const pacienteRel = (asignacionActual as AsignacionRow)?.pacientes ?? null;
    const paciente: PacienteRow | null = Array.isArray(pacienteRel)
      ? (pacienteRel[0] ?? null)
      : (pacienteRel as PacienteRow | null);

    if (paciente && paciente.atendido === false) {
      const { error: markError } = await supabase
        .from('pacientes')
        .update({ atendido: true })
        .eq('id', paciente.id);
      if (markError) {
        console.error('Error marcando paciente atendido:', markError);
        return NextResponse.json({ error: 'No se pudo marcar atendido' }, { status: 500 });
      }
    }

    // 3) Intentar asignar siguiente paciente en espera según prioridad asc y hora_llegada asc
    const { data: nextPaciente, error: nextPacienteError } = await supabase
      .from('pacientes')
      .select('id, nombre, prioridad, hora_llegada, atendido')
      .eq('atendido', false)
      .order('prioridad', { ascending: true })
      .order('hora_llegada', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextPacienteError) {
      console.error('Error buscando siguiente paciente:', nextPacienteError);
      return NextResponse.json({ error: 'No se pudo obtener siguiente paciente' }, { status: 500 });
    }

    if (!nextPaciente) {
      // No hay siguiente: marcar doctor libre
      const { error: freeError } = await supabase
        .from('doctores')
        .update({ ocupado: false })
        .eq('id', doctorId);
      if (freeError) {
        console.error('Error liberando doctor:', freeError);
        return NextResponse.json({ error: 'No se pudo liberar el doctor' }, { status: 500 });
      }
      return NextResponse.json({ asignado: null, doctorLibre: true });
    }

    // 4) Asignar ese paciente al doctor
    const { error: setBusyError } = await supabase
      .from('doctores')
      .update({ ocupado: true })
      .eq('id', doctorId);
    if (setBusyError) {
      console.error('Error marcando doctor ocupado:', setBusyError);
      return NextResponse.json({ error: 'No se pudo actualizar estado del doctor' }, { status: 500 });
    }

    const { data: nuevaAsignacion, error: asignarError } = await supabase
      .from('asignaciones')
      .insert([{ doctor_id: doctorId, paciente_id: nextPaciente.id }])
      .select('id, hora_asignacion');
    if (asignarError) {
      console.error('Error creando nueva asignación:', asignarError);
      return NextResponse.json({ error: 'No se pudo crear la asignación' }, { status: 500 });
    }

    return NextResponse.json({ asignado: { doctor_id: doctorId, paciente: nextPaciente, asignacion: nuevaAsignacion?.[0] } });
  } catch (err) {
    console.error('Error en POST /api/doctores/[id]/liberar:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

