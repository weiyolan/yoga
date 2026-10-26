import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { useClient, useFormValue, type ObjectInputProps } from "sanity";
import { href, type Route } from "../../lib/routes";
import {
  apiVersion,
  defaultLanguage,
  languages,
  type Lang,
} from "../../sanity/site.config";
import { SITE_URL, siteOrigin } from "../lib/site";

type I18n = { language?: string; value?: unknown }[] | undefined;
const of = (items: I18n, lang: Lang) => {
  const v =
    items?.find((i) => i.language === lang)?.value ??
    items?.find((i) => i.language === defaultLanguage)?.value;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
};

/** The page behind a document (for the URL line). */
const ROUTE: Record<string, Route> = {
  homePage: "home",
  settings: "home",
  retreatsPage: "retreats",
  lessonsPage: "lessons",
  aboutPage: "about",
  galleryPage: "gallery",
  contactPage: "contact",
  faqPage: "faq",
  "legal-privacy": "privacy",
  "legal-terms": "terms",
  "legal-cancellation": "cancellation",
  "legal-cookies": "cookies",
};

type Doc = {
  _id?: string;
  _type?: string;
  slug?: { current?: string };
  hero?: { title?: I18n; subtitle?: I18n };
  title?: I18n;
  intro?: I18n;
  nutshellText?: I18n;
  driveText?: I18n;
};

/** Same fallbacks as the website (lib/metadata.ts + the pages' generateMetadata). */
function fallbacks(doc: Doc | undefined, lang: Lang) {
  return {
    title: of(doc?.hero?.title, lang) ?? of(doc?.title, lang),
    description:
      of(doc?.hero?.subtitle, lang) ??
      of(doc?.intro, lang) ??
      of(doc?.nutshellText, lang) ??
      of(doc?.driveText, lang),
  };
}

const clip = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;

/**
 * “SEO & delen”: the fields + how the page shows in Google, per language, with the fallbacks the
 * website uses when a field is empty, and a length check (title ≈ 60 incl. the site name, description ≈ 155).
 */
export function SeoInput(props: ObjectInputProps) {
  const doc = useFormValue([]) as Doc | undefined;
  const value = props.value as { title?: I18n; description?: I18n } | undefined;
  const client = useClient({ apiVersion });
  const [site, setSite] = useState<{ name?: string; description?: I18n }>({});
  useEffect(() => {
    client
      .fetch<{ name?: string; description?: I18n } | null>(
        `*[_id == "settings"][0]{ "name": siteName, "description": seo.description }`,
      )
      .then((s) => setSite(s ?? {}))
      .catch(() => {});
  }, [client]);

  const id = doc?._id?.replace(/^drafts\./, "") ?? "";
  const route: Route | undefined =
    doc?._type === "retreat" ? "retreats" : ROUTE[id];
  const isHome = route === "home";
  const siteName = site.name || "Yoga, Zen & Tonic";

  return (
    <Stack gap={4}>
      {route ? (
        <Stack gap={3}>
          <Text size={1} weight="semibold">
            Zo toont Google deze pagina
          </Text>
          <Card padding={2} radius={2} border>
            <Stack gap={2}>
              <Text size={0} muted>
                Deelkaart voor WhatsApp & Facebook (gepubliceerde versie, NL)
              </Text>
              <img
                src={`${siteOrigin()}/og/${defaultLanguage}/${doc?._type === "retreat" && doc.slug?.current ? `retreat.${doc.slug.current}` : route}.jpg`}
                alt=""
                style={{
                  width: "100%",
                  maxWidth: 480,
                  aspectRatio: "1200 / 630",
                  objectFit: "cover",
                  borderRadius: 4,
                  background: "#0F1A1D",
                }}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </Stack>
          </Card>
          {languages.map((l) => {
            const fb = fallbacks(doc, l.id);
            const own = of(value?.title, l.id);
            const title = own ?? (isHome ? undefined : fb.title);
            const fullTitle = isHome
              ? title
                ? `${siteName} · ${title}`
                : siteName
              : title
                ? `${title} · ${siteName}`
                : siteName;
            const ownDesc = of(value?.description, l.id);
            const desc =
              ownDesc ?? fb.description ?? of(site.description, l.id) ?? "";
            const url =
              SITE_URL.replace(/^https?:\/\//, "") +
              href(l.id, route, {
                slug: doc?._type === "retreat" ? doc?.slug?.current : undefined,
              });
            const warn = [
              fullTitle.length > 60
                ? `titel ${fullTitle.length} tekens (Google toont ≈ 60, incl. “ · ${siteName}”)`
                : null,
              !ownDesc
                ? "geen eigen beschrijving: de site neemt de introtekst"
                : null,
              desc.length > 160
                ? `beschrijving ${desc.length} tekens: wordt ingekort`
                : null,
              desc && desc.length < 70
                ? "beschrijving erg kort (mik op 120–155 tekens)"
                : null,
            ].filter(Boolean);
            return (
              <Card key={l.id} padding={3} radius={2} border>
                <Stack gap={2}>
                  <Flex gap={2} align="center">
                    <Text size={0} muted>
                      {l.title}
                    </Text>
                    <Text size={0} muted>
                      ·
                    </Text>
                    <Text size={0} muted textOverflow="ellipsis">
                      {url}
                    </Text>
                  </Flex>
                  <Text size={2} style={{ color: "#1a0dab" }}>
                    {clip(fullTitle, 62)}
                  </Text>
                  <Text size={1} muted>
                    {desc
                      ? clip(desc.replace(/\s+/g, " "), 158)
                      : "— geen beschrijving —"}
                  </Text>
                  {warn.length ? (
                    <Box paddingTop={1}>
                      <Text size={0} style={{ color: "#b26b00" }}>
                        {warn.join(" · ")}
                      </Text>
                    </Box>
                  ) : null}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      ) : null}
      {props.renderDefault(props)}
    </Stack>
  );
}
