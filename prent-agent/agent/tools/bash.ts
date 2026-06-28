// Disabled. The original turnos route had a closed set of exactly four tools and no
// shell/file/web/subagent access. eve's default harness would otherwise expose `bash` to a
// patient-facing secretary — see node_modules/eve/docs/concepts/default-harness.md ("Disable,
// wrap, restrict, or require approval for any tool that can access the filesystem, network,
// shell, or sensitive data.").
import { disableTool } from "eve/tools";

export default disableTool();
