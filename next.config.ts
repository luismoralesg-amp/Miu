import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  // Submissions travel through a server action; the demo accepts files up to 10 MB (StoragePort).
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  async headers() {
    return [
      { source: "/:path*", headers: [...securityHeaders] },
      // The worker must always be re-checked, or an update could be stuck behind a cache.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
