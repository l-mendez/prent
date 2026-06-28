import { transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';

async function toBufferFromJsonInput(audio: unknown): Promise<Buffer> {
  if (typeof audio !== 'string') {
    throw new Error('Invalid audio payload');
  }
  if (audio.startsWith('http://') || audio.startsWith('https://')) {
    const r = await fetch(audio);
    const ab = await r.arrayBuffer();
    return Buffer.from(ab);
  }
  const commaIndex = audio.indexOf(',');
  const base64 = audio.startsWith('data:') && commaIndex !== -1 ? audio.slice(commaIndex + 1) : audio;
  return Buffer.from(base64, 'base64');
}

export async function POST(request: NextRequest) {
  try {
    const ctype = request.headers.get('content-type') || '';
    let audioBuf: Buffer;

    if (ctype.startsWith('application/octet-stream') || ctype.startsWith('audio/')) {
      const ab = await request.arrayBuffer();
      audioBuf = Buffer.from(ab);
    } else {
      const body = await request.json();
      audioBuf = await toBufferFromJsonInput(body?.audio);
    }

    const transcription = await transcribe({
      model: openai.transcription('gpt-4o-transcribe'),
      audio: audioBuf,
      headers: {
        input_audio_transcription: JSON.stringify({
          model: 'gpt-4o-transcribe',
          language: 'es',
          prompt: 'Expect medical words in Spanish',
        }),
      },
    });

    return NextResponse.json({ transcription: transcription.text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}