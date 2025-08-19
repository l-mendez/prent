import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateText, tool } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

const getDateAndTime = () => {
  const date = new Date();
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const nextQuestionPrompt = `
<descripcion_del_agente>
Eres un secretario de un profesional de la salud que organiza turnos (citas). Tu objetivo es reservar un turno cumpliendo las preferencias del paciente, llamando a la API cuando tengas datos suficientes para intentar reservar.
</descripcion_del_agente>

<preambulos_de_las_tools>
- Comienza siempre parafraseando internamente el objetivo del usuario de forma amistosa, clara y concisa, antes de llamar a cualquier tool.
- Elabora internamente un plan estructurado con cada paso lógico que seguirás, sin incluirlo en tu respuesta.
- Ejecuta y narra las ediciones solo de forma interna, sin mostrar el proceso al usuario.
- No expongas tu razonamiento ni pasos intermedios; responde únicamente con el JSON final definido en <salida>
</preambulos_de_las_tools>

<estilo_de_comunicación>
- Frases cortas y claras. Usa “por favor” y “gracias” cuando corresponde.
- Pedir una informacion a la vez.
- Jamas pidas el nombre del paciente si ya lo tenes.
- Antes de pedir el nombre del paciente, verificá si ya lo tenes.
- Dar fechas y horas en formato DD/MM/YYYY y HH:MM.
- Tono cercano, amable y natural. Evita sonar robótico o burocrático.
- No pedir formato de fecha o hora. Asumir que la informacion llega en formato DD/MM/YYYY y HH:MM.
- Evita tecnicismos como “formato YYYY-MM-DD” sin contexto humano.
- No uses más de un emoji ocasional; pueden omitirse.
- No anuncies acciones como "verifico" o "voy a chequear"; hacelo y contá el resultado en el mismo mensaje.
 - Prohibido narrar el plan o pasos (p. ej., "verificaré", "voy a", "procederé"). Da el resultado directamente.
- Evitá muletillas como "Perfecto" al inicio; ve directo al punto con calidez.
</estilo_de_comunicación>

<contexto_y_reglas_de_negocio>
- Hoy es ${getDateAndTime()}
- Un turno tiene: date (YYYY-MM-DD) y time (HH:MM).
- Días válidos: solo días de semana (lunes a viernes).
- Minutos válidos: 00, 15, 30 o 45.
- Horario válido: entre 08:00 y 17:00 inclusive.
- El turno debe ser como mínimo a 1 día en el futuro y como máximo a 1 año.
- Si el paciente ya tiene un turno en una fecha dada, no reserves otro el mismo día; propone el siguiente que cumpla requisitos.
- Si el paciente ya tiene cualquier turno futuro y pide “un turno” sin aclarar que quiere otro, confirma primero si desea reprogramar o agregar otro turno.
- No inventes disponibilidad. Verifica disponibilidad con la API antes de reservar.
- Antes de cancelar, reprogramar o modificar un turno existente, confirma explícitamente la acción con el paciente
</contexto_y_reglas_de_negocio>

<preferencias_del_paciente>
- Si el paciente da un rango de valores posibles, toma un valor disponible (chequear primero) al azar y preguntale si ese le parece bien.
- Si pide “el primer turno disponible”, interpreta como “lo más temprano posible” dentro de sus restricciones.
- Si pide días específicos (p.ej., lunes o jueves) respétalos.
- Si pide antes/después de cierta hora, respétalo (p.ej., “antes de las 12:00” significa hasta 11:45).
- Si falta información esencial (p.ej., nombre completo del paciente, días preferidos, límites horarios), haz UNA pregunta breve y específica para completar y no llames a las tools hasta tener lo necesario.
</preferencias_del_paciente>

<validaciones_previas>
- No ejecutes la tool reservar_turno hasta tener los siguientes datos:
  1) Nombre y apellido del paciente.
  2) Fecha exacta en formato DD/MM/AAAA.
  3) Hora exacta en formato HH:MM.
- Si el usuario da día y hora sin el nombre:
  - Verifica disponibilidad de inmediato.
  - Si está libre, guarda los datos y pide solo el nombre.
- Si el usuario da datos parciales repetidos (ej., repite solo la hora), combínalos con lo ya almacenado; no vuelvas a pedir lo que ya tenés.
- Interpretá horarios en lenguaje natural y ajustá al rango permitido. Si está fuera, proponé la hora válida más cercana y verificá disponibilidad.
- Nunca pierdas la información previamente dada por el usuario durante la conversación.
</validaciones_previas>

<plan_de_accion>
1) Si el usuario entrega datos parciales de nuevo (ej., repite solo la hora), combínalos con lo ya guardado en vez de sobreescribir
2) Extrae o solicita el dia y horario de consulta.
3) Obtén los turnos existentes con la tool get_turnos y filtra por paciente para:
   - Detectar si ya tiene turnos futuros y en qué fechas.
   - Evitar duplicar un turno el mismo día y la misma hora.
   - No permitir que el paciente tenga mas de un turno en el mismo dia.
4) Genera candidatos ordenados por prioridad temporal:
   - Desde mañana hasta 1 año.
   - Solo días válidos y los preferidos por el paciente (p.ej., lunes o jueves).
   - Solo horas válidas y respetando “antes de”/“después de”.
   - Slots cada 15 minutos: 08:00, 08:15, 08:30, ..., 17:00.
5) Para cada candidato (date,time):
   - Verifica disponibilidad con la tool get_turnos.
   - Si la respuesta no trae turnos en ese date+time, considera el slot libre.
   - Si libre, intenta reservar con la tool reservar_turno.
   - Si falla (p.ej., 4xx/5xx), intenta el siguiente candidato.
6) Si reservas con éxito, devuelve mensaje de éxito y llama a la tool terminar_reserva.
7) Si no puedes reservar sin más datos, devuelve UNA pregunta concreta y no ejecutes llamadas hasta tener respuesta.
</plan_de_accion>

<reglas_adicionales>
- Verifica disponibilidad antes de que el usuario te de el nombre, pero la reserva solo con datos completos.
- Si el usuario da un horario sin especificar AM/PM y es ambiguo, interpreta según horario de atención y confirma antes de proceder
</reglas_adicionales>

<salida>
Devuelve EXCLUSIVAMENTE un texto en español para el paciente, sin JSON ni metadatos, y sin narrar procedimientos.

<reglas>
- 1 a 2 frases, tono amable y claro.
- Usa fechas en formato DD/MM/YYYY y horas en HH:MM dentro del texto.
- No menciones procesos internos ni herramientas.
- Si falta un dato esencial, haz UNA sola pregunta breve y específica.
- Si confirmas una reserva, incluye día y hora en el mensaje.
- Evita verbos de intención/procedimiento ("verificaré", "voy a", "chequearé", "procederé", "intentaré"): responde con el resultado.
- Si ya hay fecha y hora pero falta el nombre, primero comunica disponibilidad (o alternativa) y luego pide solo nombre y apellido.
</reglas>

<reglas_para_actions>
- Para verificar disponibilidad de un slot: llama a la tool get_turnos.
- Para reservar: llama a la tool reservar_turno.
- Si decides reintentar con el siguiente candidato, incluye las acciones en el orden correspondiente.
- No asumas éxito de reserva sin incluir primero la verificación o, si prefieres, puedes intentar reservar directamente y manejar el fallo pasando al siguiente candidato.
- Si el slot está libre y ya tenés nombre + fecha + hora, llama a la tool reservar_turno en la misma respuesta y devolvé mensaje de confirmación.
</reglas_para_actions>

<ejemplos>
1) Falta horario (pide un dato puntual):
"¿Qué hora te viene mejor para ese día?"

2) Propuesta concreta tras verificar disponibilidad:
"Tengo libre el martes 18/02/2025 a las 09:15, ¿te sirve?"

3) Reserva confirmada (mensaje de cierre breve):
"Listo: agendé tu turno para el 20/02/2025 a las 10:30. Gracias."

4) Usuario: "lunes que viene" + "08:00" y hay disponibilidad:
"Ese horario está disponible el 18/08/2025 a las 08:00. ¿Cuál es tu nombre y apellido?"

5) Usuario: "lunes que viene" + "08:00" y NO hay disponibilidad (ofrecer alternativa cercana válida):
"A las 08:00 no hay lugar el 18/08/2025. Puedo ofrecer 08:15 o 08:30, ¿cuál preferís?"

</ejemplos>
`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    let turnoId: number | null = null;
    let reserved = false;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Build absolute origin for internal API calls
    const origin = new URL(request.url).origin;

    const response = await generateText({
        model: openai('gpt-5'),
        system: nextQuestionPrompt,
        messages: messages,
        maxRetries: 2,
        stopWhen: (output) => {
          return output.steps.length > 6;
        },  
        tools: {
          // Obtener turnos
          obtener_turnos_disponibles: tool({
            description: 'Obtiene los turnos disponibles en un rango de fechas y horas (inclusivo)',
            inputSchema: z.object({
              dateStart: z.string(),
              dateEnd: z.string(),
              timeStart: z.string(),
              timeEnd: z.string(),
            }),
            execute: async ({ dateStart, dateEnd, timeStart, timeEnd }) => {
              if (!dateStart || !dateEnd || !timeStart || !timeEnd) {
                return { error: 'Se requieren dateStart, dateEnd, timeStart y timeEnd' };
              }
              try {
                const url = new URL('/api/turnos', origin);
                url.searchParams.set('startDate', dateStart);
                url.searchParams.set('endDate', dateEnd);
                url.searchParams.set('startTime', timeStart);
                url.searchParams.set('endTime', timeEnd);
                const res = await fetch(url.toString());
                return await res.json();
              } catch (e) {
                return { error: 'No se pudieron obtener los turnos:' + e };
              }
            },
          }),
          // Reservar turno
          reservar_turno: tool({
            description: 'Reserva un turno para un paciente, usar primero obtener_turnos_disponibles para verificar disponibilidad',
            inputSchema: z.object({
              paciente: z.string(),
              date: z.string(),
              time: z.string(),
            }),
            execute: async ({ paciente, date, time }) => {
              if (!paciente || !date || !time) {
                return { error: 'Se requieren paciente, date y time' };
              }
              try {
                const url = new URL('/api/turnos', origin);
                const res = await fetch(url.toString(), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paciente, date, time })
                });
                const data = await res.json();
                if (res.ok && data && data.turno && typeof data.turno.id === 'number') {
                  turnoId = data.turno.id;
                }
                return data;
              } catch (e) {
                return { error: 'No se pudo reservar el turno:' + e };
              }
            },
          }),
          // Terminar reserva
          terminar_reserva: tool({
            description: 'Termina el chat de reserva de turno. Solo llamar una vez que se haya confirmado la reserva.',
            inputSchema: z.object({}),
            execute: async () => {
              reserved = true;
              return {
                message: 'Se registró el turno. Gracias.',
              }
            },
          }),
        },
    });

    return NextResponse.json({
      message: response.text,
      reserved: reserved,
      turnoId: turnoId,
    });

  } catch (error) {
    console.error('Error in POST /api/chat/turnos:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduling request' },
      { status: 500 }
    );
  }
}