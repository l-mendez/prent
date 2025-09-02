'use client';

import { useChatConfig } from '@/app/(product)/components/ChatConfigContext';

interface SidebarProps {
  onClose?: () => void;
  onNewChat?: () => void;
}

export default function Sidebar({ onClose, onNewChat }: SidebarProps = {}) {
  const {
    mode,
    summaryFormat,
    setSummaryFormat,
    keyInfo,
    setKeyInfo,
    triageCriteria,
    setTriageCriteria,
    configLocked,
    chatLocked,
    resetConfig,
  } = useChatConfig();

  const disabled = configLocked || chatLocked;

  return (
    <div className="w-80 bg-white/60 dark:bg-white/5 backdrop-blur border-r border-black/10 dark:border-white/10 flex flex-col h-full flex-shrink-0 overflow-hidden">
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

      {/* New Chat Button */}
      <div className="p-3 sm:p-4">
        <button 
          className="group w-full bg-brand text-white rounded-2xl py-3 px-4 font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:scale-105 hover:shadow-xl hover:shadow-brand/30 active:scale-95 flex items-center justify-center space-x-2 text-sm sm:text-base"
          onClick={() => {
            onNewChat?.();
            onClose?.();
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ease-in-out group-hover:scale-105" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva consulta</span>
        </button>
      </div>

      {/* Configuration Panel in Sidebar */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-black/70 dark:text-white/70">Modo</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${mode === 'urgencias' ? 'bg-red-100 text-red-700' : 'bg-cyan-100 text-cyan-700'}`}>
                {mode === 'urgencias' ? 'Urgencias' : 'Consultorio'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
              <label className="block text-xs font-medium text-black/70 dark:text-white/70 mb-1">Formato del resumen</label>
              <textarea
                className="w-full text-xs font-mono border border-black/10 dark:border-white/10 rounded-md p-2 text-black dark:text-white bg-white/80 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-black/10 disabled:text-black/50 dark:disabled:bg-white/10 dark:disabled:text-white/50 disabled:cursor-not-allowed"
                rows={4}
                placeholder={`Ejemplo:\nMOTIVO DE CONSULTA:\n\nANTECEDENTES PERSONALES:\n...`}
                value={summaryFormat}
                onChange={(e) => setSummaryFormat(e.target.value)}
                disabled={disabled}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-black/60 dark:text-white/60">Mantené títulos en MAYÚSCULAS y orden fijo.</p>
                <span className="text-[11px] text-black/60 dark:text-white/60">{summaryFormat.length} caracteres</span>
              </div>
            </div>

            {mode === 'consultorio' && (
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                <label className="block text-xs font-medium text-black/70 dark:text-white/70 mb-1">Información clave a priorizar</label>
                <textarea
                  className="w-full text-xs border border-black/10 dark:border-white/10 rounded-md p-2 text-black dark:text-white bg-white/80 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-black/10 disabled:text-black/50 dark:disabled:bg-white/10 dark:disabled:text-white/50 disabled:cursor-not-allowed"
                  rows={4}
                  placeholder={`Ejemplo:\n- Síntomas clave (inicio, duración, intensidad, localización...)\n- Banderas rojas\n- Antecedentes y riesgos pertinentes`}
                  value={keyInfo}
                  onChange={(e) => setKeyInfo(e.target.value)}
                  disabled={disabled}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] text-black/60 dark:text-white/60">Usá viñetas cortas y directas.</p>
                  <span className="text-[11px] text-black/60 dark:text-white/60">{keyInfo.length} caracteres</span>
                </div>
              </div>
            )}

            {mode === 'urgencias' && (
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                <label className="block text-xs font-medium text-black/70 dark:text-white/70 mb-1">Criterios de triaje (editable)</label>
                <textarea
                  className="w-full text-xs border border-black/10 dark:border-white/10 rounded-md p-2 text-black dark:text-white bg-white/80 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-black/10 disabled:text-black/50 dark:disabled:bg-white/10 dark:disabled:text-white/50 disabled:cursor-not-allowed"
                  rows={6}
                  placeholder={`Rojo: ...\nNaranja: ...\nAmarillo: ...\nVerde: ...\nAzul: ...`}
                  value={triageCriteria}
                  onChange={(e) => setTriageCriteria(e.target.value)}
                  disabled={disabled}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] text-black/60 dark:text-white/60">Un criterio por línea en el formato “Nivel: condiciones”.</p>
                  <span className="text-[11px] text-black/60 dark:text-white/60">{triageCriteria.length} caracteres</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                onClick={resetConfig}
                className="inline-flex items-center gap-1 rounded-md border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-1.5 text-xs font-medium text-black/80 dark:text-white/80 hover:bg-white active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                disabled={disabled}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10" />
                  <path d="M3.51 15A9 9 0 0018.36 18.36L23 14" />
                </svg>
                Restablecer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10">
        <div className="text-xs text-black/70 dark:text-white/70 text-center">
          <p className="font-medium">Prent v1.0</p>
          <p className="mt-1 text-black/50 dark:text-white/50">Sólo para profesionales médicos</p>
        </div>
      </div>
    </div>
  );
}