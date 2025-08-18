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
    'nav.solutions': 'Solutions',
    'nav.how': 'How it works',
    'nav.contact': 'Contact',
    'nav.demo': 'Book a demo',
    
    // Hero section
    'hero.title': 'AI Solutions for',
    'hero.title.hospitals': 'hospitals',
    'hero.description': 'Prent AI streamlines patient flow, reduces operational delays, and uncovers revenue integrity opportunities across your hospital network. We are a team of engineers that are passionate about using AI to improve the quality of care.',
    'hero.demo': 'Book a demo',
    'hero.how': 'How it works',
    
    // Value props
    'value.consultation.title': 'More efficient consultations',
    'value.consultation.desc': 'Use AI to speed up consultations and reduce wait times.',
    'value.medics.title': 'Light the weight on medics',
    'value.medics.desc': 'By automating processes, medics can focus on what they do best.',
    'value.outcomes.title': 'Better patient outcomes',
    'value.outcomes.desc': 'Pacients spend less time in the hospital and get better care.',
    
    // How it works
    'how.title': 'Deploy in weeks, not months.',
    'how.description': 'We integrate using industry-standard interfaces and a secure, audit-ready data plane. Start with one service line and expand across your network.',
    'how.pilot': 'Pilot in one department',
    'how.tools': 'Works with your existing tools',
    'how.lift': 'No heavy lift for IT',
    
    // CTA
    'cta.title': 'See Prent AI in action',
    'cta.description': 'Request a walkthrough tailored to your hospital\'s needs.',
    'cta.demo': 'Book a demo',
    
    // Footer
    'footer.tagline': 'AI orchestration for hospital operations.',
  },
  es: {
    // Header
    'nav.solutions': 'Soluciones',
    'nav.how': 'Cómo funciona',
    'nav.contact': 'Contacto',
    'nav.demo': 'Reservar demo',
    
    // Hero section
    'hero.title': 'Soluciones de IA para',
    'hero.title.hospitals': 'hospitales',
    'hero.description': 'Prent AI optimiza el flujo de pacientes, reduce los retrasos operativos y descubre oportunidades de integridad de ingresos en toda su red hospitalaria. Somos un equipo de ingenieros apasionados por usar la IA para mejorar la calidad de la atención.',
    'hero.demo': 'Reservar demo',
    'hero.how': 'Cómo funciona',
    
    // Value props
    'value.consultation.title': 'Consultas más eficientes',
    'value.consultation.desc': 'Usa IA para acelerar las consultas y reducir los tiempos de espera.',
    'value.medics.title': 'Alivia la carga de los médicos',
    'value.medics.desc': 'Al automatizar procesos, los médicos pueden enfocarse en lo que mejor saben hacer.',
    'value.outcomes.title': 'Mejores resultados para pacientes',
    'value.outcomes.desc': 'Los pacientes pasan menos tiempo en el hospital y reciben mejor atención.',
    
    // How it works
    'how.title': 'Despliega en semanas, no meses.',
    'how.description': 'Nos integramos usando interfaces estándar de la industria y un plano de datos seguro y listo para auditorías. Comienza con una línea de servicio y expándete por toda tu red.',
    'how.pilot': 'Piloto en un departamento',
    'how.tools': 'Funciona con tus herramientas existentes',
    'how.lift': 'Sin carga pesada para TI',
    
    // CTA
    'cta.title': 'Prent AI en acción',
    'cta.description': 'Solicita una demostración adaptada a las necesidades de tu hospital.',
    'cta.demo': 'Reservar demo',
    
    // Footer
    'footer.tagline': 'Orquestación de IA para operaciones hospitalarias.',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  
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
