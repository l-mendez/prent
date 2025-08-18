'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';

type Recognizer = {
  start: () => void;
  stop: () => void;
  abort?: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: any) => void) | null;
  onaudioend?: (() => void) | null;
  onerror?: ((ev: any) => void) | null;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => Recognizer;
    SpeechRecognition?: new () => Recognizer;
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
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Ctor) return;
      const rec = new Ctor();
      rec.lang = 'es-ES';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
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
      if (data?.error) setError(data.error);
    } catch {
      setError('No se pudo transcribir el audio');
    }
  }, []);


  if (!mounted) return <LoadingScreen />;
 
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registro de Consulta</h2>
            <p className="text-gray-500">Grabe y transcriba en tiempo real la conversación con su paciente</p>
          </div>
          <div className="text-sm text-gray-500">
            {recognitionSupported ? 'Transcripción local habilitada' : 'Transcripción en vivo lista para conectar al backend'}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls + Meter */}
          <section className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 medical-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isRecording ? 'bg-red-600' : 'bg-blue-600'} shadow-md`}>
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z"></path>
                  <path d="M19 11a1 1 0 10-2 0 5 5 0 11-10 0 1 1 0 10-2 0 7 7 0 0012 4.9V17a1 1 0 112 0v-1.1A7 7 0 0019 11z"></path>
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duración</div>
                <div className="text-2xl font-semibold text-gray-900">{formatElapsed(elapsedMs)}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm text-gray-500 mb-2">Nivel de audio</div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div className="h-full medical-gradient" style={{ width: `${Math.round(meterLevel * 100)}%` }}></div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <button onClick={startRecording} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out active:scale-95">Iniciar</button>
              ) : isPaused ? (
                <button onClick={resumeRecording} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out active:scale-95">Reanudar</button>
              ) : (
                <button onClick={pauseRecording} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 hover:scale-105 hover:shadow-lg transition-all duration-200 ease-in-out active:scale-95">Pausar</button>
              )}
              <button onClick={stopRecording} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out active:scale-95">Detener</button>
              <button onClick={downloadAudio} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out active:scale-95">Descargar</button>
              <button onClick={transcribeFullRecording} className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out active:scale-95">Transcribir</button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Los fragmentos de audio se envían al backend automáticamente.
            </div>
          </section>

          {/* Live transcription */}
          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 medical-shadow flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Transcripción en vivo</h3>
                <p className="text-sm text-gray-500">Texto generado en tiempo real durante la consulta</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearTranscript} className="px-3 py-2 rounded-lg border text-gray-700 hover:bg-gray-100">Limpiar</button>
                <button onClick={copyTranscript} className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Copiar</button>
              </div>
            </div>

            <div className="mt-4 flex-1 min-h-[280px] max-h-[480px] overflow-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                {transcript || 'La transcripción aparecerá aquí…'}
                {interimTranscript && (
                  <span className="opacity-60"> {interimTranscript}</span>
                )}
              </p>
            </div>

            {!recognitionSupported && (
              <div className="mt-3 text-xs text-gray-500">
                Consejo: Conecte un servicio de transcripción (SSE/WebSocket) y añada actualizaciones al estado de transcripción en tiempo real.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}


