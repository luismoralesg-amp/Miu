import { resetAdapters } from "@/lib/adapters";
import { devToolsEnabled } from "@/modules/identity/session";
import { resetPolicyState } from "@/modules/policy";

/**
 * Demo and tests only (404 without MIU_DEV_TOOLS in production): forgets everything the mock adapters
 * keep in this server's memory, as if the next request landed on a brand-new serverless instance.
 * A demo that still works afterwards does not depend on that memory.
 */
export function POST() {
  if (!devToolsEnabled()) return new Response("Not found", { status: 404 });
  resetAdapters();
  resetPolicyState();
  return Response.json({ reset: true });
}
