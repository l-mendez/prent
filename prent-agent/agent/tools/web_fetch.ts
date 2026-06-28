// Disabled — see agent/tools/bash.ts. The original agent could not fetch arbitrary URLs;
// it only talked to /api/turnos through the four authored tools.
import { disableTool } from "eve/tools";

export default disableTool();
