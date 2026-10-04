import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // Photos come straight from the Sanity image CDN (srcset in components/Photo.tsx); no Next optimizer.
  images: { unoptimized: true, remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }] },
  poweredByHeader: false,
};

export default nextConfig;
