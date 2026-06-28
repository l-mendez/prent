"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./contexts/LanguageContext";

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="relative" id="top">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
        <div className="pointer-events-none absolute -top-10 sm:-top-20 -left-10 sm:-left-20 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
        <div className="pointer-events-none absolute top-20 sm:top-40 -right-8 sm:-right-16 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-20">
          <div className="max-w-2xl">
            <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
              {t('hero.title')} <span className="bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">{t('hero.title.hospitals')}</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-black/70 dark:text-white/70 max-w-xl leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link 
                href="/consultorio" 
                className="group inline-flex items-center justify-center rounded-full bg-brand px-6 sm:px-8 py-3 sm:py-4 text-white font-medium shadow-lg transition-all duration-500 ease-in-out hover:brightness-110 hover:scale-105 hover:shadow-xl hover:shadow-brand/30 active:scale-95 text-sm sm:text-base"
              >
                <span>{t('hero.demo')}</span>
                <svg 
                  className="ml-2 h-4 w-4 transition-all duration-500 ease-in-out group-hover:translate-x-1 group-hover:scale-110" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6 sm:pb-10">
        </div>
      </section>

      {/* Feature: Gestión de turnos automática */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:items-center">
          {/* Copy */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Gestión de turnos automática</h2>
            <p className="mt-4 text-black/70 dark:text-white/70 leading-relaxed">
              Asistente que agenda turnos por chat de forma autónoma y en tiempo real.
            </p>
            <Link 
              href="/consultorio"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 sm:px-8 py-3 sm:py-4 text-white font-medium shadow-lg transition-all duration-200 ease-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              Probar
              <svg 
                className="ml-2 h-4 w-4 transition-transform duration-200 ease-out" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Phone with chat */}
          <div className="relative flex justify-center md:justify-end">
            <div className="w-[280px] sm:w-[320px] rounded-[2rem] border-2 border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-3 shadow-2xl">
              {/* Notch */}
              <div className="mx-auto mb-3 h-5 w-28 rounded-b-xl bg-black/10 dark:bg-white/10" />
              <div className="h-[440px] overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 flex flex-col gap-2">
                {/* Messages */}
                <div className="flex flex-col gap-2 text-[13px] leading-relaxed">
                  {/* User */}
                  <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-brand text-white px-3 py-2 shadow-sm">
                    Hola quisiera sacar un turno para el martes que viene
                  </div>
                  {/* Bot */}
                  <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    Dale, a qué hora estabas buscando?
                  </div>
                  {/* User */}
                  <div className="self-end max-w-[70%] rounded-2xl rounded-tr-sm bg-brand text-white px-3 py-2 shadow-sm">
                    A las 4 de la tarde
                  </div>
                  {/* Bot */}
                  <div className="self-start max-w-[90%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    Disculpá a las 16:00 no tenemos disponibilidad
                  </div>
                  <div className="self-start max-w-[90%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    Pero te puedo ofrecer a las 16:30
                  </div>
                  <div className="self-start max-w-[60%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    Te sirve?
                  </div>
                </div>
                {/* Input bar (decorative) */}
                <div className="mt-auto flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-3 py-2 text-black/70 dark:text-white/70">
                  <div className="h-2 w-2 rounded-full bg-brand/80" />
                  <div className="text-xs">Escribí un mensaje…</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* Design partner banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/10 to-transparent mb-8 sm:mb-10" />
      </div>

      {/* Feature: Asistente de voz */}
      <section id="voice-assistant" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:items-start">
          {/* Transcript + mic + CTA */}
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Asistente de voz</h2>
            <p className="mt-4 text-black/70 dark:text-white/70 leading-relaxed">
              Dictá o grabá la entrevista médica. La IA construye el resumen clínico al instante.
            </p>

            {/* Transcript card */}
            <div className="mt-6 rounded-2xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 backdrop-blur p-4 sm:p-5">
              <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand" />
                  <p className="text-black/80 dark:text-white/85"><strong>Médico:</strong> Contame, ¿qué te trae hoy a la consulta?</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                  <p className="text-black/80 dark:text-white/85"><strong>Paciente:</strong> Desde ayer a la tarde tengo dolor de garganta y un poco de fiebre.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand" />
                  <p className="text-black/80 dark:text-white/85"><strong>Médico:</strong> ¿Tenés tos, dificultad para tragar o mocos?</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />
                  <p className="text-black/80 dark:text-white/85"><strong>Paciente:</strong> Un poco de tos seca y me duele al tragar. No tuve contactos con enfermos.</p>
                </div>
              </div>

              {/* Mic button */}
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand text-white shadow-lg hover:brightness-110 hover:scale-105 active:scale-95 transition-all"
                  aria-label="Grabar entrevista"
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="text-xs sm:text-sm text-black/60 dark:text-white/60">Grabar/pausar</span>
              </div>

            </div>
          </div>

          {/* Summary bullets */}
          <div className="md:pl-6">
            <div className="rounded-2xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 backdrop-blur p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold">Resumen clínico</h3>
              <ul className="mt-4 space-y-3 text-sm sm:text-base">
                <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand/5 hover:shadow-sm border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span><strong>Motivo:</strong> Odinofagia con fiebre de 24 h.</span>
                </li>
                <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand/5 hover:shadow-sm border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span><strong>Síntomas:</strong> Dolor al tragar, tos seca, sin congestión nasal.</span>
                </li>
                <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand/5 hover:shadow-sm border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span><strong>Antecedentes:</strong> Niega contactos enfermos. Sin comorbilidades relevantes.</span>
                </li>
                <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand/5 hover:shadow-sm border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span><strong>Impresión:</strong> Faringitis probable. Evaluar tests rápidos si disponible.</span>
                </li>
                <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-brand/5 hover:shadow-sm border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span><strong>Conducta:</strong> Analgésicos/antiinflamatorios, hidratación, signos de alarma.</span>
                </li>
              </ul>
            </div>
          </div>
          {/* CTA moved to come after summary on mobile; spans full width on desktop */}
          <div className="md:col-span-2">
            <Link 
              href="/record"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 sm:px-8 py-3 sm:py-4 text-white font-medium shadow-lg transition-all duration-200 ease-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              Probar asistente de voz
              <svg 
                className="ml-2 h-4 w-4 transition-transform duration-200 ease-out" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature: Analizador de estudios */}
      <section id="study-analyzer" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3 md:items-center">
          {/* Mobile order: 1) Title/desc 2) Files 3) Arrow 4) Summary 5) CTA */}
          {/* Heading + description */}
          <div className="order-1 md:order-1 md:col-start-1 md:col-span-3 md:row-start-1 md:pr-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Analizador de estudios</h2>
            <p className="mt-3 text-black/70 dark:text-white/70 leading-relaxed">
              Subí múltiples estudios (PDFs, imágenes, informes). Nuestra IA los procesa y genera un resumen clínico.
            </p>
          </div>
          {/* Left: File/Image symbols collage */}
          <div className="order-2 md:order-3 md:col-start-1 md:row-start-2">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1 - PDF */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-brand">
                  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  <text x="8" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">PDF</text>
                </svg>
              </div>
              {/* Card 2 - Image */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-400">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 14l3-3 3 3 2-2 4 4" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                </svg>
              </div>
              {/* Card 3 - DOC */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-brand">
                  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  <text x="7.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">DOC</text>
                </svg>
              </div>
              {/* Card 4 - DICOM */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-brand">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="2"/>
                  <text x="6.5" y="20" fontSize="5" fill="currentColor" fontFamily="ui-sans-serif, system-ui">DICOM</text>
                </svg>
              </div>
              {/* Card 5 - ZIP */}
              <div className="col-span-2 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-400">
                  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 7h4M10 9h4M10 11h4M12 13v5" stroke="currentColor" strokeWidth="2"/>
                  <text x="8.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">ZIP</text>
                </svg>
              </div>
              {/* Card 6 - CSV */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-brand">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 9h12M6 12h12M6 15h8" stroke="currentColor" strokeWidth="2"/>
                  <text x="6.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">CSV</text>
                </svg>
              </div>
              {/* Card 7 - XLS */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-400">
                  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  <text x="7.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">XLS</text>
                </svg>
              </div>
              {/* Card 8 - TXT */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-brand">
                  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/>
                  <text x="8.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">TXT</text>
                </svg>
              </div>
              {/* Card 9 - JSON */}
              <div className="col-span-1 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-400">
                  <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 9c0-1 1-1 1-1m6 0s1 0 1 1m-8 6c0 1 1 1 1 1m6 0s1 0 1-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <text x="6.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">JSON</text>
                </svg>
              </div>
              {/* Card 10 - JPG/PNG */}
              <div className="col-span-2 rounded-xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-brand">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 15l3-4 3 3 2-2 4 5" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                  <text x="6.5" y="20" fontSize="6" fill="currentColor" fontFamily="ui-sans-serif, system-ui">JPG</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Middle: Arrow */}
          <div className="order-3 md:order-4 md:col-start-2 md:row-start-2 flex items-center justify-center">
            <div className="rounded-full border border-black/15 dark:border-white/15 bg-white/60 dark:bg-white/10 p-3 sm:p-4 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7 text-brand">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Right: Summary card */}
          <div className="order-4 md:order-2 md:col-start-3 md:row-start-2 md:pl-4">
            <div className="mt-2 sm:mt-5 rounded-2xl border-2 border-black/15 dark:border-white/15 bg-white/70 dark:bg-white/8 p-4">
              <h3 className="text-base sm:text-lg font-semibold">Resumen de hallazgos</h3>
              <ul className="mt-3 space-y-3 text-sm sm:text-base">
                <li className="group flex items-start gap-3 p-3 rounded-lg hover:bg-brand/5 transition-colors border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span>3 estudios con patrón intersticial leve; sugerir control clínico.</span>
                </li>
                <li className="group flex items-start gap-3 p-3 rounded-lg hover:bg-brand/5 transition-colors border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span>1 informe menciona nódulo tiroideo de 6 mm; correlacionar con ecografía previa.</span>
                </li>
                <li className="group flex items-start gap-3 p-3 rounded-lg hover:bg-brand/5 transition-colors border border-transparent hover:border-brand/20">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                  <span>Laboratorio sin alteraciones relevantes; PCR y hemograma dentro de rangos.</span>
                </li>
              </ul>
            </div>
          </div>
          {/* CTA - after summary on mobile, bottom row on desktop */}
          <div className="order-5 md:order-4 md:col-span-3">
            <Link 
              href="/estudios"
              className="mt-2 sm:mt-4 inline-flex items-center justify-center rounded-full bg-brand px-6 sm:px-8 py-3 sm:py-4 text-white font-medium shadow-lg transition-all duration-200 ease-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              Subir estudios
              <svg 
                className="ml-2 h-4 w-4 transition-transform duration-200 ease-out" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature: Urgencias (tablet chat + triage) */}
      <section id="urgencias" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:items-start">
          {/* Mobile order: 1) Title 2) Desc 3) Tablet chat 4) Triage 5) CTA */}
          {/* Right column: title, description, triage, CTA */}
          <div className="order-1 md:order-2 md:col-start-2 md:row-start-1 flex flex-col">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">Urgencias y triage</h2>
            <p className="mt-3 text-black/70 dark:text-white/70 leading-relaxed">Clasificación automática según criterios de triage, priorizando pacientes de alto riesgo.</p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl border-2 border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-4">
                <h3 className="font-semibold text-red-600 dark:text-red-400">Rojo</h3>
                <p className="mt-1 text-sm text-red-900/80 dark:text-red-200/90">Atención inmediata</p>
                <ul className="mt-2 text-xs space-y-1 text-red-900/80 dark:text-red-200/90">
                  <li>Dolor torácico + disnea</li>
                  <li>Compromiso hemodinámico</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-4">
                <h3 className="font-semibold text-amber-600 dark:text-amber-400">Amarillo</h3>
                <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/90">Urgente</p>
                <ul className="mt-2 text-xs space-y-1 text-amber-900/80 dark:text-amber-200/90">
                  <li>Fiebre alta persistente</li>
                  <li>Dolor moderado</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10 p-4">
                <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">Verde</h3>
                <p className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-200/90">Menor</p>
                <ul className="mt-2 text-xs space-y-1 text-emerald-900/80 dark:text-emerald-200/90">
                  <li>Resfrío sin disnea</li>
                  <li>Dolor leve</li>
                </ul>
              </div>
            </div>
            <Link 
              href="/urgencias"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 sm:px-8 py-3 sm:py-4 text-white font-medium shadow-lg transition-all duration-200 ease-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              Probar triage
              <svg 
                className="ml-2 h-4 w-4 transition-transform duration-200 ease-out" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          {/* Tablet with chat */}
          <div className="order-2 md:order-1 md:col-start-1 md:row-start-1 flex justify-center md:justify-start">
            <div className="w-[360px] sm:w-[420px] rounded-[1.5rem] border-2 border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-2xl">
              {/* Camera + bezel */}
              <div className="mx-auto mb-4 h-2 w-16 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="h-[460px] overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 flex flex-col gap-3">
                <div className="text-xs text-black/50 dark:text-white/50 self-center">Triage asistido</div>
                <div className="flex flex-col gap-2 text-[13px] leading-relaxed">
                  <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    Hola, soy tu asistente. ¿Cuál es tu motivo de consulta?
                  </div>
                  <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-brand text-white px-3 py-2 shadow-sm">
                    Dolor en el pecho desde hace 30 minutos, con sudor frío.
                  </div>
                  <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    ¿Tuvo dificultad para respirar o se irradia el dolor al brazo?
                  </div>
                  <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-brand text-white px-3 py-2 shadow-sm">
                    Sí, al brazo izquierdo y me falta el aire.
                  </div>
                  <div className="self-start max-w-[90%] rounded-2xl rounded-tl-sm bg-white dark:bg-white/10 text-black/80 dark:text-white/85 px-3 py-2 shadow-sm border border-black/10 dark:border-white/10">
                    Gracias. Clasificando riesgo...
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 px-3 py-2 text-black/70 dark:text-white/70">
                  <div className="h-2 w-2 rounded-full bg-brand/80" />
                  <div className="text-xs">Escribí un mensaje…</div>
                </div>
              </div>
            </div>
          </div>
          {/* Removed separate triage and CTA wrappers in favor of the right column above */}
        </div>
      </section>

      {/* Value props (cards under triage) */}
      <section id="solutions" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 md:items-stretch">
          {[
            {
              title: 'Consultorio',
              desc: 'Agenda + interrogatorio clínico con resumen configurable.',
              icon: "/icons/capacity.svg",
              href: "/consultorio",
            },
            {
              title: 'Urgencias',
              desc: 'Triage configurable + interrogatorio clínico y resumen.',
              icon: "/icons/coordination.svg",
              href: "/urgencias",
            },
            {
              title: 'Asistente de Voz',
              desc: 'Dictá o grabá la consulta y la IA arma el resumen.',
              icon: "/icons/coordination.svg",
              href: "/record",
            },
            {
              title: 'Analizador de Estudios',
              desc: 'Carga cientos de estudios, obtené un resumen y preguntá con citas.',
              icon: "/icons/coordination.svg",
              href: "/estudios",
            },
          ].map((item) => {
            const content = (
              <div className="group h-full flex flex-col rounded-2xl border-2 border-black/20 dark:border-white/20 p-4 sm:p-6 bg-white/70 dark:bg-white/8 backdrop-blur transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-brand/20 hover:-translate-y-1 hover:border-brand hover:bg-white dark:hover:bg-white/15 active:scale-98 active:translate-y-0 cursor-pointer relative overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center mb-4 transition-all duration-300 ease-in-out group-hover:bg-brand/15 group-hover:scale-105">
                  <Image src={item.icon} alt="" width={24} height={24} className="transition-all duration-300 ease-in-out group-hover:scale-105" />
                </div>
                {/* Subtle click indicator */}
                <div className="absolute top-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-medium text-brand bg-brand/10 px-2 py-1 rounded-full">{t('value.clickToExplore')}</span>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between flex-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base sm:text-lg transition-all duration-300 ease-in-out group-hover:text-brand underline decoration-transparent group-hover:decoration-brand/50 decoration-2 underline-offset-2">{item.title}</h3>
                      <p className="mt-2 text-sm text-black/70 dark:text-white/70 transition-all duration-300 ease-in-out group-hover:text-black/80 dark:group-hover:text-white/85 leading-relaxed">{item.desc}</p>
                    </div>
                    {/* Prominent clickable arrow */}
                    <div className="ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-brand/10 border border-brand/20 transition-all duration-300 ease-in-out group-hover:translate-x-1 group-hover:bg-brand group-hover:border-brand group-hover:scale-110 animate-pulse group-hover:animate-none">
                      <svg 
                        className="h-4 w-4 text-brand group-hover:text-white transition-colors duration-300" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );

            return item.href ? (
              <Link key={item.title} href={item.href} className="block h-full transition-all duration-300 ease-in-out hover:scale-102 active:scale-100">
                {content}
              </Link>
            ) : (
              <div key={item.title} className="h-full transition-all duration-300 ease-in-out hover:scale-101">
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">{t('how.title')}</h2>
            <p className="mt-4 text-black/70 dark:text-white/70 leading-relaxed">
              {t('how.description')}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-2 hover:bg-brand/5 hover:shadow-md hover:scale-[1.02] cursor-default border border-transparent hover:border-brand/20">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-brand/50 flex-shrink-0" /> 
                <span className="transition-all duration-300 ease-in-out group-hover:text-brand group-hover:font-medium leading-relaxed">{t('how.pilot')}</span>
              </li>
              <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-2 hover:bg-brand/5 hover:shadow-md hover:scale-[1.02] cursor-default border border-transparent hover:border-brand/20" style={{transitionDelay: '0.1s'}}>
                <span className="mt-1 h-2 w-2 rounded-full bg-brand transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-brand/50 flex-shrink-0" /> 
                <span className="transition-all duration-300 ease-in-out group-hover:text-brand group-hover:font-medium leading-relaxed">{t('how.tools')}</span>
              </li>
              <li className="group flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:translate-x-2 hover:bg-brand/5 hover:shadow-md hover:scale-[1.02] cursor-default border border-transparent hover:border-brand/20" style={{transitionDelay: '0.2s'}}>
                <span className="mt-1 h-2 w-2 rounded-full bg-brand transition-all duration-300 ease-in-out group-hover:scale-150 group-hover:shadow-lg group-hover:shadow-brand/50 flex-shrink-0" /> 
                <span className="transition-all duration-300 ease-in-out group-hover:text-brand group-hover:font-medium leading-relaxed">{t('how.lift')}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 p-6 sm:p-8 text-center bg-gradient-to-r from-brand/10 to-cyan-400/10 transition-all duration-500 ease-out hover:shadow-xl hover:shadow-brand/10 hover:border-brand/15 dark:hover:border-brand/20 hover:from-brand/12 hover:to-cyan-400/12">
          {/* Simplified background animation */}
          <div className="pointer-events-none absolute -bottom-6 sm:-bottom-10 -left-6 sm:-left-10 h-32 w-32 sm:h-56 sm:w-56 rounded-full bg-brand/15 blur-3xl transition-all duration-700 ease-out group-hover:bg-brand/20 group-hover:scale-105" />
          <div className="pointer-events-none absolute -top-6 sm:-top-10 -right-6 sm:-right-10 h-32 w-32 sm:h-56 sm:w-56 rounded-full bg-cyan-400/15 blur-3xl transition-all duration-700 ease-out group-hover:bg-cyan-400/20 group-hover:scale-105" />
          
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight transition-colors duration-300 ease-out group-hover:text-brand">{t('cta.title')}</h2>
            <p className="mt-2 sm:mt-4 text-sm sm:text-base text-black/70 dark:text-white/70 transition-colors duration-300 ease-out group-hover:text-black dark:group-hover:text-white leading-relaxed">{t('cta.description')}</p>
            <Link
              href="/consultorio"
              className="mt-6 sm:mt-8 inline-flex items-center justify-center rounded-full bg-brand px-6 sm:px-8 py-3 sm:py-4 text-white font-medium shadow-lg transition-all duration-200 ease-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <span>{t('cta.demo')}</span>
              <svg 
                className="ml-2 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      
    </div>
  );
}
