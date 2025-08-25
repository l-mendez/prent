'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Header from '@/app/(product)/components/Header';
import { summarize, responseToQuestion, type ApiSegment } from '@/app/(product)/estudios/utilts';

type ParsedDoc = { fileName: string };

export default function EstudiosPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [docs, setDocs] = useState<ParsedDoc[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [summarySegments, setSummarySegments] = useState<ApiSegment[]>([]);
  const [question, setQuestion] = useState('');
  const [answerSegments, setAnswerSegments] = useState<ApiSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFilesSelected = useCallback(async (selected: FileList | null) => {
    if (!selected || !selected.length) return;
    const arr = Array.from(selected).filter((f) => f.type === 'application/pdf');
    setFiles(arr);
    setError(null);
    setSummarySegments([]);
    setQuestion('');
    setAnswerSegments([]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onFilesSelected(e.dataTransfer.files);
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const analyze = useCallback(async () => {
    if (!files.length) {
      setError('Primero seleccioná uno o más archivos PDF.');
      return;
    }
    setError(null);
    setSummarySegments([]);
    setAnswerSegments([]);
    setIsParsing(true);
    try {
      const parsed: ParsedDoc[] = files.map((f) => ({ fileName: f.name }));
      setDocs(parsed);
      const segs = await summarize(files);
      setSummarySegments(segs);
    } catch (e) {
      console.error(e);
      setError('No se pudo analizar el/los PDF(s).');
    } finally {
      setIsParsing(false);
    }
  }, [files]);

  const askQuestion = useCallback(async () => {
    setAnswerSegments([]);
    if (!question.trim()) return;
    if (!files.length) {
      setAnswerSegments([{ text: 'Subí y analizá los PDFs para poder responder.', source: '' }]);
      return;
    }
    const segs = await responseToQuestion(question, files);
    setAnswerSegments(segs);
  }, [docs, question]);

  const SummaryView = useMemo(() => function SummaryView({ segments }: { segments: ApiSegment[] }) {
    const [showCitations, setShowCitations] = useState(false);
    const mainText = segments.map(s => s.text).join('\n\n');
    return (
      <div className="space-y-3">
        <div className="text-sm whitespace-pre-wrap text-black/90 dark:text-white/90">
          {mainText || 'Sin contenido.'}
        </div>
        {segments.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setShowCitations(v => !v)}
              className="text-xs px-2 py-1 rounded-lg bg-brand text-white hover:brightness-110"
            >
              {showCitations ? 'Ocultar citas' : `Ver citas (${segments.length})`}
            </button>
          </div>
        )}
        {showCitations && (
          <div className="space-y-3">
            {segments.map((s, i) => (
              <CollapsibleQuote key={i} text={s.text} source={s.source} />
            ))}
          </div>
        )}
      </div>
    );
  }, []);

  function CollapsibleQuote({ text, source }: { text: string; source: string }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-black/60 dark:text-white/60">[{source || 'fuente'}]</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs px-2 py-1 rounded-lg bg-brand text-white hover:brightness-110"
          >
            {open ? 'Ocultar cita' : 'Ver cita'}
          </button>
        </div>
        {open && (
          <div className="mt-2 text-sm whitespace-pre-wrap">{text}</div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_30%_at_50%_-10%,theme(colors.brand/20),transparent_60%),radial-gradient(30%_20%_at_80%_10%,theme(colors.cyan.400/20),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-10 sm:-top-20 -left-10 sm:-left-20 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-brand/20 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute top-20 sm:top-40 -right-8 sm:-right-16 h-48 w-48 sm:h-80 sm:w-80 rounded-full bg-cyan-400/20 blur-3xl animate-floaty-slow" />

      <Header />

      <main className="flex-1 flex flex-col bg-white/60 dark:bg-white/5 backdrop-blur min-w-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4 sm:p-6 shadow-lg">
            <h1 className="text-lg sm:text-xl font-semibold mb-3">Estudios</h1>
            <p className="text-sm text-black/70 dark:text-white/70 mb-4">Subí uno o más archivos PDF con estudios. Generaremos un resumen y podrás hacer preguntas sobre su contenido. Todo se procesa localmente en tu navegador.</p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-black/15 dark:border-white/15 bg-white/50 dark:bg-white/5 p-6 text-center transition-colors hover:border-brand/30"
            >
              <svg className="w-8 h-8 text-black/60 dark:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="space-y-1">
                <p className="text-sm">Arrastrá y soltá tus PDFs aquí</p>
                <p className="text-xs text-black/60 dark:text-white/60">o</p>
              </div>
              <div>
                <button
                  className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95"
                  onClick={() => inputRef.current?.click()}
                >
                  Elegir archivos
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => onFilesSelected(e.target.files)}
                />
              </div>
              {files.length > 0 && (
                <div className="mt-3 text-xs text-black/70 dark:text-white/70">
                  {files.length} archivo(s) seleccionado(s)
                </div>
              )}
            </div>

            {isParsing && (
              <div className="mt-4 text-sm text-black/70 dark:text-white/70">Leyendo y procesando PDFs…</div>
            )}
            {error && (
              <div className="mt-4 text-sm text-red-600">{error}</div>
            )}
          </div>

          {docs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4 sm:p-6 shadow-lg min-h-[320px]">
                <h2 className="text-base sm:text-lg font-semibold mb-3">Resumen</h2>
                {summarySegments.length ? (
                  <SummaryView segments={summarySegments} />
                ) : (
                  <div className="text-sm text-black/60 dark:text-white/60">Aún no hay resumen.</div>
                )}
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4 sm:p-6 shadow-lg min-h-[320px] flex flex-col">
                <h2 className="text-base sm:text-lg font-semibold mb-3">Preguntar sobre los PDFs</h2>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ej.: ¿Cuál es el diagnóstico principal?"
                    className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 p-3 text-sm"
                  />
                  <button
                    onClick={askQuestion}
                    className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-medium shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95"
                  >
                    Preguntar
                  </button>
                </div>
                <div className="flex-1 min-h-[220px] rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10 p-3 text-sm overflow-auto">
                  {answerSegments.length ? (
                    <SummaryView segments={answerSegments} />
                  ) : (
                    <div className="text-black/60 dark:text-white/60">Tu respuesta aparecerá aquí.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4 sm:p-6 shadow-lg">
              <h3 className="text-sm font-semibold mb-2">Archivos cargados</h3>
              <ul className="text-sm text-black/80 dark:text-white/80 list-disc pl-5 space-y-1">
                {docs.map((d) => (
                  <li key={d.fileName}>{d.fileName}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <button
        onClick={analyze}
        disabled={isParsing || !files.length}
        className="fixed bottom-6 right-6 bg-brand text-white rounded-full px-5 py-3 text-sm font-medium shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95 disabled:opacity-50"
        aria-label="Analizar PDFs"
      >
        {isParsing ? 'Analizando…' : 'Analizar'}
      </button>
    </div>
  );
}


