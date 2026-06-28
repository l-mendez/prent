import { eveChannel } from "eve/channels/eve";
import { type AuthFn, localDev, vercelOidc } from "eve/channels/auth";
import { MODES } from "../lib/config.js";

// DEV/DEMO auth. Accepts every caller and copies the UI's selected mode (the `x-prent-mode`
// header) onto the session's auth attributes, where the dynamic persona/tools resolvers read it
// (agent/instructions/persona.ts, agent/tools/turnos.ts).
//
// This is NOT real authentication. Before production, REPLACE this with your own AuthFn
// (Auth.js, Clerk, an OIDC/JWT or API-key verifier) — and keep setting `attributes.mode` from
// the header and returning `principalType: "user"`.
function prentModeAuth(): AuthFn<Request> {
  return (request) => {
    const header = request.headers.get("x-prent-mode") ?? "turnos";
    const mode = (MODES as readonly string[]).includes(header) ? header : "turnos";
    return {
      authenticator: "app",
      principalId: "prent-web",
      principalType: "user",
      attributes: { mode },
    };
  };
}

export default eveChannel({
  // prentModeAuth MUST come first: under `withEve`, browser requests are proxied to eve over
  // localhost, so a leading localDev() would accept them before the x-prent-mode header is read
  // and every session would default to "turnos". prentModeAuth accepts all callers (header-less
  // ones, like the eve TUI, default to "turnos"), so the entries below are documentation of the
  // production path — replace prentModeAuth with real auth that runs first and sets attributes.mode.
  auth: [prentModeAuth(), vercelOidc(), localDev()],
});
