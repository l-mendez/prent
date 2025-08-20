'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type ResponseFormat = {
  message: string;
  suggestions: string[];
  reserved?: boolean;
  turnoId?: number;
  shouldSummarize?: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hasGeneratedSummary, setHasGeneratedSummary] = useState(false);
  const [configLocked, setConfigLocked] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [triageDraft, setTriageDraft] = useState<null | { level: 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul'; reason?: string }>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const defaultSummaryFormat = `MOTIVO DE CONSULTA:
  

ANTECEDENTES PERSONALES:
- ENFERMEDADES PREVIAS/CRÓNICAS:
- INTERNACIONES:
-  ALERGIAS:
-  VACUNAS:
-  ALCOHOL:
-  TABACO:
-  DROGAS:
-  CIRUGÍAS:
-  GINECOLÓGICOS:
-  DIETA:
-  EJERCICIO:
-  TRATAMIENTO HABITUAL:

ANTECEDENTES FAMILIARES:
`;
  const defaultKeyInfo = `Sexo\n Edad\n Enfermedades previas o crónicas importantes\n Síntomas clave del problema principal (inicio, duración, intensidad, localización/lateralidad, curso, desencadenantes/alivio, síntomas asociados relevantes)\n Banderas rojas del motivo\n Antecedentes y riesgos pertinentes al caso (no todos si no cambian la conducta): ENFERMEDADES PREVIAS/CRÓNICAS, INTERNACIONES, ALERGIAS, VACUNAS, ALCOHOL, TABACO, DROGAS, CIRUGÍAS, GINECOLÓGICOS, DIETA, EJERCICIO, TRATAMIENTO HABITUAL`;

  const [summaryFormat, setSummaryFormat] = useState<string>(defaultSummaryFormat);
  const [keyInfo, setKeyInfo] = useState<string>(defaultKeyInfo);
  const defaultTriageCriteria = `Rojo: Paro cardíaco, dificultad respiratoria severa, hemorragia incontrolable.
Naranja: Dolor torácico agudo, fractura expuesta, convulsiones.
Amarillo: Fiebre alta, dolor abdominal moderado, heridas leves.
Verde: Dolor de cabeza leve, resfriado común, esguince leve.
Azul: Cita de seguimiento, solicitud de receta, malestar general leve.`;
  const [triageCriteria, setTriageCriteria] = useState<string>(defaultTriageCriteria);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const [mode, setMode] = useState<'urgencias' | 'consultorio'>('consultorio');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const configDetailsRef = useRef<HTMLDetailsElement>(null);
  const chatLocked = hasGeneratedSummary; // Bloquea el chat tras el primer resumen generado
  const [hasAppointment, setHasAppointment] = useState(false);
  const [clinicalContextStartIndex, setClinicalContextStartIndex] = useState<number>(0);
  const [scheduledTurnoId, setScheduledTurnoId] = useState<number | null>(null);
  const messagesBuffer = useRef<Message[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);


  const resetConfig = () => {
    setSummaryFormat(defaultSummaryFormat);
    setKeyInfo(defaultKeyInfo);
    setTriageCriteria(defaultTriageCriteria);
  };

  const handleModeToggle = () => {
    if (configLocked || chatLocked) return;
    setMode(prev => {
      const next = prev === 'urgencias' ? 'consultorio' : 'urgencias';
      // Ajustar mensaje inicial según el modo seleccionado
      if (next === 'consultorio') {
        setMessages([{ role: 'assistant', content: 'Hola, ¿cómo te puedo ayudar a agendar tu turno hoy?' }]);
      } else {
        setMessages([{ role: 'assistant', content: 'Bienvenido, ¿cuál es la causa principal de tu consulta?' }]);
      }
      setHasAppointment(false);
      return next;
    });
  };


  const lockConfig = () => {
    if (!configLocked) {
      const alreadyHasUserMessage = messages.some((m) => m.role === 'user');
      if (!alreadyHasUserMessage) {
        setConfigLocked(true);
      }
    }
  }
 
// Initialize welcome message after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (mode === 'urgencias') {
    setMessages([{
      role: 'assistant',
      content: `Hola, soy tu asistente de Prent. Estoy para ayudarte.

      ¿Cuál es la causa de tu consulta?`
    }]);
  } else {
    setMessages([{
      role: 'assistant',
      content: `Hola, soy tu asistente de Prent. ¿Cómo te puedo ayudar a agendar tu turno hoy?`
    }]);
  }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close configuration panel when chat/config becomes locked
  useEffect(() => {
    if (configLocked || chatLocked) {
      if (configDetailsRef.current) {
        configDetailsRef.current.removeAttribute('open');
      }
    }
  }, [configLocked, chatLocked]);


  const getMedicalResponse = async (allMessages: Message[], summary: string | null, summaryFormat: string, keyInfo: string, mode: string, signal?: AbortSignal): Promise<ResponseFormat> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: allMessages,
        summary: summary,
        summaryFormat,
        keyInfo,
        mode,
      }),
      signal,
    });
    if (!response.ok) {
      throw new Error('No se pudo obtener la respuesta de IA');
    }
    const data = await response.json();
    setSummary(data.summary);
    const aiMessage: string = data.message || 'Perdón, no pude generar una respuesta.';
    const aiSuggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
    setSuggestions(aiSuggestions);
    return { message: aiMessage, suggestions: aiSuggestions, shouldSummarize: data.shouldSummarize };
  }

  const getAppointmentResponse = async (allMessages: Message[], signal?: AbortSignal): Promise<ResponseFormat> => {
    console.log('getAppointmentResponse', allMessages);
    const response = await fetch('/api/chat/turnos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: allMessages,
      }),
      signal,
    });
    if (!response.ok) {
      throw new Error('No se pudo obtener la respuesta de IA');
    }
    const data = await response.json();
    return { message: data.message, suggestions: [], reserved: data.reserved, turnoId: data.turnoId };
  }
  
  const generateAIResponse = async (bufferSnapshot: Message[]): Promise<ResponseFormat | null> => {

    let messagesToSend = (hasAppointment || mode === 'urgencias')
      ? messages.slice(clinicalContextStartIndex)
      : messages;
   
    const sentLength = bufferSnapshot.length;
    messagesToSend = [...messagesToSend, ...bufferSnapshot];
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    try {
      const response = (hasAppointment || mode === 'urgencias')
        ? await getMedicalResponse(messagesToSend, summary, summaryFormat, keyInfo, mode, signal)
        : await getAppointmentResponse(messagesToSend, signal);
      if (response.reserved){
        if (response.turnoId == null) {
          throw new Error('TurnoId is null');
        }
        setScheduledTurnoId(response.turnoId); // Save the turnoId for the summary
      }
      // Remove only the messages that were actually sent, preserve any new ones that arrived after
      messagesBuffer.current.splice(0, sentLength);
      return response
  } catch (error) {
    if ((error as any)?.name === 'AbortError' || signal.aborted) {
      console.log('Request aborted');
      return null;
    }
    console.error('Error generating AI response:', error);
    return { message: 'Perdón, hubo un error procesando tu solicitud. Inténtalo nuevamente.', suggestions: [] };
  }
  };

  const generateSummary = async (history: Message[]): Promise<{ summary: string; triage: null | { level: 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul'; reason?: string } }> => {
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Final summary (on demand) must follow strict formatted summary
        body: JSON.stringify({ messages: history, summary, summaryFormat, keyInfo, triageCriteria, triageEnabled: mode === 'urgencias', freeForm: false }),
      });

      if (!response.ok) {
        throw new Error('No se pudo generar el resumen');
      }

      const data = await response.json();
      const summaryText: string = data.summary || 'No se pudo generar el resumen.';
      const triage = (mode === 'urgencias') && data.triage && typeof data.triage === 'object'
        ? {
            level: data.triage.level as 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul',
            ...(data.triage.reason ? { reason: String(data.triage.reason) } : {}),
          }
        : null;
        console.log('triage', triage);
      // Save the summary into the scheduled turno info (consultorio only)
      if (mode === 'consultorio' && scheduledTurnoId) {
        try {
          await fetch('/api/turnos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduledTurnoId, info: { resumen: summaryText } }),
          });
        } catch (e) {
          console.error('No se pudo actualizar el turno con el resumen:', e);
        }
      }
      return { summary: summaryText, triage };
    } catch (error) {
      console.error('Error generating summary:', error);
      return { summary: 'Hubo un error al generar el resumen. Inténtalo de nuevo.', triage: null };
    }
  };

  const handleSendMessage = async (content: string) => {
    lockConfig();

    let shouldSummarize = false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }


    // Add user message
    const userMessage: Message = {
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    setSuggestions([]);

    // Add user message to messages buffer
    messagesBuffer.current.push(userMessage);

    // Reset timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // 10 second wait for the next message
    timerRef.current = setTimeout(async () => {
      const result = await generateAIResponse(messagesBuffer.current.slice());
      if (!result) {
        return;
      }
      const { message: aiResponse, reserved, shouldSummarize: aiShouldSummarize } = result;
      shouldSummarize = aiShouldSummarize ?? false;
      if (typeof aiResponse !== 'string') {
        throw new Error('AI response: ' + JSON.stringify(aiResponse) + ' is not a string');
      }
      console.log('aiResponse', aiResponse);
      console.log('shouldSummarize from timer', shouldSummarize);

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Si se reservó, pasar a interrogación médica sin cargar datos del turno en el historial
      if (reserved && mode === 'consultorio') {
        setHasAppointment(true);
        // Marcar desde dónde comienza el contexto clínico (no incluir los mensajes previos de agenda)
        setClinicalContextStartIndex(messages.length);
        // Agregar la primera pregunta clínica sin borrar historial
        setMessages(prev => ([
          ...prev,
          { role: 'assistant', content: '¿Cuál es la causa principal de tu consulta?' }
        ]));
        setSuggestions([]);
      }

      if (shouldSummarize && !hasGeneratedSummary) {
        const { summary: summaryText, triage } = await generateSummary(messages);
        setSummaryDraft(summaryText);
        setTriageDraft(triage ?? null);
        setHasGeneratedSummary(true);
        setSuggestions([]);
      }
    }, 10000);
    
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden min-h-0">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white/60 dark:bg-white/5 backdrop-blur border-b border-black/10 dark:border-white/10 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold transition-all duration-300 ease-in-out truncate">Consulta Médica</h2>
            <p className="text-xs sm:text-sm text-black/70 dark:text-white/70 truncate">Asistente de IA para profesionales de la salud</p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            <details ref={configDetailsRef} className="relative mr-1 sm:mr-2 group">
            <summary
              className={`${configLocked || chatLocked
                ? 'flex items-center gap-1 sm:gap-2 select-none text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition cursor-not-allowed text-black/50 dark:text-white/50 bg-black/10 dark:bg-white/10 border-black/10 dark:border-white/10'
                : 'group flex items-center gap-1 sm:gap-2 cursor-pointer select-none text-xs sm:text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur hover:bg-white/70 dark:hover:bg-white/8 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
              }`}
              onClick={(e) => {
                if (configLocked || chatLocked) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onKeyDown={(e) => {
                if (configLocked || chatLocked) {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }
              }}
              aria-disabled={configLocked || chatLocked}
              title={configLocked || chatLocked ? 'La configuración se bloquea tras el primer mensaje o al entregar el resumen.' : undefined}
            >
                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.6 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 003.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 016.04 3.9l.06.06A1.65 1.65 0 008 4.29 1.65 1.65 0 009 2.78V2a2 2 0 014 0v.09A1.65 1.65 0 0015.4 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                <span className="hidden sm:inline">Configuración</span>
              </summary>
              <div className="fixed inset-x-2 top-16 z-20 sm:absolute sm:right-0 sm:inset-x-auto sm:top-auto sm:mt-2 w-auto sm:w-[38rem] sm:max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-500" />
                  <div className="p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">Modo</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${mode === 'urgencias' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {mode === 'urgencias' ? 'Urgencias' : 'Consultorio'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleModeToggle}
                        disabled={configLocked || chatLocked}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mode === 'consultorio' ? 'bg-blue-600' : 'bg-red-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Alternar modo"
                        aria-pressed={mode === 'consultorio'}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${mode === 'consultorio' ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    <div className="mb-3 flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Configuración</div>
                        <div className="text-xs text-slate-500">Define el formato y qué información debe priorizarse al generar el resumen.</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
                      <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Formato del resumen</label>
                        <textarea
                          className="w-full text-xs font-mono border border-slate-300 rounded-md p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          rows={4}
                          placeholder={`Ejemplo:\nMOTIVO DE CONSULTA:\n\nANTECEDENTES PERSONALES:\n...`}
                          value={summaryFormat}
                          onChange={(e) => setSummaryFormat(e.target.value)}
                          disabled={configLocked || chatLocked}
                        />
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[11px] text-slate-500">Mantén títulos en MAYÚSCULAS y orden fijo.</p>
                          <span className="text-[11px] text-slate-500">{summaryFormat.length} caracteres</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Información clave a priorizar</label>
                        <textarea
                          className="w-full text-xs border border-slate-300 rounded-md p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          rows={4}
                          placeholder={`Ejemplo:\n- Síntomas clave (inicio, duración, intensidad, localización...)\n- Banderas rojas\n- Antecedentes y riesgos pertinentes`}
                          value={keyInfo}
                          onChange={(e) => setKeyInfo(e.target.value)}
                          disabled={configLocked || chatLocked}
                        />
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[11px] text-slate-500">Usa viñetas cortas y directas.</p>
                          <span className="text-[11px] text-slate-500">{keyInfo.length} caracteres</span>
                        </div>
                      </div>
                    </div>

                <div className="mt-4 rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Criterios de triaje (editable)</label>
                  <textarea
                    className="w-full text-xs border border-slate-300 rounded-md p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    rows={6}
                    placeholder={`Rojo: ...\nNaranja: ...\nAmarillo: ...\nVerde: ...\nAzul: ...`}
                    value={triageCriteria}
                    onChange={(e) => setTriageCriteria(e.target.value)}
                    disabled={configLocked || chatLocked}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">Un criterio por línea en el formato “Nivel: condiciones”.</p>
                    <span className="text-[11px] text-slate-500">{triageCriteria.length} caracteres</span>
                  </div>
                </div>

                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="text-[11px] text-slate-500">Los cambios se aplican automáticamente al próximo resumen.</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={resetConfig}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                          disabled={configLocked || chatLocked}
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
              </div>
            </details>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-xs sm:text-sm text-black/70 dark:text-white/70 hidden sm:inline">IA en línea</span>
            </div>
          </div>
          </div>
      </div>

      {/* Summary Panel */}
      {summaryDraft && mode === 'urgencias' && (
        <div className="px-6 pt-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-transform">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-500" />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">Resumen de la consulta</div>
                  <div className="text-xs text-slate-500">Por favor, verifica que la información sea correcta.</div>
                </div>
                {triageDraft && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white ${
                      triageDraft.level === 'Rojo' ? 'bg-red-600' :
                      triageDraft.level === 'Naranja' ? 'bg-orange-500' :
                      triageDraft.level === 'Amarillo' ? 'bg-yellow-400 text-black' :
                      triageDraft.level === 'Verde' ? 'bg-green-600' :
                      'bg-blue-600'
                    }`}>
                      Prioridad: {triageDraft.level}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-64 overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{summaryDraft}</div>
              </div>

              {triageDraft?.reason && (
                <div className="mt-2 text-xs text-slate-600">
                  Motivo de prioridad: {triageDraft.reason}
                </div>
              )}

              {/* Patient name input before actions */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-slate-600 mb-1">Nombre del paciente</label>
                  <input
                    type="text"
                    placeholder="Ej.: Juan Pérez"
                    className="w-full text-sm border border-slate-300 rounded-md p-2 text-black placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="mt-1 text-[11px] text-slate-500">Se usará para registrar al paciente en la cola.</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const triageLevel = triageDraft?.level;
                    setSummaryDraft(null);
                    setTriageDraft(null);
                    // Insert paciente con prioridad según triage si existe
                    (async () => {
                      try {
                        const prioridadMap: Record<string, number> = { Rojo: 1, Naranja: 2, Amarillo: 3, Verde: 4, Azul: 5 };
                        const prioridad = triageLevel ? (prioridadMap[triageLevel] ?? 3) : 3;
                        const nombre = 'Paciente anónimo';
                        const res = await fetch('/api/pacientes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ nombre, prioridad }),
                        });
                        if (!res.ok) throw new Error('No se pudo registrar el paciente');
                      } catch (e) {
                        console.error(e);
                      }
                    })();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700 active:scale-[0.98] transition"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setSummaryDraft(null);
                    setTriageDraft(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 active:scale-[0.98] transition"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-4 lg:px-6 py-3 sm:py-4 min-h-0">
        {mounted && messages
          .filter((m) => m.role !== 'system' && (!summaryDraft || m.content !== summaryDraft))
          .map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} suggestions={suggestions} />
    </div>
  );
}