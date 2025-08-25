import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';

export type Chunk = { text: string; source: string };

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  try {
    const { chunks, question } = await request.json();
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: 'chunks must be a non-empty string array' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const embeddings = new OpenAIEmbeddings({ apiKey, model: 'text-embedding-3-small' });

    const vectorStore = await MemoryVectorStore.fromTexts(
      chunks.map(c => c.text),
      chunks.map(c => ({ source: c.source })), // metadata keeps filename
      embeddings
    );

    const isQuestion = typeof question === 'string' && question.trim().length > 0;
    const searchQuery = isQuestion ? question : 'Summarize this document';
    const results = await vectorStore.similaritySearch(searchQuery, 8);
    const context = results.map(r => `[${(r.metadata as { source?: string }).source}] ${r.pageContent}`).join("\n\n");

    const response = generateObject({
      model: openai('gpt-5'),
      system: isQuestion? `Responde la pregunta ${question} usando solo el contexto proporcionado. Citá exactamente las partes y citá el archivo de donde se extrajo esa parte.` : `Resumen del documento. Incluí citas directas y citá el archivo de donde se extrajo esa parte.`,
      schema: z.object({
        summary: z.array(z.object({
          text: z.string().describe(isQuestion? 'Respuesta a la pregunta' : 'Resumen del documento'),
          source: z.string().describe('Nombre del archivo de donde se extrajo esa parte'),
        })),
      }),
      messages: [{
        role: "user",
        content: context
      }]
    })

    const aiObject = (await response).object;
    
    return NextResponse.json({ summary: aiObject.summary });

  } catch (error) {
    console.error('Embeddings error', error);
    return NextResponse.json({ error: 'Failed to generate embeddings' }, { status: 500 });
  }
}