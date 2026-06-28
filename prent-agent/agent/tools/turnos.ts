import { defineDynamic, defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { modeFromAttributes } from "../lib/config.js";
import { fetchAvailability, bookTurno, groupIntoIntervals } from "../lib/turnos-api.js";
import {
  getDoctors,
  listSpecialties,
  filterBySpecialty,
  findDoctorByName,
} from "../lib/doctores-api.js";

// The scheduling toolset (4 turnos tools migrated from app/api/chat/turnos/route.ts + 3
// doctor/specialty tools from app/api/agendar/route.ts). Resolved dynamically so it is present
// ONLY in mode "turnos" — the clinical interview / triage modes get no tools, matching the
// original split. Names, descriptions, and schemas are preserved exactly. `execute` must be
// inline here (dynamic-tool durability requirement).
export default defineDynamic({
  events: {
    "session.started": (_event, ctx) => {
      const attributes = ctx.session.auth.current?.attributes as
        | Record<string, unknown>
        | undefined;
      if (modeFromAttributes(attributes) !== "turnos") return null;

      return {
        obtener_intervalos_libres: defineTool({
          description:
            "Returns free intervals for a date within a time range. Use startDate=endDate for a single day.",
          inputSchema: z.object({
            date: z.string(), // YYYY-MM-DD
            timeStart: z.string(), // HH:MM
            timeEnd: z.string(), // HH:MM
          }),
          execute: async ({ date, timeStart, timeEnd }) => {
            if (!date || !timeStart || !timeEnd) {
              return { error: "date, timeStart and timeEnd are required" };
            }
            try {
              const { ok, data } = await fetchAvailability({
                startDate: date,
                endDate: date,
                startTime: timeStart,
                endTime: timeEnd,
              });
              if (!ok) return data;
              const available = Array.isArray(data.available) ? data.available : [];
              return { date, intervals: groupIntoIntervals(available, date) };
            } catch (e) {
              return { error: "Failed to fetch free intervals: " + e };
            }
          },
        }),

        obtener_turnos_disponibles: defineTool({
          description: "Gets available appointments in a date and time range (inclusive)",
          inputSchema: z.object({
            dateStart: z.string(),
            dateEnd: z.string(),
            timeStart: z.string(),
            timeEnd: z.string(),
          }),
          execute: async ({ dateStart, dateEnd, timeStart, timeEnd }) => {
            if (!dateStart || !dateEnd || !timeStart || !timeEnd) {
              return { error: "dateStart, dateEnd, timeStart and timeEnd are required" };
            }
            try {
              const { data } = await fetchAvailability({
                startDate: dateStart,
                endDate: dateEnd,
                startTime: timeStart,
                endTime: timeEnd,
              });
              return data;
            } catch (e) {
              return { error: "Failed to fetch appointments: " + e };
            }
          },
        }),

        reservar_turno: defineTool({
          description:
            "Books an appointment for a patient; use obtener_turnos_disponibles first to verify availability",
          inputSchema: z.object({
            paciente: z.string(),
            date: z.string(),
            time: z.string(),
          }),
          // Booking is the one irreversible, patient-facing write. Gated on human approval per
          // eve's responsible-use guidance for healthcare actions. Use never() (or remove this
          // line) to restore the original auto-book behavior.
          approval: always(),
          execute: async ({ paciente, date, time }) => {
            if (!paciente || !date || !time) {
              return { error: "paciente, date and time are required" };
            }
            try {
              const { data } = await bookTurno({ paciente, date, time });
              return data; // data.turno.id is the booked appointment id
            } catch (e) {
              return { error: "Failed to book the appointment: " + e };
            }
          },
        }),

        terminar_reserva: defineTool({
          description:
            "Ends the appointment booking chat. Call only after the booking has been confirmed.",
          inputSchema: z.object({}),
          execute: async () => ({ message: "Se registró el turno. Gracias." }),
        }),

        // --- doctor / specialty discovery (migrated from app/api/agendar/route.ts) ---
        obtener_especialidades: defineTool({
          description: "Get all available medical specialties",
          inputSchema: z.object({}),
          execute: async () => {
            const doctors = await getDoctors();
            return { specialties: listSpecialties(doctors) };
          },
        }),

        obtener_doctores_por_especialidad: defineTool({
          description: "Get all doctors of a specific specialty",
          inputSchema: z.object({ specialty: z.string() }),
          execute: async ({ specialty }) => {
            const doctors = filterBySpecialty(await getDoctors(), specialty);
            return {
              specialty,
              doctors: doctors.map((d) => ({
                name: d.nombre,
                location: d.ubicacion,
                specialty: d.especialidad,
                availability: d.disponibilidad,
              })),
            };
          },
        }),

        verificar_disponibilidad_doctor: defineTool({
          description: "Check availability for a specific doctor on a specific day",
          inputSchema: z.object({ doctorName: z.string(), day: z.string() }),
          execute: async ({ doctorName, day }) => {
            const doctor = findDoctorByName(await getDoctors(), doctorName);
            if (!doctor) return { error: "Doctor not found" };
            const availableTimes = doctor.disponibilidad[day] ?? [];
            return {
              doctor: doctor.nombre,
              specialty: doctor.especialidad,
              location: doctor.ubicacion,
              day,
              availableTimes,
              isAvailable: availableTimes.length > 0,
            };
          },
        }),
      };
    },
  },
});
