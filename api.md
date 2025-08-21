## API Reference / Referencia de API

Base URL: `/api`

### Auth
- **Header**: `Authorization: Bearer <PRENT_API_KEY>` (requerido por algunos endpoints internos). En endpoints de chat/summary se valida `PRENT_API_KEY` desde variables de entorno del servidor.

---

### Chat (Clínica)
- **POST** `/api/chat`
  - **Descripción**: Genera la siguiente pregunta clínica y sugerencias según el modo.
  - **Body**:
    ```json
    {
      "messages": [ { "role": "user|assistant", "content": "..." } ],
      "summary": "string opcional",
      "summaryFormat": "string opcional",
      "mode": "consultorio|urgencias",
      "id": 123
    }
    ```
  - **Respuestas**:
    - 200: `{ "message": string, "summary": string, "suggestions": string[], "shouldSummarize": boolean }`
    - 400: `{ error: 'Messages array is required' }`
    - 401: `{ error: 'API key is not valid' }`
    - 500: `{ error: 'Failed to generate AI response' }`

---

### Chat (Turnos)
- **POST** `/api/chat/turnos`
  - **Descripción**: Asistente de agenda que consulta disponibilidad y reserva turnos.
  - Usa internamente `/api/turnos` mediante tools. Registra uso del chat (costos/tokens).
  - **Body**:
    ```json
    {
      "messages": [ { "role": "user|assistant", "content": "..." } ],
      "idChat": 123
    }
    ```
  - **Respuestas**:
    - 200: `{ "message": string, "reserved": boolean, "turnoId": number|null }`
    - 400: `{ error: 'Messages array is required' }`
    - 401: `{ error: 'API key is not valid' }`
    - 500: `{ error: 'Failed to process scheduling request' }`

---

### Resumen de Chat
- **POST** `/api/summary`
  - **Descripción**: Actualiza/genera un resumen del chat (con o sin triaje) a partir de los últimos 10 mensajes.
  - **Body**:
    ```json
    {
      "messages": [ { "role": "user|assistant", "content": "..." } ],
      "summary": "resumen previo opcional",
      "summaryFormat": "plantilla opcional",
      "triageEnabled": true|false,
      "freeForm": true|false
    }
    ```
  - **Respuestas**:
    - 200: `{ "summary": string, "triage": { "level": "Rojo|Naranja|Amarillo|Verde|Azul", "reason"?: string } }`
    - 400: `{ error: 'Messages array is required' }`
    - 401: `{ error: 'API key is not valid' }`
    - 500: `{ error: 'Failed to generate summary' }`

---

### Transcripción de Audio (batch)
- **POST** `/api/transcribe`
  - **Descripción**: Transcribe audio en español.
  - **Entrada**: audio como `application/octet-stream` o JSON `{ "audio": "<url|data:base64|base64>" }`.
  - **Respuestas**:
    - 200: `{ "transcription": string }`
    - 500: `{ error: 'Failed to transcribe audio' }`

### Transcripción en Tiempo Real (session)
- **GET** `/api/session`
  - **Descripción**: Crea una sesión de transcripción en tiempo real (OpenAI Realtime).
  - **Respuestas**:
    - 200: JSON de sesión de OpenAI.

### Realtime SDP Proxy
- **POST** `/api/realtime`
  - **Descripción**: Proxy para intercambio de SDP con OpenAI Realtime.
  - **Body**:
    ```json
    { "sdp": "string", "key": "OPENAI_API_KEY", "model": "gpt-4o-transcribe" }
    ```
  - **Respuestas**: `Content-Type: application/sdp` o `{ error: string }`

---

### Turnos
- **GET** `/api/turnos`
  - **Descripción**: Lista turnos o disponibilidad.
  - **Query (lista)**: `date=YYYY-MM-DD` (opcional), `time=HH:MM|HH:MM:SS` (opcional).
  - **Query (disponibilidad)**: `startDate`, `endDate`, `startTime`, `endTime` (todos requeridos). Solo días hábiles 08:00–17:00, intervalos de 15m.
  - **Respuestas**:
    - Lista: `{ "turnos": Turno[] }`
    - Disponibilidad: `{ "available": [{ "date": "YYYY-MM-DD", "time": "HH:MM:00" }] }`
    - 400/500 con `{ error: string }`

