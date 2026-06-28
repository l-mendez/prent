// Client for the existing Prent /api/doctores/agent endpoint (doctors + specialties, DB+mock).
// Backs the specialty/doctor-discovery tools migrated from app/api/agendar/route.ts.
import { getBaseUrl } from "./config.js";

export type DoctorAvailability = Record<string, string[]>;

export type Doctor = {
  id: number;
  nombre: string;
  especialidad: string;
  ubicacion?: string;
  telefono?: string;
  email?: string;
  disponibilidad: DoctorAvailability;
};

export async function getDoctors(): Promise<Doctor[]> {
  const res = await fetch(new URL("/api/doctores/agent", getBaseUrl()).toString());
  const data = (await res.json()) as { doctors?: Doctor[] };
  return Array.isArray(data.doctors) ? data.doctors : [];
}

export function listSpecialties(doctors: Doctor[]): string[] {
  return [...new Set(doctors.map((d) => d.especialidad))].sort();
}

export function filterBySpecialty(doctors: Doctor[], specialty: string): Doctor[] {
  const q = specialty.toLowerCase();
  return doctors.filter((d) => d.especialidad.toLowerCase().includes(q));
}

export function findDoctorByName(doctors: Doctor[], name: string): Doctor | undefined {
  const q = name.toLowerCase();
  return doctors.find((d) => d.nombre.toLowerCase().includes(q));
}
