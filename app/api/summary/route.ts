import { NextRequest, NextResponse } from 'next/server';
import { generateObject, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { ConversationMessage } from '@/app/product/types';

const getLastTenMessages = (messages: ConversationMessage[]): ConversationMessage[] => {
  return Array.isArray(messages) ? messages.filter((m: ConversationMessage) => !!m && !!m.content && m.role !== 'system').slice(-10) : [];
}

const defaultFormat = `MOTIVO DE CONSULTA:\nANTECEDENTES PERSONALES:\nCOVID:\nVACUNAS:\nALCOHOL:\nTABACO:\nDROGAS:\nCIRUGÍAS:\nTRATAMIENTO HABITUAL:\nANTECEDENTES FAMILIARES:`;

const freeFormTriageSystemPrompt = `
<descripcion_del_agente>
Eres un asistente clínico que ACTUALIZA un resumen acumulativo en español y ASIGNA una prioridad de triaje.
<descripcion_del_objetivo>

<objetivo>
- Actualiza el resumen ANTERIOR con información NUEVA proveniente de los últimos mensajes.
- Mantén el resumen CONCISO y de FORMATO: usa bullet points cortos con los sintomas y signos.
- Evita encabezados, títulos o secciones predefinidas.
- Si NO hay novedades, usa EXACTAMENTE el resumen anterior sin cambios.
</objetivo>

<reglas_de_fusion>
1) Integra SOLO hechos nuevos de los mensajes recientes; evita repetir lo ya incluido.
2) No inventes información. No agregues nada que no esté dicho explícitamente.
3) Si algún dato nuevo contradice al resumen anterior, usa la versión MÁS RECIENTE e indica la rectificación entre paréntesis (p. ej.: “antes se reportó X, ahora Y”).
4) Sé muy conciso: prioriza síntomas/signos relevantes, cronología y banderas rojas.
</reglas_de_fusion>

<asignacion_de_prioridad>
- Rojo: Paro cardíaco, dificultad respiratoria severa, hemorragia incontrolable.
- Naranja: Dolor torácico agudo, fractura expuesta, convulsiones.
- Amarillo: Fiebre alta, dolor abdominal moderado, heridas leves.
- Verde: Dolor de cabeza leve, resfriado común, esguince leve.
- Azul: Cita de seguimiento, solicitud de receta, malestar general leve.
</asignacion_de_prioridad>
`
const freeFormNoTriageSystemPrompt = `
<descripcion_del_agente>
Eres un asistente clínico que ACTUALIZA un resumen acumulativo en español.
<descripcion_del_objetivo>

<objetivo>
- Actualiza el resumen ANTERIOR con información NUEVA proveniente de los últimos mensajes.
- Mantén el resumen CONCISO y de FORMATO: hace bullet points cortos con los sintomas y signos.
- Evita encabezados, títulos o secciones predefinidas.
- Si NO hay novedades, usa EXACTAMENTE el resumen anterior sin cambios.
</objetivo>

<reglas_de_fusion>
1) Integra SOLO hechos nuevos de los mensajes recientes; evita repetir lo ya incluido.
2) No inventes información. No agregues nada que no esté dicho explícitamente.
3) Si algún dato nuevo contradice al resumen anterior, usa la versión MÁS RECIENTE e indica la rectificación entre paréntesis (p. ej.: “antes se reportó X, ahora Y”).
4) Sé muy conciso: prioriza síntomas/signos relevantes, cronología y banderas rojas.
</reglas_de_fusion>
`


export async function POST(request: NextRequest) {
  try {
    const { messages, summary, summaryFormat, triageEnabled, freeForm } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const format = summaryFormat || defaultFormat;

    const customFormTriageSystemPrompt = `
    <descripcion_del_agente>
    Eres un asistente clínico que ACTUALIZA un resumen acumulativo en español y ASIGNA una prioridad de triaje.
    <descripcion_del_objetivo>

    <objetivo>
      - Actualiza el resumen ANTERIOR con información NUEVA proveniente de los últimos mensajes.
      - Conserva todo lo correcto del resumen anterior. No elimines detalles previos aunque no vuelvan a mencionarse.
      - Si NO hay novedades, usa EXACTAMENTE el resumen anterior sin cambios.
    </objetivo>

    <reglas_de_fusion>
      1) Integra SOLO hechos nuevos de los mensajes recientes; evita repetir lo ya incluido.
      2) No inventes información. No agregues nada que no esté dicho explícitamente.
      3) Si algún dato nuevo contradice al resumen anterior, usa la versión MÁS RECIENTE e indica la rectificación entre paréntesis (p. ej.: “antes se reportó X, ahora Y”).
      4) Mantén este formato y secciones (sin eliminarlas aunque no haya cambios):\n${format}
      5) Sé conciso pero completo: incluye valores, duraciones, intensidades, lateralidad y curso temporal si están disponibles.
      6) No elimines secciones ni ítems del resumen anterior; si una sección no tiene cambios, déjala igual.
      7) Agrega al final una sección breve “Hechos establecidos” con viñetas muy cortas (una idea por línea) que resuman variables ya respondidas.
    </reglas_de_fusion>

    <asignacion_de_prioridad>
      - Rojo: Paro cardíaco, dificultad respiratoria severa, hemorragia incontrolable.
      - Naranja: Dolor torácico agudo, fractura expuesta, convulsiones.
      - Amarillo: Fiebre alta, dolor abdominal moderado, heridas leves.
      - Verde: Dolor de cabeza leve, resfriado común, esguince leve.
      - Azul: Cita de seguimiento, solicitud de receta, malestar general leve.
    </asignacion_de_prioridad>
    `

const customFormNoTriageSystemPrompt = `
  <descripcion_del_agente>
  Eres un asistente clínico que ACTUALIZA un resumen acumulativo en español.
  <descripcion_del_objetivo>

  <objetivo>
  - Actualiza el resumen ANTERIOR con información NUEVA proveniente de los últimos mensajes.
  - Conserva todo lo correcto del resumen anterior. No elimines detalles previos aunque no vuelvan a mencionarse.
  - Si NO hay novedades, usa EXACTAMENTE el resumen anterior sin cambios.
  </objetivo>

  <reglas_de_fusion>
  1) Integra SOLO hechos nuevos de los mensajes recientes; evita repetir lo ya incluido.
  2) No inventes información. No agregues nada que no esté dicho explícitamente.
  3) Si algún dato nuevo contradice al resumen anterior, usa la versión MÁS RECIENTE e indica la rectificación entre paréntesis (p. ej.: “antes se reportó X, ahora Y”).
  4) Mantén este formato y secciones (sin eliminarlas aunque no haya cambios):\n${format}
  5) Sé conciso pero completo: incluye valores, duraciones, intensidades, lateralidad y curso temporal si están disponibles.
  6) No elimines secciones ni ítems del resumen anterior; si una sección no tiene cambios, déjala igual.
  7) Agrega al final una sección breve “Hechos establecidos” con viñetas muy cortas (una idea por línea) que resuman variables ya respondidas.
  </reglas_de_fusion>
`
    const wantTriage = triageEnabled || false;
    const isFreeForm = freeForm || false;

    const summarySystemPrompt = isFreeForm
      ? (
        wantTriage
          ? freeFormTriageSystemPrompt
          : freeFormNoTriageSystemPrompt
      )
      : (
        wantTriage
          ? customFormTriageSystemPrompt
          : customFormNoTriageSystemPrompt
      );

    const lastTenMessages: ConversationMessage[] = getLastTenMessages(messages);
    const modifiedMessages: ConversationMessage[] = [
      { role: 'system', content: summarySystemPrompt },
      ...(summary ? [{ role: 'system' as const, content: `Resumen anterior:\n${summary}` }] : []),
      ...lastTenMessages,
    ];

    const response = await generateObject({
      model: openai('gpt-5'),
      system: summarySystemPrompt,
      schema: z.object({
        summary: z.string().describe('Resumen actualizado'),
        triage: z.object({
          level: z.enum(['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Azul']).describe('Prioridad de triaje'),
          reason: z.string().optional().describe('Justificación breve (1 línea)'),
        }),
      }),
      messages: modifiedMessages,
    });

    const { summary: summaryText, triage } = response.object;

    return NextResponse.json({ summary: summaryText, triage });
  } catch (error) {
    console.error('Error generating summary via OpenAI API:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}