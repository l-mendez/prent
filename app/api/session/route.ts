import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const r = await fetch("https://api.openai.com/v1/realtime/transcription_sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_audio_format: "pcm16",
        input_audio_transcription:
          {
            model: "gpt-4o-mini-transcribe",
            prompt: "Expect medical words in Spanish",
            language: "es"
          }
        ,
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        },
        input_audio_noise_reduction: {
          type: "near_field"
        },
      }),
    });
    const data = await r.json();
    return NextResponse.json(data);
}