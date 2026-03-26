import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // TypeScript errors ko ignore karega
  },
  eslint: {
    ignoreDuringBuilds: true, // ESLint warnings ko ignore karega
  },
};

export default nextConfig;