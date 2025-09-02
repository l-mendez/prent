"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'nav.demo': 'Demo',
    
    // Hero section
    'hero.title': 'AI Solutions for',
    'hero.title.hospitals': 'hospitals',
    'hero.description': 'Prent streamlines patient flow, reduces operational delays, and uncovers revenue integrity opportunities across your hospital network. We are a team of engineers that are passionate about using AI to improve the quality of care.',
    'hero.demo': 'Demo',
    
    // Value props
    'value.consultation.title': 'More efficient consultations',
    'value.consultation.desc': 'Use AI to speed up consultations and reduce wait times.',
    'value.medics.title': 'Light the weight on medics',
    'value.medics.desc': 'By automating processes, medics can focus on what they do best.',
    'value.outcomes.title': 'Better patient outcomes',
    'value.outcomes.desc': 'Pacients spend less time in the hospital and get better care.',
    'value.clickToExplore': 'Click to explore',
    
    // How it works
    'how.title': 'Deploy in weeks, not months.',
    'how.description': 'We integrate using industry-standard interfaces and a secure, audit-ready data plane. Start with one service line and expand across your network.',
    'how.pilot': 'Pilot in one department',
    'how.tools': 'Works with your existing tools',
    'how.lift': 'No heavy lift for IT',
    
    // CTA
    'cta.title': 'See Prent in action',
    'cta.description': 'Request a walkthrough tailored to your hospital\'s needs.',
    'cta.demo': 'Demo',
    
    // Footer
    'footer.tagline': 'AI orchestration for hospital operations.',
  },
  es: {
    // Header
    'nav.demo': 'Demo',
    
    // Hero section
    'hero.title': 'Soluciones de IA para',
    'hero.title.hospitals': 'hospitales',
    'hero.description': 'Nuestro objetivo es mejorar la calidad de la atención, reducir los retrasos operativos, y reducir costos en el sector de la salud.',
    'hero.demo': 'Demo',
    
    // Value props
    'value.consultation.title': 'Chat Pre Consulta/Urgencias',
    'value.consultation.desc': 'Un chat para reservar turnos, realizar triajes, y extraer informacion de los pacientes para acelerar consultas.',
    'value.medics.title': 'Asistente de voz de consultas medicas',
    'value.medics.desc': 'Escucha la entrevista entre el medico y el paciente y genera la historia clinica.',
    'value.outcomes.title': 'Visualización de calendario',
    'value.outcomes.desc': 'Los turnos reservados por el agente a partir de la entrevista',
    'value.clickToExplore': 'Haz clic para explorar',
    
    // How it works
    'how.title': 'Despliega en semanas, no meses.',
    'how.description': 'Nos integramos usando interfaces estándar de la industria y un plano de datos seguro y listo para auditorías. Comienza con una línea de servicio y expándete por toda tu red.',
    'how.pilot': 'Piloto en un departamento',
    'how.tools': 'Funciona con tus herramientas existentes',
    'how.lift': 'Sin carga pesada para TI',
    
    // CTA
    'cta.title': 'Prent en acción',
    'cta.description': 'Solicita una demostración adaptada a las necesidades de tu hospital.',
    'cta.demo': 'Demo',
    
    // Footer
    'footer.tagline': 'Orquestación de IA para operaciones hospitalarias.',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');
  
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
