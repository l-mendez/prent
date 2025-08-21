import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { sdp, key, model } = await request.json();
    if (!sdp || !key) {
      return NextResponse.json({ error: "missing sdp or key" }, { status: 400 });
    }
    const targetModel = typeof model === "string" && model.length > 0 ? model : "gpt-4o-transcribe";

    const upstream = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(targetModel)}`, {
      method: "POST",
      body: sdp,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/sdp",
        "OpenAI-Beta": "realtime=v1",
        Accept: "application/sdp",
      },
    });
    const answerText = await upstream.text();
    if (!upstream.ok) {
      return new NextResponse(answerText || "upstream error", { status: upstream.status });
    }
    return new NextResponse(answerText, { headers: { "Content-Type": "application/sdp" } });
  } catch (err) {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}


