import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { Cursor } from "@/components/Cursor";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { htmlLang } from "@/lib/format";
import { siteUrl } from "@/lib/metadata";
import { sanityFetch } from "@/sanity/fetch";
import { LAYOUT_QUERY } from "@/sanity/queries";
import { isLang, languageIds } from "@/sanity/site.config";
import "../globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });

/** One prerendered tree per language; anything else is a 404. */
export const dynamicParams = false;
export const generateStaticParams = () => languageIds.map((lang) => ({ lang }));

export const metadata: Metadata = { metadataBase: new URL(siteUrl) };
export const viewport: Viewport = { themeColor: "#F4F1EC" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const layout = await sanityFetch({ query: LAYOUT_QUERY, lang });
  return (
    <html lang={htmlLang(lang)} className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Nav lang={lang} layout={layout} />
        <main>{children}</main>
        <Footer lang={lang} layout={layout} />
        <Cursor />
      </body>
    </html>
  );
}
