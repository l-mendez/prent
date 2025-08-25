type Chunk = { text: string; source: string };
export type ApiSegment = { text: string; source: string };

type PDFPageTextItem = { str?: string } & Record<string, unknown>;
type PDFPageLike = { getTextContent: () => Promise<{ items: PDFPageTextItem[] }> };
type PDFDocumentLike = { numPages: number; getPage: (pageNum: number) => Promise<PDFPageLike> };
type PDFJSLike = {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument: (options: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentLike> };
};

async function loadPdfJs(): Promise<PDFJSLike> {
  const w = window as unknown as { pdfjsLib?: PDFJSLike };
  if (w.pdfjsLib) return w.pdfjsLib;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
  const pdfjsLib = (window as unknown as { pdfjsLib: PDFJSLike }).pdfjsLib;
  if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  return pdfjsLib;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib: PDFJSLike = await loadPdfJs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf: PDFDocumentLike = await loadingTask.promise;
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page: PDFPageLike = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: PDFPageTextItem) => (typeof item.str === 'string' ? item.str : String(item)))
      .join(' ');
    fullText += '\n' + pageText + '\n';
  }
  return fullText.replace(/\s+/g, ' ').trim();
}

async function chunkFile(file: File, maxLength = 800): Promise<Chunk[]> {
  const text = await extractTextFromPdf(file);
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: Chunk[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current.trim()) chunks.push({ text: current.trim(), source: file.name });
      current = '';
    }
    current += sentence + ' ';
  }
  if (current.trim()) chunks.push({ text: current.trim(), source: file.name });
  return chunks;
}

async function buildChunks(files: File[]): Promise<Chunk[]> {
  const all: Chunk[] = [];
  for (const f of files) {
    const parts = await chunkFile(f);
    all.push(...parts);
  }
  return all;
}

export async function summarize(files: File[]): Promise<ApiSegment[]> {
  const chunks = await buildChunks(files);
  const res = await fetch('/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunks }),
  });
  if (!res.ok) throw new Error('Failed to summarize');
  const data = await res.json();
  return (data.summary ?? []) as ApiSegment[];
}

export async function responseToQuestion(question: string, files: File[]): Promise<ApiSegment[]> {
  const chunks = await buildChunks(files);
  const res = await fetch('/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunks, question }),
  });
  if (!res.ok) throw new Error('Failed to answer');
  const data = await res.json();
  return (data.summary ?? []) as ApiSegment[];
}