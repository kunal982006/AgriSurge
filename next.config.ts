import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce bundle size by tree-shaking barrel exports from icon libraries
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
    },
  },
  // Opt out of telemetry for faster dev
  experimental: {
    // Reduce memory pressure during dev compilation
    webpackMemoryOptimizations: true,
  },
  // Compress responses
  compress: true,
};

export default nextConfig;
