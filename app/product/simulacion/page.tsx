"use client";
import { useEffect, useState } from 'react';

type Doctor = {
  id: number;
  nombre: string;
  especialidad: string;
  ocupado: boolean;
  currentPaciente: null | {
    id: number;
    nombre: string;
    prioridad: number;
    hora_llegada: string;
    asignacion_id: number;
    hora_asignacion: string;
  };
};

export default function SimulacionPage() {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctores = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/doctores', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudieron cargar los doctores');
      const json = await res.json();
      setDoctores(json.doctores || []);
    } catch (err) {
      setError('Error cargando doctores:' + err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctores();
    const id = setInterval(fetchDoctores, 4000);
    return () => clearInterval(id);
  }, []);

  const liberarDoctor = async (doctorId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/doctores/${doctorId}/liberar`, { method: 'POST' });
      if (!res.ok) throw new Error('No se pudo liberar');
      await fetchDoctores();
    } catch (err) {
      setError('No se pudo liberar el doctor:' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Simulación de guardia</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDoctores}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-white hover:opacity-90 disabled:opacity-50"
          >
            Refrescar
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctores.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-slate-900">{d.nombre}</div>
                <div className="text-xs text-slate-500">{d.especialidad}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${d.ocupado ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                {d.ocupado ? 'Ocupado' : 'Libre'}
              </span>
            </div>

            <div className="mt-3 text-sm">
              {d.currentPaciente ? (
                <div className="space-y-1">
                  <div className="font-medium">Paciente actual</div>
                  <div className="text-slate-700">{d.currentPaciente.nombre}</div>
                  <div className="text-slate-500 text-xs">Prioridad: {d.currentPaciente.prioridad}</div>
                  <div className="text-slate-500 text-xs">Asignado: {new Date(d.currentPaciente.hora_asignacion).toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-slate-500">Sin paciente asignado</div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={() => liberarDoctor(d.id)}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300"
              >
                Liberar y tomar siguiente
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

