import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained build so the Docker runtime image stays small.
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ylazbgsitgvgqzvbgmqg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
