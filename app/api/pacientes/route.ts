import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/db/supabaseClient';
import type { NewPaciente } from '../../product/types';

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<NewPaciente> | null;
    const nombre = typeof payload?.nombre === 'string' ? payload.nombre.trim() : '';
    const prioridad = Number(payload?.prioridad);

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!Number.isInteger(prioridad) || prioridad < 1 || prioridad > 5) {
      return NextResponse.json({ error: 'La prioridad debe ser un entero entre 1 y 5' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('pacientes')
      .insert([{ nombre, prioridad }])
      .select('id, nombre, prioridad, hora_llegada, atendido')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'No se pudo insertar el paciente' }, { status: 500 });
    }

    if (error) throw error;

    // Intentar autoasignar si hay doctor libre
    const { data: doctorLibre, error: docError } = await supabase
      .from('doctores')
      .select('id')
      .eq('ocupado', false)
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!docError && doctorLibre) {
      await supabase.from('doctores').update({ ocupado: true }).eq('id', doctorLibre.id);
      await supabase.from('asignaciones').insert([{ doctor_id: doctorLibre.id, paciente_id: data.id }]);
    }

    return NextResponse.json({ paciente: data, asignadoA: doctorLibre?.id ?? null }, { status: 201 });
  } catch (err) {
    console.error('Error en /api/pacientes:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const atendidoParam = searchParams.get('atendido');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const orderParam = searchParams.get('order'); // 'prioridad_asc' | 'prioridad_desc' | 'hora_asc' | 'hora_desc'

    const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam))) : 50;
    const offset = offsetParam ? Math.max(0, Number(offsetParam)) : 0;

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from('pacientes')
      .select('id, nombre, prioridad, hora_llegada, atendido', { count: 'exact' });

    if (atendidoParam === 'true') query = query.eq('atendido', true);
    if (atendidoParam === 'false') query = query.eq('atendido', false);

    // Order
    if (orderParam === 'prioridad_asc') query = query.order('prioridad', { ascending: true });
    else if (orderParam === 'prioridad_desc') query = query.order('prioridad', { ascending: false });
    else if (orderParam === 'hora_asc') query = query.order('hora_llegada', { ascending: true });
    else query = query.order('hora_llegada', { ascending: false });

    // Pagination
    const from = offset;
    const to = offset + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Supabase select error:', error);
      return NextResponse.json({ error: 'No se pudieron obtener los pacientes' }, { status: 500 });
    }

    return NextResponse.json({ pacientes: data ?? [], count: count ?? 0, limit, offset });
  } catch (err) {
    console.error('Error en GET /api/pacientes:', err);
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 });
  }
}

