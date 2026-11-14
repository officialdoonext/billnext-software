import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable caching completely */
  cacheComponents: false,
  partialPrefetching: false,
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
