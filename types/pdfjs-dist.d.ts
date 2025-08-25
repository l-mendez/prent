declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc?: string };
  export function getDocument(options: { data: ArrayBuffer }): { promise: Promise<any> };
}

declare module 'pdfjs-dist/legacy/build/pdf' {
  export const GlobalWorkerOptions: { workerSrc?: string };
  export function getDocument(options: { data: ArrayBuffer }): { promise: Promise<any> };
}


