import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@napi-rs/canvas", "unpdf"],
  experimental: {
    proxyClientMaxBodySize: "25mb",
  },
};

export default nextConfig;
