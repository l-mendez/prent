// Disabled — see agent/tools/bash.ts. The original agent asked the patient questions as plain
// text (the turn ends and waits for the next message), not via a mid-turn parking tool.
import { disableTool } from "eve/tools";

export default disableTool();
