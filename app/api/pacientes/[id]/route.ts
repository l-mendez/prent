import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import type { PatchBody } from '../../../product/types';

export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/pacientes\/(\d+)$/);
    const id = pathMatch ? Number(pathMatch[1]) : NaN;
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    let atendido = true; // por defecto marcamos atendido=true
    try {
      const body = (await request.json()) as PatchBody | null;
      if (body && typeof body.atendido === 'boolean') {
        atendido = body.atendido;
      }
    } catch {
      // body opcional; ignoramos errores de parseo
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('pacientes')
      .update({ atendido })
      .eq('id', id)
      .select('id, nombre, prioridad, hora_llegada, atendido')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      // Si no existe, supabase puede responder con row not found
      const notFound = (error as unknown as { code?: string; message?: string }).message?.toLowerCase().includes('row') ?? false;
      return NextResponse.json(
        { error: notFound ? 'Paciente no encontrado' : 'No se pudo actualizar el paciente' },
        { status: notFound ? 404 : 500 }
      );
    }

    return NextResponse.json({ paciente: data });
  } catch (err) {
    console.error('Error en PATCH /api/pacientes/[id]:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

