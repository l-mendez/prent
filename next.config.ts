import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Mount the Eve agent (prent-agent/) alongside the Next.js app.
// See MIGRATION_EVE.md §5 (path a).
export default withEve(nextConfig, { eveRoot: "./prent-agent" });
