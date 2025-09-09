import type { Doctor, DoctorStatus } from '../types';

export const mockDoctors: Doctor[] = [
  {
    id: 1,
    nombre: 'Dr. María González',
    especialidad: 'Cardiología',
    disponibilidad: {
      lunes: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      martes: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      miercoles: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      jueves: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      viernes: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      sabado: ['09:00', '10:00'],
      domingo: []
    },
    estado: 'disponible' as DoctorStatus,
    ubicacion: 'Consultorio A - 2do Piso',
    telefono: '+54 11 1234-5678',
    email: 'maria.gonzalez@clinica.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    nombre: 'Dr. Carlos Rodríguez',
    especialidad: 'Pediatría',
    disponibilidad: {
      lunes: ['08:00', '09:00', '10:00', '13:00', '14:00'],
      martes: ['08:00', '09:00', '10:00', '13:00', '14:00'],
      miercoles: ['08:00', '09:00', '10:00', '13:00', '14:00'],
      jueves: ['08:00', '09:00', '10:00', '13:00', '14:00'],
      viernes: ['08:00', '09:00', '10:00', '13:00', '14:00'],
      sabado: ['08:00', '09:00'],
      domingo: []
    },
    estado: 'disponible' as DoctorStatus,
    ubicacion: 'Consultorio B - 1er Piso',
    telefono: '+54 11 1234-5679',
    email: 'carlos.rodriguez@clinica.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    nombre: 'Dr. Ana Martínez',
    especialidad: 'Traumatología',
    disponibilidad: {
      lunes: ['10:00', '11:00', '15:00', '16:00'],
      martes: ['10:00', '11:00', '15:00', '16:00'],
      miercoles: ['10:00', '11:00', '15:00', '16:00'],
      jueves: ['10:00', '11:00', '15:00', '16:00'],
      viernes: ['10:00', '11:00', '15:00', '16:00'],
      sabado: [],
      domingo: []
    },
    estado: 'disponible' as DoctorStatus,
    ubicacion: 'Consultorio C - 1er Piso',
    telefono: '+54 11 1234-5680',
    email: 'ana.martinez@clinica.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    nombre: 'Dra. Laura Fernández',
    especialidad: 'Ginecología',
    disponibilidad: {
      lunes: ['08:00', '09:00', '14:00', '15:00'],
      martes: ['08:00', '09:00', '14:00', '15:00'],
      miercoles: ['08:00', '09:00', '14:00', '15:00'],
      jueves: ['08:00', '09:00', '14:00', '15:00'],
      viernes: ['08:00', '09:00', '14:00', '15:00'],
      sabado: ['08:00', '09:00'],
      domingo: []
    },
    estado: 'disponible' as DoctorStatus,
    ubicacion: 'Consultorio D - 2do Piso',
    telefono: '+54 11 1234-5681',
    email: 'laura.fernandez@clinica.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export type DayOfWeek = 'domingo' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
