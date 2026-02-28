import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use output: 'export' for static-only; remove for Vercel with API routes
  reactStrictMode: true,
  trailingSlash: false,
};

export default nextConfig;
