-- Remove the appointments/scheduling + ER-queue simulation subsystem end-to-end.
-- These tables backed the deleted UI (agendar, misturnos, simulacion), API routes
-- (turnos, agendar, doctores, pacientes) and the eve "turnos" agent mode.
DROP TABLE IF EXISTS public.asignaciones CASCADE;
DROP TABLE IF EXISTS public.turnos CASCADE;
DROP TABLE IF EXISTS public.doctores CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
