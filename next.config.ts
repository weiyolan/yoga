import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  // Photos come straight from the Sanity image CDN (srcset in components/Photo.tsx); no Next optimizer.
  images: { unoptimized: true, remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }] },
  poweredByHeader: false,
  // Share images (app/og) read their fonts from disk: ship them with the function.
  outputFileTracingIncludes: { "/og/[lang]/[file]": ["./assets/fonts/**"] },
  // Team notifications through Netlify Forms (app/actions/forms.ts toTeam): on when built on Netlify.
  env: { NETLIFY_FORMS: process.env.NETLIFY_FORMS ?? (process.env.NETLIFY === "true" ? "1" : "0") },
  // The Coaching page became the Privéles section on Lessen.
  redirects: async () => [
    { source: "/coaching", destination: "/lessen#prive", permanent: true },
    { source: "/en/coaching", destination: "/en/lessons#prive", permanent: true },
  ],
};

export default nextConfig;
