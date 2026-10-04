import type { Metadata, Viewport } from "next";

/** Own root layout: the Studio brings its own UI, none of the site's chrome or CSS. */
export const metadata: Metadata = { title: "Studio · Yoga, Zen & Tonic", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="nl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
