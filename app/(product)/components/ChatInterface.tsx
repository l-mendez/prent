'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatConfig } from '@/app/(product)/components/ChatConfigContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type ResponseFormat = {
  message: string;
  suggestions: string[];
  reserved?: boolean;
  id?: number;
  turnoId?: number;
  shouldSummarize?: boolean;
}

let chatId: number | undefined = undefined;

export default function ChatInterface({ mode }: { mode: 'urgencias' | 'consultorio' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hasGeneratedSummary, setHasGeneratedSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [triageDraft, setTriageDraft] = useState<null | { level: 'Rojo' | 'Naranja' | 'Amarillo' | 'Verde' | 'Azul'; reason?: string }>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [summaryDraft, setSummaryDraft] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasAppointment, setHasAppointment] = useState(false);
  const [clinicalContextStartIndex, setClinicalContextStartIndex] = useState<number>(0);
  const [scheduledTurnoId, setScheduledTurnoId] = useState<number | null>(null);
  const messagesBuffer = useRef<Message[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const hasUserMessage = messages.some((m) => m.role === 'user');
  const { summaryFormat, keyInfo, triageCriteria, lockConfig, setChatLocked } = useChatConfig();

  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ensure messages render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // No inline configuration panel to manage


  const getMedicalResponse = async (allMessages: Message[], summary: string | null, summaryFormat: string, keyInfo: string, mode: string, chatId: number | undefined, signal?: AbortSignal): Promise<ResponseFormat> => {

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
        id: chatId,
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
    return { message: aiMessage, suggestions: aiSuggestions, shouldSummarize: data.shouldSummarize, id: data.id };
  }

  const getAppointmentResponse = async (allMessages: Message[], chatId: number | undefined, signal?: AbortSignal): Promise<ResponseFormat> => {
    const response = await fetch('/api/chat/turnos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: allMessages,
        id: chatId,
      }),
      signal,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'No se pudo obtener la respuesta de IA');
    }
    const data = await response.json();
    return { message: data.message, suggestions: [], reserved: data.reserved, turnoId: data.turnoId, id: data.id };
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
        ? await getMedicalResponse(messagesToSend, summary, summaryFormat, keyInfo, mode, chatId, signal)
        : await getAppointmentResponse(messagesToSend, chatId, signal);
      if (response.reserved){
        if (response.turnoId == null) {
          throw new Error('TurnoId is null');
        }
        setScheduledTurnoId(response.turnoId); // Save the turnoId for the summary
      }
      chatId = chatId ?? response.id;
      // Remove only the messages that were actually sent, preserve any new ones that arrived after
      messagesBuffer.current.splice(0, sentLength);
      return response
  } catch (error) {
    if ((error as Error).name === 'AbortError' || signal.aborted) {
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

    // Show typing indicator while the assistant is thinking/responding
    setIsAssistantTyping(true);

    // Reset timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // 10 second wait for the next message
    timerRef.current = setTimeout(async () => {
      const result = await generateAIResponse(messagesBuffer.current.slice());
      if (!result) {
        // Aborted due to new message; keep typing indicator on
        return;
      }
      const { message: aiResponse, reserved, shouldSummarize: aiShouldSummarize, id: newChatId } = result;
      chatId = newChatId;
      
      shouldSummarize = aiShouldSummarize ?? false;
      if (typeof aiResponse !== 'string') {
        throw new Error('AI response: ' + JSON.stringify(aiResponse) + ' is not a string');
      }

      // Split AI response by newlines to render separate assistant messages per line
      const normalized = aiResponse
        .replace(/\r\n/g, '\n')
        .replace(/\u2028|\u2029/g, '\n')
        .trim();
      const parts = normalized
        .split(/\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      // Sequentially append messages with typing delay for the 2nd, 3rd, ... parts
      const assistantMessages: Message[] = parts.map((part) => ({ role: 'assistant', content: part }));
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      if (assistantMessages.length > 0) {
        // First message immediately
        setMessages(prev => [...prev, assistantMessages[0]]);
        if (assistantMessages.length === 1) {
          // Single-part reply: hide typing indicator
          setIsAssistantTyping(false);
        } else {
          // Multi-part reply: keep typing indicator visible between messages
          setIsAssistantTyping(true);
          // Subsequent messages after delay: 500ms per character of that message
          for (let i = 1; i < assistantMessages.length; i++) {
            const msg = assistantMessages[i];
            const delayMs = Math.max(0, msg.content.length * 500);
            // eslint-disable-next-line no-await-in-loop
            await sleep(delayMs);
            setMessages(prev => [...prev, msg]);
            if (i === assistantMessages.length - 1) {
              // Last part delivered: hide typing indicator
              setIsAssistantTyping(false);
            }
          }
        }
      } else {
        // No assistant message to show; hide typing indicator
        setIsAssistantTyping(false);
      }

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
        {isAssistantTyping && hasUserMessage && (
          <div className={`flex justify-start mb-4 sm:mb-6 px-2 sm:px-0`}>
            <div className={`flex max-w-[90%] sm:max-w-2xl lg:max-w-3xl flex-row`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 mr-2 sm:mr-3`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out bg-brand shadow-lg shadow-brand/30`}>
                  <img src="/prent-logo.svg" alt="Prent" className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              {/* Typing bubble */}
              <div className={`text-left flex-1 min-w-0`}>
                <div className={`inline-block p-3 sm:p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl max-w-full bg-white/60 dark:bg-white/5 backdrop-blur border border-black/10 dark:border-white/10 text-black dark:text-white`}>
                  <div className="flex items-center gap-1">
                    <span className="sr-only">Escribiendo…</span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {!hasUserMessage && mode === 'consultorio' && (
          <div className="mt-2">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-5 shadow-sm text-center">
                <div className="flex flex-col items-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow">
                    <span className="text-sm font-semibold">C</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-black dark:text-white">Claudia</div>
                  <div className="text-[11px] text-black/60 dark:text-white/60">Asistente clínica de IA</div>
                </div>
                <div className="mt-3 text-sm text-black/80 dark:text-white/80 leading-relaxed">
                  Hola, soy Claudia. Mi rol es ayudarte a sacar turnos y guíar la consulta clínica de forma segura y ordenada: detecto banderas rojas y priorizo en urgencias, redacto un resumen estructurado.
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-black/70 dark:text-white/70">
                  <div className="rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2">• Guiarte con preguntas clínicas</div>
                  <div className="rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2">• Identificar banderas rojas y triaje</div>
                  <div className="rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2">• Generar resumen clínico</div>
                  <div className="rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2">• Proponer/reservar turnos</div>
                </div>
                <div className="mt-3 text-[11px] text-black/60 dark:text-white/60">Contame el motivo de consulta para empezar.</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={handleSendMessage} suggestions={suggestions} />
    </div>
  );
}