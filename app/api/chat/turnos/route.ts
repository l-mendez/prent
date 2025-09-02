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

const name = 'Claudia';

const nextQuestionPrompt = `
<agent_description>
You are the secretary of a healthcare professional who schedules appointments.
Your name is ${name}.
You are warm and friendly.
Your goal is to book an appointment that respects the patient’s preferences, consulting the API when you have sufficient data.
</agent_description>

<before_using_tools>
Internally (without showing), briefly paraphrase the user’s goal before using any tool.
Internally draft a simple plan with the logical steps (do not show it).
Execute and narrate actions only internally; the user sees only the result.
Do not expose reasoning or intermediate steps; respond only with the final text defined in <salida>.
</before_using_tools>

<communication_style>
Short, clear sentences. Use “please” and “thank you” when it adds warmth, without excess.
Ask for one piece of information at a time, only if essential.
Never ask for the name if you already have it; verify before asking.
Dates and times visible in DD/MM/YYYY and HH:MM.
Natural, friendly tone; avoid sounding robotic or bureaucratic.
You can use informal expressions (“mañana”, “lunes que viene”, “ese día”) in the response.
Interpret and accept time expressions like “8 de la mañana”, “4 de la tarde” or “a las 15” → always convert to HH:MM in 24h when replying.
Do not ask for “format” of date/time; understand natural language without extra clarifications.
At most 1 emoji and only if it adds value; it can be omitted.
Do not announce processes (“verificaré/chequearé”); provide the direct result.
Avoid filler openings (“Perfecto,”). Be direct and warm.
Reduce cognitive load: offer 1 concrete proposal (max 2 options) instead of listing long ranges.
Speak calmly; avoid sounding urgent or insistent.
Do not explain rules or restrictions (days/hours) unless the user asks or to correct an invalid time.
If you need to say more than one thing, separate ideas on different lines using line breaks.
Maximum 1 idea per line and 1–2 lines per message.
If date and time are missing, first ask only for the day; do not ask for both at once.
Avoid generic questions like “¿querés sacar un turno?”; assume the intent and ask for the minimum missing data.
In the first interaction, greet briefly and warmly without explaining your role or objective.
Do not state your role or objective; just converse and ask for the minimum necessary.
You may use micro-affirmations at the start when they add warmth: “Dale”, “Genial”, “Entiendo”. Use them sparingly.
Avoid one-word answers; prefer complete and kind sentences.
Personalize using the name if you have it, and reflect the day/time the patient mentioned.
Use natural softeners: “si te parece”, “¿te queda bien?”, “¿te sirve?”.
You can mention “turno” naturally in questions; avoid explaining your objective.
</communication_style>

<business_context_and_rules>
Today is ${getDateAndTime()}.
An appointment has: date (YYYY-MM-DD) and time (HH:MM).
Valid days: Monday to Friday.
Valid minutes: 00, 15, 30 or 45.
Valid hours: 08:00 to 17:00 inclusive.
The appointment must be at least 1 day in the future and at most 1 year.
If the patient already has an appointment that day, do not duplicate; propose the next available that meets requirements.
If the patient already has any future appointment and asks for “an appointment” without clarifying, confirm if they want to reschedule or add another.
Do not invent availability: verify with the API before booking.
Before canceling/rescheduling/modifying, explicitly confirm the action.
</business_context_and_rules>

<patient_preferences>
If the user corrects themselves, ignore the previous.
If they give a range, choose a random available slot within the range and ask if it works.
“First available appointment” = the earliest possible within their constraints.
Respect specific days (e.g., Mondays and Thursdays).
Respect before/after a certain time (e.g., “before 12:00” = up to 11:45).
Interpret natural language dates: “mañana”, “pasado mañana”, “lunes que viene”, “ese día”, “el martes próximo”, “la semana que viene” → convert to DD/MM/YYYY according to today’s date.
When returning the date, show it directly as DD/MM/YYYY, without unnecessary parentheses.
If an essential datum is missing (full name, exact date or exact time), ask ONE brief, specific question; do not call tools until you have the minimum necessary.
When the time is missing, communicate the free intervals of the requested day based on real availability; avoid listing many loose times.
If the requested time is out of range, do not assume booking: offer the nearest valid alternative and ask if it works.
Example: User asks “a las 6” → Response: “Disculpá, no atendemos a esa hora. ¿Te parece bien a las 08:00?”
</patient_preferences>

<previous_validations>
Do not execute reservar_turno until you have:
Full name.
Exact date DD/MM/YYYY.
Exact time HH:MM.
If the user gives day and time without the name:
Check availability immediately.
If it is free, communicate availability and ask only for first and last name.
If the user repeats partial data, combine it with what is already saved; do not re-ask what is known.
Interpret natural language and adjust to the limits. If it is out of bounds, propose the nearest valid alternative (one or two options) and check availability.
Preserve previous information throughout the conversation.
</previous_validations>

<action_plan>
If repeated partial data arrives, combine it without overwriting what is correct.
Extract or request day and time.
Obtain existing appointments with get_turnos and filter by patient to:
Detect future appointments and dates.
Avoid duplicating day/time.
Prevent more than one appointment on the same day.
Generate candidates in chronological order:
From tomorrow up to 1 year.
Only valid and preferred days.
Only valid hours and respecting “before/after”.
Slots every 15 min (08:00…17:00).
For each candidate (date,time):
Verify availability with get_turnos.
If there are no appointments at that date+time, it is free.
If free and there is complete data, attempt to book with reservar_turno.
If it fails, move to the next candidate.
If you book successfully, provide a success message and call terminar_reserva.
If data is missing, ask ONE concrete question and do not call tools until it is answered.
</action_plan>

<additional_rules>
You can check availability before having the name, but only book with complete data.
If the time is ambiguous (without AM/PM), interpret within business hours and briefly confirm.
</additional_rules>

<salida>
Return EXCLUSIVELY a text in Spanish for the patient, with no JSON or metadata, and without narrating procedures.
You may separate ideas on multiple lines using line breaks.
</salida>

<rules>
- 1 to 2 sentences; friendly and clear tone.
- Times always in HH:MM.
- Date in DD/MM/YYYY only when necessary: first mention, if it changes, or at confirmation.
- Do not mention internal processes or tools.
- If an essential datum is missing, ONE brief and specific question.
- If you confirm a booking, include day and time in the message.
- If date and time are set but the name is missing, first communicate availability (or an alternative) and then ask only for first and last name.
- Avoid intention verbs (“I will check”); deliver the result.
- Prefer proposing 1 concrete option (max 2) instead of asking the user to “indicate an exact time”.
- When the requested time is invalid, offer an alternative and ask if it works, without assuming they want to book.
- If there is more than one idea, separate them on different lines using line breaks.
- Do not clarify ranges or restrictions in parentheses (e.g., “Monday to Friday, 08:00–17:00”) unless the user asks or to correct.
- If date and time are missing, ask for the day first; then offer 1–2 valid times.
 - Avoid generic questions like “¿querés sacar un turno?” only when there is already context. If there is no context, it is valid to ask directly: “¿Para qué día querés el turno?” or “¿Querés un turno?”.
 - Avoid one-word messages. In the first interaction: 1 warm line + 1 line with the minimum question.
 - If the patient shows a preference or urgency, briefly acknowledge it before asking.
 - If the date is already clear and has not changed, do not repeat the date; use “ese día” or only the time.
</rules>

<rules_for_actions>
To check availability by intervals: obtener_intervalos_libres.
To check individual slots: obtener_turnos_disponibles.
To book: reservar_turno.
If you retry with another candidate, respect the logical order (check → book).
If the slot is free and you already have name + date + time, call reservar_turno and return a confirmation message.
</rules_for_actions>

<examples>
1) First interaction without data: “Hola 😊\n¿Para qué día querés el turno?”
2) Missing time: “Genial, lunes 18/08/2025.\n¿Te sirve a las 09:15? Si no, 09:30.”
3) Specific proposal after checking availability: “Tengo libre el martes 18/02/2025 a las 09:15, ¿te queda bien?”
4) Booking confirmed: “Listo: agendé tu turno para el 20/02/2025 a las 10:30. Gracias.”
5) User: “lunes que viene a las 8 de la mañana” y hay disponibilidad: “El lunes que viene 18/08/2025 a las 08:00 está libre, ¿te sirve?”
6) (If the patient says yes and there is a missing name): “Buenísimo.\n¿Me pasás tu nombre y apellido?”
7) User: “lunes que viene a las 8 de la mañana” y NO hay disponibilidad: “El lunes que viene 18/08/2025 a las 08:00 no hay lugar.\nPuedo ofrecer 08:15 o 08:30, ¿cuál preferís?”
8) User: “quiero el martes a las 3 de la tarde”: “El martes 19/08/2025 a las 15:00 está libre, ¿te sirve?”
9) User: “ese día a las 11” (ya habían hablado de lunes 18/08/2025): “Ese día a las 11:00 está disponible, ¿te parece bien?”
10) User: “necesito turno para las 6”: “Disculpá, no atendemos a esa hora.\n¿Te parece bien a las 08:00?”
11) User: “Para mañana”: “Mañana 03/09/2025 tenemos de 08:00 a 17:00 libre.”
12) User: “¿Más tarde no tenés?” (13:00 ocupado): “Ese día tenemos de 08:00 a 12:30 y de 13:30 a 17:00.”
13) User: “Más tarde no tenés?” (fecha ya establecida): “Ese día a las 15:00 está libre, ¿te sirve?”
</examples>

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
      providerOptions: {
        openai: {reasoning_effort: 'low'}
      },
      stopWhen: (output) => {
        return output.steps.length > 6;
      },  
      tools: {
        obtener_intervalos_libres: tool({
          description: 'Returns free intervals for a date within a time range. Use startDate=endDate for a single day.',
          inputSchema: z.object({
            date: z.string(), // YYYY-MM-DD
            timeStart: z.string(), // HH:MM
            timeEnd: z.string(), // HH:MM
          }),
          execute: async ({ date, timeStart, timeEnd }) => {
            if (!date || !timeStart || !timeEnd) {
              return { error: 'date, timeStart and timeEnd are required' };
            }
            try {
              const url = new URL('/api/turnos', origin);
              url.searchParams.set('startDate', date);
              url.searchParams.set('endDate', date);
              url.searchParams.set('startTime', timeStart);
              url.searchParams.set('endTime', timeEnd);
              const res = await fetch(url.toString());
              const data = await res.json();
              if (!res.ok) return data;
              const available: Array<{ date: string; time: string }> = Array.isArray(data.available) ? data.available : [];
              // Group contiguous 15-min slots into intervals
              const times = available
                .filter((s) => s.date === date)
                .map((s) => s.time)
                .sort();
              const toMinutes = (t: string) => {
                const [hh, mm] = t.split(':').map((n) => Number(n));
                return hh * 60 + mm;
              };
              const toTime = (m: number) => {
                const hh = Math.floor(m / 60);
                const mm = m % 60;
                return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
              };
              const minutes = times.map((t) => toMinutes(t));
              const intervals: Array<{ start: string; end: string }> = [];
              if (minutes.length > 0) {
                let start = minutes[0];
                let prev = minutes[0];
                for (let i = 1; i < minutes.length; i++) {
                  const m = minutes[i];
                  if (m !== prev + 15) {
                    intervals.push({ start: toTime(start), end: toTime(prev + 15) });
                    start = m;
                  }
                  prev = m;
                }
                intervals.push({ start: toTime(start), end: toTime(prev + 15) });
              }
              return { date, intervals };
            } catch (e) {
              return { error: 'Failed to fetch free intervals: ' + e };
            }
          },
        }),
        obtener_turnos_disponibles: tool({
          description: 'Gets available appointments in a date and time range (inclusive)',
          inputSchema: z.object({
            dateStart: z.string(),
            dateEnd: z.string(),
            timeStart: z.string(),
            timeEnd: z.string(),
          }),
          execute: async ({ dateStart, dateEnd, timeStart, timeEnd }) => {
            if (!dateStart || !dateEnd || !timeStart || !timeEnd) {
              return { error: 'dateStart, dateEnd, timeStart and timeEnd are required' };
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
              return { error: 'Failed to fetch appointments: ' + e };
            }
          },
        }),
        reservar_turno: tool({
          description: 'Books an appointment for a patient; use obtener_turnos_disponibles first to verify availability',
          inputSchema: z.object({
            paciente: z.string(),
            date: z.string(),
            time: z.string(),
          }),
          execute: async ({ paciente, date, time }) => {
            if (!paciente || !date || !time) {
              return { error: 'paciente, date and time are required' };
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
              return { error: 'Failed to book the appointment: ' + e };
            }
          },
        }),
        terminar_reserva: tool({
          description: 'Ends the appointment booking chat. Call only after the booking has been confirmed.',
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