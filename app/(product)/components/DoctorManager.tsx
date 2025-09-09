'use client';

import { useState } from 'react';
import type { Doctor, NewDoctor, UpdateDoctor } from '../types';
import { useDoctors } from '../contexts/DoctorContext';

interface DoctorManagerProps {
  onClose?: () => void;
}

export default function DoctorManager({ onClose }: DoctorManagerProps = {}) {
  const { doctors, addDoctor, updateDoctor, deleteDoctor } = useDoctors();
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [newDoctor, setNewDoctor] = useState<NewDoctor>({
    nombre: '',
    especialidad: '',
    disponibilidad: {
      lunes: [],
      martes: [],
      miercoles: [],
      jueves: [],
      viernes: [],
      sabado: [],
      domingo: []
    },
    estado: 'disponible',
    ubicacion: '',
    telefono: '',
    email: ''
  });

  const handleAddDoctor = () => {
    if (newDoctor.nombre && newDoctor.especialidad && newDoctor.ubicacion) {
      addDoctor(newDoctor);
      setNewDoctor({
        nombre: '',
        especialidad: '',
        disponibilidad: {
          lunes: [], martes: [], miercoles: [], jueves: [],
          viernes: [], sabado: [], domingo: []
        },
        estado: 'disponible',
        ubicacion: '',
        telefono: '',
        email: ''
      });
      setIsAddingDoctor(false);
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setNewDoctor({
      nombre: doctor.nombre,
      especialidad: doctor.especialidad,
      disponibilidad: doctor.disponibilidad,
      estado: doctor.estado,
      ubicacion: doctor.ubicacion,
      telefono: doctor.telefono || '',
      email: doctor.email || ''
    });
    setIsAddingDoctor(true);
  };

  const handleUpdateDoctor = () => {
    if (editingDoctor && newDoctor.nombre && newDoctor.especialidad && newDoctor.ubicacion) {
      updateDoctor(editingDoctor.id, newDoctor);
      setEditingDoctor(null);
      setIsAddingDoctor(false);
      setNewDoctor({
        nombre: '', especialidad: '', disponibilidad: {
          lunes: [], martes: [], miercoles: [], jueves: [],
          viernes: [], sabado: [], domingo: []
        },
        estado: 'disponible', ubicacion: '', telefono: '', email: ''
      });
    }
  };

  const handleDeleteDoctor = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este doctor?')) {
      deleteDoctor(id);
    }
  };

  const toggleTimeSlot = (day: keyof typeof newDoctor.disponibilidad, time: string) => {
    setNewDoctor(prev => ({
      ...prev,
      disponibilidad: {
        ...prev.disponibilidad,
        [day]: prev.disponibilidad[day].includes(time)
          ? prev.disponibilidad[day].filter(t => t !== time)
          : [...prev.disponibilidad[day], time]
      }
    }));
  };

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  const days: (keyof typeof newDoctor.disponibilidad)[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  return (
    <div className="w-96 bg-white/60 dark:bg-white/5 backdrop-blur border-r border-black/10 dark:border-white/10 flex flex-col h-full flex-shrink-0 overflow-hidden">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="lg:hidden flex justify-end p-3 border-b border-black/10 dark:border-white/10">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-black/70 dark:text-white/70 hover:text-brand hover:bg-brand/10 transition-all duration-200 ease-in-out"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-black/10 dark:border-white/10">
        <h2 className="text-lg font-semibold text-black dark:text-white mb-2">Gestión de Doctores</h2>
        <p className="text-xs text-black/70 dark:text-white/70">Administra la disponibilidad médica</p>
      </div>

      {/* Add/Edit Doctor Form */}
      {isAddingDoctor && (
        <div className="p-3 sm:p-4 border-b border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5">
          <h3 className="text-sm font-medium text-black dark:text-white mb-3">
            {editingDoctor ? 'Editar Doctor' : 'Agregar Nuevo Doctor'}
          </h3>
          
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre del doctor"
                value={newDoctor.nombre}
                onChange={(e) => setNewDoctor(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full text-sm border border-black/10 dark:border-white/10 rounded-lg p-2 pr-8 text-black dark:text-white bg-white/80 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400">*</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Especialidad"
                value={newDoctor.especialidad}
                onChange={(e) => setNewDoctor(prev => ({ ...prev, especialidad: e.target.value }))}
                className="w-full text-sm border border-black/10 dark:border-white/10 rounded-lg p-2 pr-8 text-black dark:text-white bg-white/80 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400">*</span>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Ubicación"
                value={newDoctor.ubicacion}
                onChange={(e) => setNewDoctor(prev => ({ ...prev, ubicacion: e.target.value }))}
                className="w-full text-sm border border-black/10 dark:border-white/10 rounded-lg p-2 pr-8 text-black dark:text-white bg-white/80 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400">*</span>
            </div>



            {/* Availability Grid */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-black/70 dark:text-white/70">Disponibilidad</p>
              <div className="text-xs text-black/60 dark:text-white/60 mb-2">
                <span className="inline-block w-3 h-3 bg-green-200 border border-green-300 mr-1"></span> Disponible
                <span className="inline-block w-3 h-3 bg-blue-500 border border-blue-600 ml-3 mr-1"></span> Ocupado
              </div>
              <div className="grid grid-cols-8 gap-1 text-xs">
                <div></div>
                {days.map(day => (
                  <div key={day} className="text-center text-black/60 dark:text-white/60 capitalize">
                    {day.slice(0, 3)}
                  </div>
                ))}
                {timeSlots.map(time => (
                  <div key={time} className="contents">
                    <div className="text-right text-black/60 dark:text-white/60 pr-2">
                      {time}
                    </div>
                    {days.map(day => (
                      <button
                        key={`${day}-${time}`}
                        onClick={() => toggleTimeSlot(day, time)}
                        className={`w-6 h-6 rounded border transition-all duration-200 ${
                          newDoctor.disponibilidad[day].includes(time)
                            ? 'bg-green-200 border-green-300 hover:bg-green-300'
                            : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingDoctor ? handleUpdateDoctor : handleAddDoctor}
                className="flex-1 bg-brand text-white rounded-lg py-2 px-3 text-sm font-medium hover:brightness-110 transition-all duration-200"
              >
                {editingDoctor ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                onClick={() => {
                  setIsAddingDoctor(false);
                  setEditingDoctor(null);
                  setNewDoctor({
                    nombre: '', especialidad: '', disponibilidad: {
                      lunes: [], martes: [], miercoles: [], jueves: [],
                      viernes: [], sabado: [], domingo: []
                    },
                    estado: 'disponible', ubicacion: '', telefono: '', email: ''
                  });
                }}
                className="flex-1 bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70 rounded-lg py-2 px-3 text-sm font-medium hover:bg-black/20 dark:hover:bg-white/20 transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Button */}
      {!isAddingDoctor && (
        <div className="p-3 sm:p-4">
          <button 
            className="group w-full bg-brand text-white rounded-2xl py-3 px-4 font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 hover:shadow-xl hover:shadow-brand/30 active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
            onClick={() => setIsAddingDoctor(true)}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ease-in-out group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Agregar Doctor</span>
          </button>
        </div>
      )}

      {/* Doctors List */}
      <div className="flex-1 px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 overflow-y-auto overflow-x-hidden min-h-0">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id} 
            className="group p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-brand/5 hover:-translate-y-0.5 hover:border-brand/15 dark:hover:border-brand/20 hover:bg-white/70 dark:hover:bg-white/8"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm transition-all duration-300 ease-in-out group-hover:text-brand truncate">
                {doctor.nombre}
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEditDoctor(doctor)}
                  className="p-1 text-black/50 dark:text-white/50 hover:text-brand hover:scale-110 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteDoctor(doctor.id)}
                  className="p-1 text-black/50 dark:text-white/50 hover:text-red-500 hover:scale-110 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <p className="text-xs text-black/70 dark:text-white/70 mb-1">{doctor.especialidad}</p>
            <p className="text-xs text-black/60 dark:text-white/60 mb-2">{doctor.ubicacion}</p>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-black/50 dark:text-white/50">
                {Object.values(doctor.disponibilidad).flat().length} horarios
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10">
        <div className="text-xs text-black/70 dark:text-white/70 text-center">
          <p className="font-medium">Total: {doctors.length} doctores</p>
        </div>
      </div>
    </div>
  );
}
