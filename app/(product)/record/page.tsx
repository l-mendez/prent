'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/app/(product)/components/Header';
import LoadingScreen from '@/app/(product)/components/LoadingScreen';

type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type Recognizer = {
  start: () => void;
  stop: () => void;
  abort?: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onaudioend?: (() => void) | null;
  onerror?: ((ev: Event) => void) | null;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => Recognizer;
    SpeechRecognition?: new () => Recognizer;
    webkitAudioContext?: { new (): AudioContext };
  }
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export default function RecordPage() {
  const [mounted, setMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [meterLevel, setMeterLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAccumulatedRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  const recognizerRef = useRef<Recognizer | null>(null);
  const recognitionSupported = useMemo(() => typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const tick = () => {
      if (startTimeRef.current == null) return;
      const now = performance.now();
      const base = now - startTimeRef.current - pausedAccumulatedRef.current;
      setElapsedMs(base);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [isRecording, isPaused]);

  const updateMeter = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length); // 0..~1
    setMeterLevel(Math.min(1, rms * 2));
    rafIdRef.current = requestAnimationFrame(updateMeter);
  }, []);

  const setupAudioGraph = useCallback((stream: MediaStream) => {
    const Ctx = (window.AudioContext ?? window.webkitAudioContext) as unknown as {
      new (): AudioContext;
    };
    const ctx = new Ctx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    rafIdRef.current = requestAnimationFrame(updateMeter);
  }, [updateMeter]);

  const teardownAudioGraph = useCallback(() => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const sendAudioChunk = useCallback(async (blob: Blob) => {
    await fetch('/api/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio: blob }),
    });
  }, []);

  const startRecognition = useCallback(() => {
    if (!recognitionSupported) return;
    try {
      const Ctor = (window.SpeechRecognition || window.webkitSpeechRecognition) as
        | (new () => Recognizer)
        | undefined;
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = 'es-ES';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }
        if (finalText) setTranscript((prev) => (prev ? prev + ' ' + finalText : finalText));
        setInterimTranscript(interimText);
      };
      rec.onerror = () => {};
      rec.start();
      recognizerRef.current = rec;
    } catch (e) {
      // ignore
    }
  }, [recognitionSupported]);

  const stopRecognition = useCallback(() => {
    const rec = recognizerRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
    recognizerRef.current = null;
    setInterimTranscript('');
  }, []);

  const ensureRecorder = useCallback(async () => {
    if (mediaRecorderRef.current && streamRef.current) return mediaRecorderRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mr.onerror = (e) => {
        setError('Error en la grabación de audio');
      };
      mediaRecorderRef.current = mr;
      setupAudioGraph(stream);
      return mr;
    } catch (e) {
      setError('No se pudo acceder al micrófono');
      throw e;
    }
  }, [sendAudioChunk, setupAudioGraph]);

  const startRecording = useCallback(async () => {
    setError(null);
    setSummaryText(null);
    setIsSummarizing(false);
    setTranscript('');
    setInterimTranscript('');
    const mr = await ensureRecorder();
    if (!mr) return;
    audioChunksRef.current = [];
    pausedAccumulatedRef.current = 0;
    pauseStartRef.current = null;
    startTimeRef.current = performance.now();
    setElapsedMs(0);
    mr.start(500); // emit chunks every 500ms
    setIsRecording(true);
    setIsPaused(false);
    startRecognition();
  }, [ensureRecorder, startRecognition]);

  const pauseRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== 'recording') return;
    mr.pause();
    pauseStartRef.current = performance.now();
    setIsPaused(true);
    stopRecognition();
  }, [stopRecognition]);

  const resumeRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== 'paused') return;
    mr.resume();
    if (pauseStartRef.current != null) {
      pausedAccumulatedRef.current += performance.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsPaused(false);
    startRecognition();
  }, [startRecognition]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state !== 'inactive') mr.stop();
    setIsRecording(false);
    setIsPaused(false);
    stopRecognition();
    teardownAudioGraph();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [stopRecognition, teardownAudioGraph]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setSummaryText(null);
  }, []);

  const copyTranscript = useCallback(async () => {
    const full = transcript + (interimTranscript ? ' ' + interimTranscript : '');
    try {
      await navigator.clipboard.writeText(full);
    } catch {}
  }, [interimTranscript, transcript]);

  const downloadAudio = useCallback(() => {
    if (audioChunksRef.current.length === 0) return;
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consulta-${new Date().toISOString()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const transcribeFullRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;
    try {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const buf = await blob.arrayBuffer();
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Mime-Type': blob.type,
        },
        body: buf,
      });
      const data = await res.json();
      if (data?.transcription) setTranscript(data.transcription);
      if (data?.error) setError('No se pudo transcribir el audio');

      // After transcription, generate summary from transcript
      if (data?.transcription) {
        setIsSummarizing(true);
        try {
          const sumRes = await fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'user', content: data.transcription },
              ],
              summary: null,
              freeForm: true,
              triageEnabled: false,
            }),
          });
          const sumData = await sumRes.json();
          if (sumData?.summary) setSummaryText(sumData.summary);
          if (sumData?.error) setError('No se pudo generar el resumen');
        } catch {
          setError('No se pudo generar el resumen');
        } finally {
          setIsSummarizing(false);
        }
      }
    } catch {
      setError('No se pudo transcribir el audio');
    }
  }, []);


  if (!mounted) return <LoadingScreen />;
 
  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col">
      {/* Background effects similar to marketing page */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-10 sm:-top-20 -left-10 sm:-left-20 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute top-20 sm:top-40 -right-8 sm:-right-16 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />
      
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 overflow-hidden flex flex-col min-h-0">
        <div className="mb-4 sm:mb-6 text-center flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            Registro de <span className="bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">Consulta</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-black/70 dark:text-white/70 max-w-2xl mx-auto px-2">
            Grabe y transcriba en tiempo real la conversación con su paciente usando tecnología de vanguardia
          </p>
          <div className="mt-2 text-xs text-black/60 dark:text-white/60 px-2">
            {recognitionSupported ? 'Transcripción local habilitada' : 'Transcripción en vivo lista para conectar al backend'}
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl border border-red-300/30 bg-red-50/80 dark:bg-red-900/20 backdrop-blur text-red-700 dark:text-red-300 shadow-lg text-sm sm:text-base">{error}</div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-h-0">
          {/* Controls + Meter */}
          <section className="group lg:col-span-1 rounded-2xl border border-black/10 dark:border-white/10 p-4 sm:p-6 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-brand/5 hover:border-brand/15 dark:hover:border-brand/20 hover:bg-white/70 dark:hover:bg-white/8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out group-hover:scale-105 ${
                isRecording 
                  ? 'bg-red-500 shadow-red-500/30 animate-pulse' 
                  : 'bg-brand shadow-brand/30'
              }`}>
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-all duration-300 ease-in-out group-hover:scale-105" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z"></path>
                  <path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 0012 4.9V17a1 1 0 112 0v-1.1A7 7 0 0019 11z"></path>
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-black/70 dark:text-white/70">Duración</div>
                <div className="text-xl sm:text-2xl font-semibold transition-all duration-300 ease-in-out group-hover:text-brand">{formatElapsed(elapsedMs)}</div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6">
              <div className="text-xs sm:text-sm text-black/70 dark:text-white/70 mb-2 sm:mb-3">Nivel de audio</div>
              <div className="h-2 sm:h-3 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-brand to-cyan-400 transition-all duration-300 ease-in-out" 
                  style={{ width: `${Math.round(meterLevel * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
              {/* Primary action row */}
              <div className="flex gap-2 sm:gap-3">
                {!isRecording ? (
                  <button 
                    onClick={startRecording} 
                    className="group flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-brand text-white font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 active:scale-95 text-sm sm:text-base"
                  >
                    Iniciar
                  </button>
                ) : isPaused ? (
                  <button 
                    onClick={resumeRecording} 
                    className="group flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-brand text-white font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 active:scale-95 text-sm sm:text-base"
                  >
                    Reanudar
                  </button>
                ) : (
                  <button 
                    onClick={pauseRecording} 
                    className="group flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl bg-black/20 dark:bg-white/20 text-black dark:text-white font-medium border border-black/10 dark:border-white/10 transition-all duration-300 ease-in-out hover:bg-black/30 dark:hover:bg-white/30 hover:shadow-md active:scale-95 text-sm sm:text-base"
                  >
                    Pausar
                  </button>
                )}
                <button 
                  onClick={stopRecording} 
                  className="group flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-black dark:text-white font-medium transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/20 hover:shadow-md active:scale-95 text-sm sm:text-base"
                >
                  Detener
                </button>
              </div>
              
              {/* Secondary actions row */}
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={downloadAudio} 
                  className="group flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-black dark:text-white font-medium transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/20 hover:shadow-md active:scale-95 text-sm sm:text-base"
                >
                  Descargar
                </button>
                <button 
                  onClick={transcribeFullRecording} 
                  className="group flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-black dark:text-white font-medium transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/20 hover:shadow-md active:scale-95 text-sm sm:text-base"
                >
                  Transcribir
                </button>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 text-xs text-black/60 dark:text-white/60 leading-relaxed">
              Los fragmentos de audio se envían al backend automáticamente.
            </div>
          </section>

          {/* Live transcription */}
          <section className="group lg:col-span-2 rounded-2xl border border-black/10 dark:border-white/10 p-4 sm:p-6 bg-white/60 dark:bg-white/5 backdrop-blur transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-brand/5 hover:border-brand/15 dark:hover:border-brand/20 hover:bg-white/70 dark:hover:bg-white/8 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold transition-all duration-300 ease-in-out group-hover:text-brand">Transcripción en vivo</h3>
                <p className="text-xs sm:text-sm text-black/70 dark:text-white/70">Texto generado en tiempo real durante la consulta</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-end">
                <button 
                  onClick={clearTranscript} 
                  className="group px-3 py-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur text-black dark:text-white font-medium transition-all duration-300 ease-in-out hover:bg-white/70 dark:hover:bg-white/8 hover:border-brand/20 hover:shadow-md active:scale-95 text-sm"
                >
                  Limpiar
                </button>
                <button 
                  onClick={copyTranscript} 
                  className="group px-3 py-2 rounded-2xl bg-brand text-white font-medium shadow-lg transition-all duration-300 ease-in-out hover:brightness-110 hover:shadow-xl hover:shadow-brand/30 active:scale-95 text-sm"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex-1 min-h-0 overflow-auto rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur p-3 sm:p-4">
              <p className="whitespace-pre-wrap text-black dark:text-white leading-relaxed text-sm sm:text-base">
                {transcript || <span className="text-black/50 dark:text-white/50">La transcripción aparecerá aquí…</span>}
                {interimTranscript && (
                  <span className="opacity-60 text-brand"> {interimTranscript}</span>
                )}
              </p>
            </div>

            {!recognitionSupported && (
              <div className="mt-3 text-xs text-black/60 dark:text-white/60 leading-relaxed">
                Consejo: Conecte un servicio de transcripción (SSE/WebSocket) y añada actualizaciones al estado de transcripción en tiempo real.
              </div>
            )}

            {/* Summary output */}
            <div className="mt-4 sm:mt-6 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <h4 className="text-base sm:text-lg font-semibold transition-all duration-300 ease-in-out group-hover:text-brand">Resumen</h4>
                {isSummarizing && (
                  <span className="text-xs sm:text-sm text-brand animate-pulse">Generando resumen…</span>
                )}
              </div>
              <div className="mt-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur p-3 sm:p-4 min-h-[100px] max-h-32 overflow-auto">
                <p className="whitespace-pre-wrap text-black dark:text-white leading-relaxed text-xs sm:text-sm">
                  {summaryText || <span className="text-black/50 dark:text-white/50">Genere la transcripción para obtener un resumen.</span>}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}