- **POST** `/api/turnos`
  - **Descripción**: Crea un turno.
  - **Body**:
    ```json
    { "paciente": "string|null", "info": "string|null", "date": "YYYY-MM-DD", "time": "HH:MM" }
    ```
  - Reglas: solo días de semana; horas 08:00–17:00; minutos 00/15/30/45 (17:00 último slot).
  - **Respuestas**: 201 `{ "turno": Turno }` o `{ error: string }`

- **DELETE** `/api/turnos?id=123` (o body `{ "id": 123 }`)
  - **Descripción**: Elimina un turno.
  - **Respuestas**: `{ ok: true, id }` o `{ error: string }`

- **PATCH** `/api/turnos`
  - **Descripción**: Actualiza `info` de un turno.
  - **Body**: `{ "id": number, "info": string|null }`
  - **Respuestas**: `{ "turno": Turno }` o `{ error: string }`

Tipos clave (`Turno`):
```json
{ "id": number, "paciente": string|null, "info": string|null, "date": "YYYY-MM-DD", "time": "HH:MM:00" }
```

---

### Doctores
- **GET** `/api/doctores`
  - **Descripción**: Lista doctores y su paciente actual (si corresponde).
  - **Respuesta**: `{ "doctores": [ { "id": number, "nombre": string, "especialidad": string, "ocupado": boolean, "currentPaciente": { "id": number, "nombre": string, "prioridad": number, "hora_llegada": string, "asignacion_id": number, "hora_asignacion": string } | null } ] }`

- **POST** `/api/doctores/[id]/liberar`
  - **Descripción**: Marca paciente actual como atendido (si hay) y asigna el siguiente por prioridad y hora. Si no hay pacientes, deja el doctor libre.
  - **Respuesta**: `{ asignado: { doctor_id, paciente, asignacion } } | { asignado: null, doctorLibre: true } | { error }`

---

### Pacientes
- **POST** `/api/pacientes`
  - **Descripción**: Crea paciente y autoasigna a doctor libre si existe.
  - **Body**: `{ "nombre": string, "prioridad": 1..5 }`
  - **Respuestas**: 201 `{ paciente, asignadoA: number|null }` o `{ error }`

- **GET** `/api/pacientes`
  - **Query**: `atendido=true|false` (opcional), `limit` (1..100), `offset` (>=0), `order=prioridad_asc|prioridad_desc|hora_asc|hora_desc`
  - **Respuesta**: `{ pacientes: [...], count, limit, offset }`

- **PATCH** `/api/pacientes/[id]`
  - **Descripción**: Actualiza campo `atendido` (por defecto true si no se envía body).
  - **Body opcional**: `{ "atendido": boolean }`
  - **Respuestas**: `{ paciente }` o `{ error }`

---

### Costos / Tokens
- **POST** `/api/price`
  - **Descripción**: Calcula costo estimado a partir de uso de tokens.
  - **Body**:
    ```json
    {
      "tokenUsage": {
        "inputTokens": number,
        "outputTokens": number,
        "cachedInputTokens": number,
        "totalTokens": number,
        "reasoningTokens": number
      }
    }
    ```
  - **Respuesta**: `{ cost: number, breakdown: { ... }, pricing: { inputTokenCost, cachedInputTokenCost, outputTokenCost } }`

---

### Notas
- Fechas: `YYYY-MM-DD`. Horas: `HH:MM` o `HH:MM:SS` (normalizadas a `HH:MM:00`).
- Horario de turnos: lunes–viernes, 08:00–17:00, intervalos de 15 minutos; `17:00` es el último slot.
- Los endpoints retornan `{ error: string }` en errores 4xx/5xx.