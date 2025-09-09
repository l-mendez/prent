'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Doctor, NewDoctor, UpdateDoctor } from '../types';
import { mockDoctors } from '../data/mockDoctors';

interface DoctorContextType {
  doctors: Doctor[];
  addDoctor: (doctor: NewDoctor) => Promise<void>;
  updateDoctor: (id: number, updates: UpdateDoctor) => void;
  deleteDoctor: (id: number) => void;
  getDoctorsBySpecialty: (specialty: string) => Doctor[];
  getAvailableDoctors: () => Doctor[];
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function DoctorProvider({ children }: { children: ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Use shared mock data
  useEffect(() => {
    setDoctors(mockDoctors);
  }, []);

  const addDoctor = async (doctorData: NewDoctor) => {
    try {
      const response = await fetch('/api/doctores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(doctorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Database error details:', errorData);
        throw new Error(`Failed to save doctor to database: ${errorData.details || errorData.error}`);
      }

      const { doctor: savedDoctor } = await response.json();
      
      const doctor: Doctor = {
        id: savedDoctor.id,
        nombre: savedDoctor.nombre,
        especialidad: savedDoctor.especialidad,
        disponibilidad: doctorData.disponibilidad, // Keep the availability from the form
        estado: savedDoctor.ocupado ? 'ocupado' : 'disponible', // Map ocupado to estado
        ubicacion: doctorData.ubicacion || 'Consultorio General',
        telefono: doctorData.telefono,
        email: doctorData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setDoctors(prev => {
        const exists = prev.some(d => d.id === doctor.id);
        if (exists) {
          console.warn('Doctor with ID', doctor.id, 'already exists, skipping duplicate');
          return prev;
        }
        return [...prev, doctor];
      });
    } catch (error) {
      console.error('Error saving doctor:', error);
      const doctor: Doctor = {
        ...doctorData,
        id: Math.max(...mockDoctors.map(d => d.id), 0) + Math.random() * 1000, // Generate unique ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setDoctors(prev => {
        const exists = prev.some(d => d.id === doctor.id);
        if (exists) {
          console.warn('Doctor with ID', doctor.id, 'already exists, skipping duplicate');
          return prev;
        }
        return [...prev, doctor];
      });
    }
  };

  const updateDoctor = (id: number, updates: UpdateDoctor) => {
    setDoctors(prev => prev.map(d => 
      d.id === id 
        ? { ...d, ...updates, updated_at: new Date().toISOString() }
        : d
    ));
  };

  const deleteDoctor = (id: number) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const getDoctorsBySpecialty = (specialty: string) => {
    return doctors.filter(d => 
      d.especialidad.toLowerCase().includes(specialty.toLowerCase()) && 
      d.estado === 'disponible'
    );
  };

  const getAvailableDoctors = () => {
    return doctors.filter(d => d.estado === 'disponible');
  };

  const value: DoctorContextType = {
    doctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctorsBySpecialty,
    getAvailableDoctors
  };

  return (
    <DoctorContext.Provider value={value}>
      {children}
    </DoctorContext.Provider>
  );
}

export function useDoctors() {
  const context = useContext(DoctorContext);
  if (context === undefined) {
    throw new Error('useDoctors must be used within a DoctorProvider');
  }
  return context;
}

