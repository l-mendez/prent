# Migration to Eve (agent framework)

Migration of Prent's AI/agent layer from ad‑hoc AI‑SDK / LangChain / OpenAI route handlers to
**[Eve](https://eve.dev/docs/introduction)**, Vercel's filesystem‑first framework for durable
backend agents.

> **Status: all AI surfaces migrated** into one Eve project, `prent-agent/`, mounted into the
> existing Next.js app via `withEve`. Audio (Whisper / Realtime) is intentionally left on Next.js
> (not an Eve‑shaped workload). The original routes were **not deleted** — the Eve agent runs
> alongside them until you swap the frontend over.

---

## 1. What changed conceptually

The old code implemented agents by hand inside Next.js route handlers: a `generateText`/
`generateObject` call, an inline `tools: {…}` object, a giant `system` prompt string, manual
token/cost bookkeeping — re‑created per request, with conversation state owned by the browser.

Eve replaces that with a **filesystem‑first agent**: prompts are markdown/TS, each tool is a typed
file, runtime config is one `defineAgent`, and the runtime provides **durable resumable sessions**,
a stable HTTP API, streaming, hooks, and a React hook.

| Old pattern | Eve equivalent |
| --- | --- |
| `system: "<prompt>"` per route | `agent/instructions.md` + dynamic `agent/instructions/persona.ts` (per‑mode) |
| inline `tools: { foo: tool({…}) }` | `agent/tools/` (`defineTool`); here a mode‑gated `defineDynamic` set |
| `generateText/Object({ model, … })` | `agent/agent.ts` (`defineAgent`) + Eve harness |
| separate endpoints per feature | one agent, **mode‑routed** (see §3) |
| `POST /api/chat\|agendar\|summary` | `POST /eve/v1/session` + durable session + `GET …/stream` |
| browser re‑sends full history each call | server‑side durable session, resumed via `continuationToken` |
| `createChat/updateChat` after each call | `agent/hooks/token-usage.ts` on `step.completed` |
| structured `generateObject` output | per‑message `outputSchema` from the client |

---

## 2. AI surface inventory

| Original | Migrated to |
| --- | --- |
| `app/api/chat/turnos/route.ts` (scheduler "Claudia", 4 booking tools) | **turnos** mode |
| `app/api/agendar/route.ts` (3 doctor/specialty tools) | folded into **turnos** mode (7 tools total) |
| `app/api/chat/route.ts` consultorio (clinical interview → `{message, suggestions}`) | **consultorio** mode |
| `app/api/chat/route.ts` urgencias (ER triage interview) | **urgencias** mode |
| `app/api/summary/route.ts` (`{summary, triage}`) | **resumen** mode |
| `app/api/turnos`, `/api/doctores/agent` (REST + Supabase) | unchanged — the agent's tools call them |
| token/cost tracking (`db/utils.ts`) | `agent/hooks/token-usage.ts` + `agent/lib/usage.ts` |
| `app/api/transcribe`, `/session`, `/realtime` (audio) | **not migrated** — kept on Next.js (not Eve‑shaped) |
| `app/api/price`, `/embeddings` | utility endpoints, n/a |

---

## 3. Architecture: one mode‑routed agent

`withEve` mounts exactly **one** Eve project, so all personas live in `prent-agent/` and are
selected per session by a **mode**:

- The UI sends its selected mode as the **`x-prent-mode`** header.
- The eve channel auth (`agent/channels/eve.ts`) copies it onto the session's **auth attributes**
  (`clientContext` can't carry routing data — it's per‑turn prompt text the model sees, not
  readable by authored code; auth attributes are the documented per‑session channel).
- `defineDynamic` resolvers read `ctx.session.auth.current?.attributes.mode`:
  - `agent/instructions/persona.ts` → the right system prompt (turn.started).
  - `agent/tools/turnos.ts` → the 7 scheduling tools **only** in `turnos` mode; clinical/resumen
    modes get **no tools** (session.started).
- Clinical/summary turns get structured output because the **client passes a per‑message
  `outputSchema`** (agent‑level `outputSchema` is task‑mode only; interactive turns need the
  client schema). Header‑less callers (e.g. the eve TUI) default to `turnos`.

```
prent-agent/
├── package.json                # prent-turnos-agent; deps: eve, ai, @ai-sdk/openai, @supabase/supabase-js, zod
├── .env.example
└── agent/
    ├── agent.ts                # defineAgent({ model: openai("gpt-5"), reasoning: "low" })
    ├── instructions.md         # shared root preamble (Spanish, AI disclosure)
    ├── instructions/persona.ts # DYNAMIC: per-mode system prompt (turnos/consultorio/urgencias/resumen)
    ├── tools/
    │   ├── turnos.ts           # DYNAMIC: 7 tools in turnos mode (4 booking + 3 doctor); null otherwise
    │   └── (ask_question|bash|glob|grep|read_file|todo|web_fetch|web_search|write_file).ts  # disableTool()
    ├── hooks/token-usage.ts    # cost/token tracking → Supabase `chats` (per-turn)
    ├── channels/eve.ts         # mode-aware auth (x-prent-mode → attributes.mode)
    └── lib/
        ├── config.ts           # base URL + Mode type + mode-from-attributes
        ├── prompts.ts          # the 4 migrated system prompts
        ├── turnos-api.ts       # /api/turnos client (booking/availability)
        ├── doctores-api.ts     # /api/doctores/agent client (specialty/doctor)
        └── usage.ts            # GPT-5 pricing + chats-table writer (port of db/utils.ts)
```

---

## 4. How to run and verify

```bash
cd prent-agent
cp .env.example .env.local     # fill in the values
pnpm exec eve dev              # interactive REPL (defaults to turnos mode)
```

**Env (`prent-agent/.env.local`):** `OPENAI_API_KEY` (the model uses the OpenAI provider directly,
reusing the original key), `TURNOS_API_BASE_URL` (the Next app serving `/api/turnos` &
`/api/doctores/agent`), and optionally `PRENT_API_KEY` + `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
for cost tracking (omit → usage is logged, not written).

**HTTP / mode routing:**
```bash
pnpm exec eve dev --no-ui
curl -X POST http://127.0.0.1:3000/eve/v1/session \
  -H 'content-type: application/json' -H 'x-prent-mode: turnos' \
  -d '{"message":"Hola, quiero un turno para mañana a las 9"}'
curl -N "http://127.0.0.1:3000/eve/v1/session/<sessionId>/stream?startIndex=0"
```

### Verified in this environment
- `tsc` typecheck: ✅ clean.
- `eve info --json`: ✅ 0 diagnostics — discovers the `persona` dynamic instructions, the `turnos`
  dynamic tools, the `token-usage` hook, 9 disabled built‑ins, and the OpenAI model.
- `eve build`: ✅ produces `.output/` (bundles `@ai-sdk/openai`, `@supabase/supabase-js`, `eve`).
- `eve dev --no-ui` + HTTP, **all four modes**: ✅ sessions create, the per‑mode persona/tool
  resolvers run, and each reaches the model call, failing only with
  `MODEL_CALL_FAILED: Model provider API key missing` (the **OpenAI provider** error — confirms the
  direct‑provider wiring and that routing works). Set `OPENAI_API_KEY` for live responses.
- Two adversarial review passes (independent agents vs the originals + the eve docs, each finding
  re‑verified by a skeptic). Fixes applied are noted in §6.

> **Not verified here:** the Next.js app was not built in the cloud sandbox (its `node_modules`
> were not installed), and the frontend wiring is gated on a version decision — see §5.

---

## 5. Frontend wiring (Next.js)

**Blocked by a version gap — intentionally not applied to the app.** `eve@0.16` peers on `ai@^7`
(non‑optional) and `next@^16`, but this app is on `ai@5` / `@ai-sdk/openai@2` / `next@15.4.6`.
Adding `eve` + `withEve` would break the app's install/build, so those edits were **reverted** to
keep the app working as‑is. Pick a path first:

- **(a) Upgrade the app** to `next@16` + `ai@7` + `@ai-sdk/openai@4` (matching the agent), then set
  `withEve(nextConfig, { eveRoot: "./prent-agent" })` in `next.config.ts`, add `"eve": "^0.16.0"`
  to `package.json`, and drop in the component below.
- **(b) Run the agent standalone** (`cd prent-agent && eve deploy`) and have the browser call it at
  its own origin via `useEveAgent({ host })` (or a thin fetch client over `/eve/v1/*`), keeping the
  app off `eve`/`ai@7`.

The ready‑to‑use component is at **`prent-agent/examples/EveChatInterface.tsx.example`** (mode
header, turnos HITL approval, clinical structured suggestions, resumen) — rename to `.tsx` into
`app/(product)/components/` and swap it for `<ChatInterface/>` once a path above is chosen.

Client‑contract mapping (old → new), all via `useEveAgent({ headers: () => ({ 'x-prent-mode': mode }) })`:

| Old | New |
| --- | --- |
| `fetch('/api/agendar', { messages, id })` | `agent.send({ message })`; session state is server‑side |
| `fetch('/api/chat', …)` → `{ message, suggestions }` | `agent.send({ message, outputSchema })`; read `messages.at(-1).metadata.result` |
| `{ reserved, turnoId }` | the `reservar_turno` tool result in the stream |
| `/api/summary` → `{ summary, triage }` | a separate `x-prent-mode: resumen` session with `{summary,triage}` `outputSchema` |
| booking just happened | **booking now pauses for approval** (HITL) — surfaced at `part.toolMetadata?.eve?.inputRequest`; answer with `agent.send({ inputResponses: [{ requestId, optionId }] })` |

> **Auth:** replace the demo `prentModeAuth` in `agent/channels/eve.ts` with real auth
> (Auth.js/Clerk/…) before production — keep it setting `attributes.mode` and returning
> `principalType: "user"`.

---

## 6. Behavioral deltas & decisions

1. **Model: OpenAI direct.** `openai("gpt-5")` via `@ai-sdk/openai@4` (matches eve's
   `@ai-sdk/provider@4`), reusing `OPENAI_API_KEY`. `reasoning_effort:"low"` → `reasoning:"low"`.
   To route via the AI Gateway instead, set `model: "openai/gpt-5"`.
2. **Booking now requires approval (HITL).** `reservar_turno` uses `approval: always()` (your
   "ok" to the recommendation). The booking pauses until the UI approves — the original auto‑booked.
   Revert with `approval: never()` (or remove the line) for pure auto‑book.
3. **Mode routing via auth attributes**, not `clientContext` (which is per‑turn prompt text only).
4. **Structured output is per‑message** (`outputSchema` supplied by the client), since interactive
   turns ignore an agent‑level `outputSchema`. The clinical `###RESUMEN###` close token is kept in
   `message` exactly as before (the UI strips it and triggers a `resumen` call).
5. **`agent` (subagent‑spawn) built‑in can't be disabled** in eve 0.16 (only `ask_question, bash,
   glob, grep, load_skill, read_file, todo, web_fetch, web_search, write_file` are). It remains
   available in every mode; it can only spawn a copy of the same (already locked‑down) agent, so the
   risk is low, but it's a residual vs the original closed tool sets. (This was caught at runtime —
   a `disableTool()` for `agent` typechecks and builds but 500s on session start.)
6. **Cost tracking is per‑turn.** The hook accumulates `step.completed` token usage and writes one
   `chats` row per conversation (created on the first turn, incremented after), mirroring
   `db/utils.ts`. `input` stores only non‑cached prompt tokens (`inputTokens − cacheReadTokens`),
   since `ai@7`'s `inputTokens` already includes the cached ones — so cost/totals don't double‑count.
   No‑ops with a log line if Supabase/`PRENT_API_KEY` env is absent. *(Least exercised at runtime —
   no DB in the sandbox.)* Two minor known gaps vs the original: the caller‑supplied `summaryFormat`
   override isn't threaded through to `resumen` mode (it uses the default medical form), and the API
   key is validated on the create turn but not re‑checked on each update (harmless unless the key is
   rotated mid‑session).
7. **Dropped per‑call knobs.** `temperature` / `presencePenalty` / `stopWhen(steps>6)` aren't
   first‑class `defineAgent` fields; gpt‑5 (reasoning model) effectively ignores the first two, and
   the harness has no `maxSteps` knob (only `compaction`). The realistic turnos loop is 2–3 steps.
8. **Timezone pinned to Argentina** (24h) in the scheduler's date context — a bugfix over the
   original server‑local time (UTC on Vercel would be ~3h off).
9. **Built‑ins disabled** (`bash`, `read_file`, `write_file`, `glob`, `grep`, `web_fetch`,
   `web_search`, `todo`, `ask_question`) so a patient‑facing agent has no shell/file/web surface.
10. **Free‑interval `end` off‑by‑one** is preserved verbatim from the original `obtener_intervalos_libres`
    (not a regression) — worth fixing in a later pass.

---

## 7. Not migrated

- **Audio** (`/api/transcribe`, `/api/session`, `/api/realtime`): Whisper batch + OpenAI Realtime —
  not a fit for Eve's text‑session model. Keep on Next.js, or later expose transcription as a tool.
- The original AI routes remain in place; remove them once the frontend is fully on the Eve agent.
