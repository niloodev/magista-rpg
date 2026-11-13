import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@magista/shared"],
  poweredByHeader: false,
};

export default nextConfig;
