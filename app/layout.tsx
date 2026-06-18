import type { Metadata } from "next";
import "./styles/styles-v3.css";
import "./styles/chalk-lineart.css";
import "./styles/lines-v1.css";
import SiteScripts from "@/components/SiteScripts";

export const metadata: Metadata = {
  title: "Yoga, Zen & Tonic — Beyond the mat, into the moment",
  description:
    "Geen zweverig gedoe. Wél yoga, natuur, lekker eten en warme mensen. Retreats, events & coaching voor jong en oud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="nl"
      data-lang="nl"
      data-design="lines"
      data-theme="boheme"
      data-font="fraunces"
      data-space="airy"
      data-ink="medium"
      data-paper="on"
      data-deco="on"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesque:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <SiteScripts />
      </body>
    </html>
  );
}
