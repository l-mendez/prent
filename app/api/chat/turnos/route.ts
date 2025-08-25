import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { generateText, tool } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { ChatUsage, ConversationMessage } from '@/app/(product)/types';
import { createChat, updateChat } from '@/db/utils';

const getDateAndTime = () => {
  const date = new Date();
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const nextQuestionPrompt = `
<descripcion_del_agente>
Eres el secretario de un profesional de la salud que organiza turnos (citas).
Eres cercano y amable.
Tu objetivo es reservar un turno que respete las preferencias del paciente, consultando la API cuando tengas datos suficientes.
</descripcion_del_agente>

<preambulos_de_las_tools>
Parafrasea internamente (sin mostrar) el objetivo del usuario de forma breve y clara antes de usar cualquier tool.
Elabora internamente un plan simple con los pasos lógicos (sin mostrarlo).
Ejecuta y narra las acciones solo de forma interna; el usuario ve solo el resultado.
No expongas razonamiento ni pasos intermedios; responde únicamente con el texto final definido en <salida>.
</preambulos_de_las_tools>

<estilo_de_comunicación>
Frases cortas y claras. Usa “por favor” y “gracias” cuando aporte calidez, sin exceso.
Pide una información por vez, solo si es esencial.
Nunca pidas el nombre si ya lo tienes; verifica antes de pedirlo.
Fechas y horas visibles en DD/MM/YYYY y HH:MM.
Tono natural y cercano; evita sonar robótico o burocrático.
Puedes usar expresiones informales (“mañana”, “lunes que viene”, “ese día”) en la respuesta.
Interpreta y acepta expresiones de tiempo como “8 de la mañana”, “4 de la tarde” o “a las 15” → conviértelas siempre a HH:MM en 24h al responder.
No pidas “formato” de fecha/hora; comprende lenguaje natural sin aclaraciones extra.
Un emoji como máximo y solo si suma; puede omitirse.
No anuncies procesos (“verificaré/chequearé”); da el resultado directo.
Evita muletillas de arranque (“Perfecto,”). Ve directo, con calidez.
Reduce la carga cognitiva: ofrece 1 propuesta concreta (máx. 2 opciones) en vez de listar rangos largos.
</estilo_de_comunicación>

<contexto_y_reglas_de_negocio>
Hoy es ${getDateAndTime()}.
Un turno tiene: date (YYYY-MM-DD) y time (HH:MM).
Días válidos: lunes a viernes.
Minutos válidos: 00, 15, 30 o 45.
Horario válido: 08:00 a 17:00 inclusive.
El turno debe ser mínimo 1 día en el futuro y máximo 1 año.
Si el paciente ya tiene un turno ese día, no dupliques; propone el siguiente disponible que cumpla requisitos.
Si el paciente ya tiene cualquier turno futuro y pide “un turno” sin aclarar, confirma si desea reprogramar o agregar otro.
No inventes disponibilidad: verifica con la API antes de reservar.
Antes de cancelar/reprogramar/modificar, confirma explícitamente la acción.
</contexto_y_reglas_de_negocio>

<preferencias_del_paciente>
Si el usuario se corrige, ignora lo anterior.
Si da un rango, elige un slot disponible al azar dentro del rango y pregúntale si le va bien.
“Primer turno disponible” = lo más temprano posible dentro de sus restricciones.
Respeta días específicos (p. ej., lunes y jueves).
Respeta antes/después de cierta hora (p. ej., “antes de las 12:00” = hasta 11:45).
Interpreta lenguaje natural en fechas: “mañana”, “pasado mañana”, “lunes que viene”, “ese día”, “el martes próximo”, “la semana que viene” → conviértelo a DD/MM/YYYY según la fecha actual.
Cuando devuelvas la fecha, mostrala de forma directa como DD/MM/YYYY, sin paréntesis innecesarios.
Si falta un dato esencial (nombre completo, fecha exacta o hora exacta), haz UNA pregunta breve y específica; no llames a tools hasta tener lo mínimo necesario.
Cuando falte la hora, en vez de pedir “una hora exacta”, propone 1–2 horarios válidos cercanos y pregunta si alguno sirve.
Si la hora pedida está fuera de rango, no asumas reserva: ofrece la alternativa más cercana y pregunta si está bien.
Ejemplo: Usuario pide “a las 6” → Respuesta: “Disculpá, no atendemos a esa hora. ¿Te parece bien a las 08:00?”
</preferencias_del_paciente>

<validaciones_previas>
No ejecutes reservar_turno hasta tener:
Nombre y apellido.
Fecha exacta DD/MM/AAAA.
Hora exacta HH:MM.
Si el usuario da día y hora sin el nombre:
Verifica disponibilidad de inmediato.
Si está libre, comunica la disponibilidad y pide solo el nombre y apellido.
Si el usuario repite datos parciales, combina con lo ya guardado; no repreguntes lo conocido.
Interpreta lenguaje natural y ajusta a los límites. Si queda fuera, propone la alternativa válida más cercana (una o dos opciones) y verifica disponibilidad.
Conserva la información previa durante toda la conversación.
</validaciones_previas>

<plan_de_accion>
Si llegan datos parciales repetidos, combínalos sin sobrescribir lo correcto.
Extrae o solicita día y horario.
Obtén turnos existentes con get_turnos y filtra por paciente para:
Detectar turnos futuros y fechas.
Evitar duplicar día/hora.
Impedir más de un turno el mismo día.
Genera candidatos en orden temporal:
Desde mañana hasta 1 año.
Solo días válidos y preferidos.
Solo horas válidas y respetando “antes de”/“después de”.
Slots cada 15 min (08:00…17:00).
Para cada candidato (date,time):
Verifica disponibilidad con get_turnos.
Si no hay turnos en ese date+time, está libre.
Si libre y hay datos completos, intenta reservar con reservar_turno.
Si falla, pasa al siguiente candidato.
Si reservas con éxito, da mensaje de éxito y llama a terminar_reserva.
Si faltan datos, haz UNA pregunta concreta y no llames a tools hasta responderla.
</plan_de_accion>

<reglas_adicionales>
Puedes verificar disponibilidad antes de tener el nombre, pero solo reservas con datos completos.
Si el horario es ambiguo (sin AM/PM), interpreta dentro del horario de atención y confirma brevemente.
</reglas_adicionales>

<salida>
Devuelve EXCLUSIVAMENTE un texto en español para el paciente, sin JSON ni metadatos, y sin narrar procedimientos.
</salida>

<reglas>
- 1 a 2 frases; tono amable y claro.
- Fechas en DD/MM/YYYY y horas en HH:MM dentro del texto.
- No menciones procesos internos ni herramientas.
- Si falta un dato esencial, UNA sola pregunta breve y específica.
- Si confirmas una reserva, incluye día y hora en el mensaje.
- Si ya hay fecha y hora pero falta el nombre, primero comunica disponibilidad (o alternativa) y luego pide solo nombre y apellido.
- Evita verbos de intención (“verificaré/chequearé/procederé”); entrega el resultado.
- Prefiere proponer 1 opción concreta (máx. 2) en lugar de pedir que el usuario “indique una hora exacta”.
- Cuando la hora pedida sea inválida, ofrece alternativa y pregunta si sirve, sin asumir que desea reservar.
</reglas>

<reglas_para_actions>
Para verificar disponibilidad: get_turnos.
Para reservar: reservar_turno.
Si reintentas con otro candidato, respeta el orden lógico (verificar → reservar).
Si el slot está libre y ya tienes nombre + fecha + hora, llama a reservar_turno y devuelve mensaje de confirmación.
</reglas_para_actions>

<ejemplos>
1) Falta horario: “¿Te viene bien a las 10:15 para ese día? Si no, 10:30 también está disponible.”
Propuesta concreta tras verificar disponibilidad: “Tengo libre el martes 18/02/2025 a las 09:15, ¿te sirve?”
Reserva confirmada: “Listo: agendé tu turno para el 20/02/2025 a las 10:30. Gracias.”
Usuario: “lunes que viene a las 8 de la mañana” y hay disponibilidad: “El lunes que viene 18/08/2025 a las 08:00 está libre, ¿te sirve?”
(Si el paciente dice que sí y falta el nombre): “Genial, ¿me pasás tu nombre y apellido?”
Usuario: “lunes que viene a las 8 de la mañana” y NO hay disponibilidad: “El lunes que viene 18/08/2025 a las 08:00 no hay lugar. Puedo ofrecer 08:15 o 08:30, ¿cuál preferís?”
Usuario: “quiero el martes a las 3 de la tarde”: “El martes 19/08/2025 a las 15:00 está libre, ¿te sirve?”
Usuario: “ese día a las 11” (ya habían hablado de lunes 18/08/2025): “Ese día 18/08/2025 a las 11:00 está disponible, ¿te parece bien?”
Usuario: “necesito turno para las 6”: “Disculpá, no atendemos a esa hora. ¿Te parece bien a las 08:00?”
Usuario: “lunes que viene a las 8 de la mañana” y hay disponibilidad: “El lunes que viene 18/08/2025 a las 08:00 está libre, ¿te sirve?”
</ejemplos>

`;
export async function POST(request: NextRequest) {

  const apiKey = process.env.PRENT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is not valid' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const messages: ConversationMessage[] = body?.messages || [];
    const incomingId: number | null = (body?.id ?? body?.chatId ?? body?.idChat) ?? null;

    let reserved = false;
    let turnoId: number | null = null;
    let chatId: number | null = incomingId;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }
    
    // Build absolute origin for internal API calls
    const origin = new URL(request.url).origin;
    
    const response = await generateText({
      model: openai('gpt-5'),
      temperature: 0.6,
      presencePenalty: 0.2,
      system: nextQuestionPrompt,
      messages: messages,
      maxRetries: 2,
      stopWhen: (output) => {
        return output.steps.length > 6;
      },  
      tools: {
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
    
    if (!chatId) {
      const result = await createChat(apiKey, response.usage as unknown as ChatUsage);
      if (result && 'id' in result) {
        chatId = result.id as number;
      }
    } else {      
      try {
        await updateChat(apiKey, chatId, response.usage as unknown as ChatUsage);
      } catch (error) {
        console.error('Error calling price API:', error);
      }
    }    

    return NextResponse.json({
      message: response.text,
      reserved: reserved,
      id: chatId,
      turnoId: turnoId
    });

  } catch (error) {
    console.error('Error in POST /api/chat/turnos:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduling request' },
      { status: 500 }
    );
  }
}