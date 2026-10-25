import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // Photos come straight from the Sanity image CDN (srcset in components/Photo.tsx); no Next optimizer.
  images: { unoptimized: true, remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }] },
  poweredByHeader: false,
  // The Coaching page became the Privéles section on Lessen.
  redirects: async () => [
    { source: "/coaching", destination: "/lessen#prive", permanent: true },
    { source: "/en/coaching", destination: "/en/lessons#prive", permanent: true },
  ],
};

export default nextConfig;
