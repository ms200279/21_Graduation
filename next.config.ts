import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["192.168.196.27", "192.168.43.118"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "egfgkebxcsl0qput.public.blob.vercel-storage.com",
        pathname: "/works/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
