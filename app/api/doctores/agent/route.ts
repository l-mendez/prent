import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/db/supabaseClient';
import { mockDoctors } from '@/app/(product)/data/mockDoctors';
import type { Doctor } from '@/app/(product)/types';

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: dbDoctors, error: dbError } = await supabase
      .from('doctores')
      .select('id, nombre, especialidad, ocupado')
      .order('id', { ascending: true });

    let doctors: Doctor[] = [...mockDoctors];

    if (!dbError && dbDoctors) {
      const dbDoctorsFormatted: Doctor[] = dbDoctors.map((dbDoc, index) => {
        const mockDoctor = mockDoctors[index % mockDoctors.length];
        
        return {
          id: dbDoc.id,
          nombre: dbDoc.nombre,
          especialidad: dbDoc.especialidad,
          disponibilidad: mockDoctor.disponibilidad, // mock availability for now
          estado: dbDoc.ocupado ? 'ocupado' : 'disponible', 
          ubicacion: mockDoctor.ubicacion, // mock location for now
          telefono: mockDoctor.telefono, // mock phone for now
          email: mockDoctor.email, // mock email for now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      doctors = [...doctors, ...dbDoctorsFormatted];
    } else if (dbError) {
      console.error('Error obteniendo doctores de DB:', dbError);
      // just mock data if DB fails
    }

    return NextResponse.json({ doctors });
  } catch (err) {
    console.error('Error en GET /api/doctores/agent:', err);
    return NextResponse.json({ doctors: mockDoctors });
  }
}
