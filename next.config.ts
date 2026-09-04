import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained build so the Docker runtime image stays small.
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
