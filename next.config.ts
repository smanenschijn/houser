import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "@napi-rs/canvas", "unpdf"],
};

export default nextConfig;
