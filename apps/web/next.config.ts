import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const APP_VERSION = (
  JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const MONOREPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: MONOREPO_ROOT,
  transpilePackages: ["@magista/shared"],
  poweredByHeader: false,
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  headers: async () => [
    { source: "/:path*", headers: SECURITY_HEADERS },
    {
      source: "/arena/:file([^/]+\\.(?:jpg|jpeg|png|webp))",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ],
};

export default nextConfig;
