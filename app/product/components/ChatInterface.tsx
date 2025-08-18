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
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasGeneratedSummary, setHasGeneratedSummary] = useState(false);
  const [configLocked, setConfigLocked] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [triageDraft, setTriageDraft] = useState<null | { level: 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul'; reason?: string }>(null);
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
        setMessages([{ role: 'assistant', content: '¿Como puedo ayudarte a agendar tu turno?' }]);
      } else {
        setMessages([{ role: 'assistant', content: '¿Cual es la causa de tu consulta?' }]);
      }
      setHasAppointment(false);
      return next;
    });
  };

 
// Initialize welcome message after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    if (mode === 'urgencias') {
    setMessages([{
      role: 'assistant',
      content: `Bienvenido al Consultorio de Prent AI! 👋

      ¿Cual es la causa de tu consulta?`
    }]);
  } else {
    setMessages([{
      role: 'assistant',
      content: `Bienvenido al Consultorio de Prent AI! 👋

      ¿Como puedo ayudarte a agendar tu turno?`
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


  const getMedicalResponse = async (allMessages: Message[], summary: string | null, summaryFormat: string, keyInfo: string, mode: string): Promise<ResponseFormat> => {
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
    });
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
    const data = await response.json();
    setSummary(data.summary);
    const aiMessage: string = data.message || 'Sorry, I could not generate a response.';
    const aiSuggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
    setSuggestions(aiSuggestions);
    return { message: aiMessage, suggestions: aiSuggestions };
  }

  const getAppointmentResponse = async (allMessages: Message[]): Promise<ResponseFormat> => {
    const response = await fetch('/api/chat/turnos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: allMessages,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
    const data = await response.json();
    return { message: data.message, suggestions: [], reserved: data.reserved, turnoId: data.turnoId };
  }
  
  const generateAIResponse = async (userMessage: string): Promise<ResponseFormat> => {
    const lastMessage: Message = {
      role: 'user' as const,
      content: userMessage,
    };
    const baseMessages = (hasAppointment || mode === 'urgencias')
      ? messages.slice(clinicalContextStartIndex)
      : messages;
    const allMessages = [...baseMessages, lastMessage];
    
    try {
      const response = (hasAppointment || mode === 'urgencias')
        ? await getMedicalResponse(allMessages, summary, summaryFormat, keyInfo, mode)
        : await getAppointmentResponse(allMessages);
      if (response.reserved){
        if (response.turnoId == null) {
          throw new Error('TurnoId is null');
        }
        setScheduledTurnoId(response.turnoId); // Save the turnoId for the summary
      }
    return response
  } catch (error) {
    console.error('Error generating AI response:', error);
    return { message: 'Sorry, there was an error processing your request. Please try again.', suggestions: [] };
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
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const summaryText: string = data.summary || 'No se pudo generar el resumen.';
      const triage = (mode === 'urgencias') && data.triage && typeof data.triage === 'object'
        ? {
            level: data.triage.level as 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul',
            ...(data.triage.reason ? { reason: String(data.triage.reason) } : {}),
          }
        : null;
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
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content,
    };

    // Lock configuration after the very first user message
    if (!configLocked) {
      const alreadyHasUserMessage = messages.some((m) => m.role === 'user');
      if (!alreadyHasUserMessage) {
        setConfigLocked(true);
      }
    }

    const messagesAfterUser = [...messages, userMessage];
    setMessages(messagesAfterUser);
    setIsLoading(true);
    // Clear previous suggestions while waiting for the next assistant question
    setSuggestions([]);

    const { message: aiRaw, reserved } = await generateAIResponse(content);
    if( typeof aiRaw !== 'string' ) {
      throw new Error('AI response: ' + JSON.stringify(aiRaw) + ' is not a string');
    }
    const endTokenRegex = /###RESUMEN###\s*$/;
    const shouldSummarize = endTokenRegex.test(aiRaw);
    const aiContent = aiRaw.replace(endTokenRegex, '').trim();

    const aiResponse: Message = {
      role: 'assistant',
      content: aiContent,
    };

    const messagesAfterAI = [...messagesAfterUser, aiResponse];
    setMessages(messagesAfterAI);

    // Si se reservó, pasar a interrogación médica sin cargar datos del turno en el historial
    if (reserved && mode === 'consultorio') {
      setHasAppointment(true);
      // Marcar desde dónde comienza el contexto clínico (no incluir los mensajes previos de agenda)
      setClinicalContextStartIndex(messagesAfterAI.length);
      // Agregar la primera pregunta clínica sin borrar historial
      setMessages(prev => ([
        ...prev,
        { role: 'assistant', content: '¿Cual es la causa de tu consulta?' }
      ]));
      setSuggestions([]);
    }

    if (shouldSummarize && !hasGeneratedSummary) {
      const { summary: summaryText, triage } = await generateSummary(messagesAfterAI);
      // Remove any existing assistant message equal to the summary text
      setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === summaryText)));
      setSummaryDraft(summaryText);
      setTriageDraft(triage ?? null);
      setHasGeneratedSummary(true);
      // When closing, there should be no suggestions
      setSuggestions([]);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Medical Consultation</h2>
            <p className="text-sm text-gray-500">AI Assistant for Healthcare Professionals</p>
          </div>
          <div className="flex items-center space-x-3">
            <details ref={configDetailsRef} className="relative mr-2 group">
            <summary
              className={`${configLocked || chatLocked
                ? 'flex items-center gap-2 select-none text-sm px-3 py-2 rounded-lg border transition cursor-not-allowed text-gray-600 bg-gray-300 border-gray-300 hover:bg-gray-300 hover:text-gray-600'
                : 'flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition'
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
                <span>Configuración</span>
              </summary>
              <div className="absolute right-0 mt-2 z-20 w-[38rem] max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-2xl">
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-500" />
                  <div className="p-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Formato del resumen</label>
                        <textarea
                          className="w-full text-xs font-mono border border-slate-300 rounded-md p-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          rows={10}
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
                          rows={10}
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

                    <div className="mt-4 flex items-center justify-between">
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
                <button
              onClick={async () => {
                setIsLoading(true);
                const { summary: summaryText, triage } = await generateSummary(messages);
                // Remove if any identical assistant message exists
                setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.content === summaryText)));
                setSummaryDraft(summaryText);
                setTriageDraft(triage ?? null);
                setIsLoading(false);
              }}
              disabled={isLoading || chatLocked}
              className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Generar Resumen
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">AI Online</span>
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
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {mounted && messages
          .filter((m) => m.role !== 'system' && (!summaryDraft || m.content !== summaryDraft))
          .map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
        {isLoading && (
          <div className="flex justify-start mb-6">
            <div className="flex max-w-3xl">
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || chatLocked} suggestions={chatLocked ? [] : suggestions} />
    </div>
  );
}