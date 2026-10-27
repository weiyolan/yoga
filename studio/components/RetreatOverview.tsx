import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { ChevronDownIcon } from "@sanity/icons/ChevronDown";
import { ChevronRightIcon } from "@sanity/icons/ChevronRight";
import { CircleIcon } from "@sanity/icons/Circle";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useState } from "react";
import type { ObjectInputProps } from "sanity";

type I18n = { language?: string; value?: unknown }[];
type Kind = "text" | "photo" | "list" | "number";
type Check = { label: string; get: (d: Record<string, unknown>) => unknown; kind: Kind; translate?: boolean };
type Section = { group: string; title: string; where: string; checks: Check[]; optional?: boolean; past?: boolean };

const at = (path: string) => (d: Record<string, unknown>) => path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], d);
const t = (label: string, path: string): Check => ({ label, get: at(path), kind: "text", translate: true });
const photo = (label: string, path: string): Check => ({ label, get: at(path), kind: "photo" });
const list = (label: string, path: string): Check => ({ label, get: at(path), kind: "list" });
const num = (label: string, path: string): Check => ({ label, get: at(path), kind: "number" });
const plain = (label: string, path: string): Check => ({ label, get: at(path), kind: "text" });

/** The retreat page from top to bottom: which tab fills which part (app/[lang]/retreats/[slug]/page.tsx). */
const SECTIONS: Section[] = [
  {
    group: "basics",
    title: "Basis",
    where: "Bovenaan de pagina en op de kaartjes (Retreats, Home): datum, plaats, prijs vanaf, “nog x plaatsen”.",
    checks: [t("Titel", "title"), plain("Slug", "slug.current"), plain("Van", "startDate"), plain("Tot en met", "endDate"), t("Plaats", "place"), t("Land", "country"), plain("Verblijf", "venue"), num("Max. deelnemers", "capacity"), num("Prijs vanaf", "priceFrom")],
  },
  {
    group: "photos",
    title: "Beelden",
    where: "De grote foto met titel helemaal bovenaan (ook de foto op de kaartjes) + de rij sfeerfoto's eronder.",
    checks: [photo("Openingsfoto", "hero.photo"), t("Titel op de foto", "hero.title"), t("Ondertitel", "hero.subtitle"), list("Sfeerfoto's", "moodPhotos")],
  },
  {
    group: "nutshell",
    title: "Notendop",
    where: "“In een notendop”: het eerste tekstblok, met de belangrijkste punten op een rij.",
    checks: [t("Kop", "nutshellTitle"), t("Intro", "nutshellText"), t("Hoogtepunten", "highlights")],
  },
  { group: "place", title: "De plek", where: "“De plek”: het verblijf en de omgeving, met 2 foto's.", checks: [t("Kop", "placeTitle"), t("Tekst", "placeText"), list("Foto's", "placePhotos")] },
  { group: "people", title: "De mensen", where: "“De mensen”: wie begeleidt (foto + naam), ook in de feitjes naast de prijs.", checks: [list("Begeleiding", "hosts")] },
  { group: "programme", title: "Programma", where: "“Het programma”: dag per dag of moment per moment.", checks: [list("Onderdelen", "programme")] },
  {
    group: "practical",
    title: "Praktisch",
    where: "“Praktisch”: prijzen per kamer, voorschot, wat (niet) inbegrepen is. De prijzen zijn ook de kamerkeuze in het formulier.",
    checks: [list("Prijzen", "prices"), num("Voorschot", "deposit"), t("Inbegrepen", "included"), t("Niet inbegrepen", "notIncluded")],
  },
  {
    group: "closing",
    title: "Afsluiter",
    where: "Het slot onderaan: grote foto met kop, korte tekst en de knop Inschrijven.",
    checks: [t("Kop", "closingTitle"), t("Tekst", "closingText"), photo("Slotfoto", "closingPhoto")],
  },
  {
    group: "signup",
    title: "Inschrijven",
    where: "Wat de knop Inschrijven opent en welke mail volgt. Leeg = het standaardformulier en de standaardmail.",
    optional: true,
    checks: [plain("Externe link", "signupUrl"), plain("Formulier", "signupForm._ref"), plain("Bevestigingsmail", "confirmationMail._ref")],
  },
  { group: "recap", title: "Achteraf", where: "Na de einddatum: aantal deelnemers + de foto's van de retreat.", past: true, checks: [num("Aantal deelnemers", "participantCount"), list("Foto's achteraf", "recapPhotos")] },
  { group: "seo", title: "SEO", where: "Google en delen op WhatsApp / Facebook. Leeg = titel + notendop.", optional: true, checks: [t("Titel", "seo.title"), t("Beschrijving", "seo.description")] },
];

const hasText = (v: unknown) => (typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v != null);
const lang = (v: unknown, l: string) => Array.isArray(v) && (v as I18n).some((i) => i?.language === l && hasText(i.value));
const isI18n = (v: unknown) => Array.isArray(v) && (v as I18n).every((i) => i && typeof i === "object" && "language" in i);

function filled(c: Check, d: Record<string, unknown>) {
  const v = c.get(d);
  if (c.kind === "number") return typeof v === "number";
  if (c.kind === "photo") return !!(v as { _ref?: string } | undefined)?._ref;
  if (c.kind === "list") return Array.isArray(v) && v.length > 0;
  return isI18n(v) ? lang(v, "nl") : hasText(v);
}
/** A translated field with NL text but no EN (the site then shows the NL text). */
const missingEn = (c: Check, d: Record<string, unknown>) => !!c.translate && lang(c.get(d), "nl") && !lang(c.get(d), "en");

const KEY = "retreat-overview-open";
const EMBER = "#D4552B";
const GREEN = "#3ab667";

type Status = Section & { done: Check[]; noEn: Check[] };

/** One part: status, x/y, where it shows on the page, what's still empty. */
function Help({ s }: { s: Status }) {
  const full = s.done.length === s.checks.length;
  const empty = s.done.length === 0;
  const missing = s.checks.filter((c) => !s.done.includes(c)).map((c) => c.label);
  return (
    <Flex gap={2} align="flex-start">
      <Text size={1}>
        {(() => {
          const style = { color: full || (s.optional && !empty) ? GREEN : empty ? "var(--card-muted-fg-color)" : EMBER };
          return full || (s.optional && !empty) ? <CheckmarkCircleIcon style={style} /> : <CircleIcon style={style} />;
        })()}
      </Text>
      <Stack gap={2} flex={1}>
        <Text size={1} weight="medium">
          {s.title}{" "}
          <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "0.85em" }}>
            {s.optional ? (empty ? "standaard" : "aangepast") : `${s.done.length}/${s.checks.length}`}
            {s.noEn.length ? ` · ${s.noEn.length} zonder EN` : ""}
          </span>
        </Text>
        <Text size={0} muted>
          {s.where}
        </Text>
        {!s.optional && missing.length && !empty ? (
          <Text size={0}>
            <span style={{ color: EMBER }}>Nog leeg: {missing.join(", ")}</span>
          </Text>
        ) : null}
      </Stack>
    </Flex>
  );
}

/**
 * On top of every retreat: the page from top to bottom, with per part where it shows up on the site,
 * what's filled in (x/y), which texts still lack an English version, and one progress bar.
 * Click a part to open its tab. Optional parts (Inschrijven, SEO) don't count for the progress.
 */
export function RetreatOverviewInput(props: ObjectInputProps) {
  const doc = (props.value ?? {}) as Record<string, unknown>;
  const [open, setOpen] = useState(() => localStorage.getItem(KEY) !== "0");
  const toggle = () => setOpen((o) => (localStorage.setItem(KEY, o ? "0" : "1"), !o));
  const today = new Date().toISOString().slice(0, 10);
  const past = typeof doc.endDate === "string" && doc.endDate < today;
  const sections = SECTIONS.filter((s) => !s.past || past).map((s) => ({
    ...s,
    done: s.checks.filter((c) => filled(c, doc)),
    noEn: s.checks.filter((c) => missingEn(c, doc)),
  }));
  const counted = sections.filter((s) => !s.optional);
  const total = counted.reduce((n, s) => n + s.checks.length, 0);
  const done = counted.reduce((n, s) => n + s.done.length, 0);
  const noEn = sections.reduce((n, s) => n + s.noEn.length, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const active = props.groups.find((g) => g.selected)?.name;
  const current = sections.find((s) => s.group === active);

  return (
    <Stack gap={5}>
      <Card border radius={3} padding={3} tone={pct === 100 ? "positive" : "default"}>
        <Stack gap={3}>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Stack gap={2}>
                <Text size={1} weight="semibold">
                  Retreatpagina {pct}% ingevuld
                  {noEn ? ` · ${noEn} tekst${noEn > 1 ? "en" : ""} zonder EN` : ""}
                </Text>
                <div style={{ height: 6, borderRadius: 3, background: "var(--card-border-color)", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? GREEN : EMBER, transition: "width .3s" }} />
                </div>
              </Stack>
            </Box>
            <Button mode="bleed" fontSize={1} padding={2} icon={open ? ChevronDownIcon : ChevronRightIcon} text={open ? "Verberg" : "Alle delen"} onClick={toggle} />
          </Flex>
          {current && !open ? <Help s={current} /> : null}
          {open ? (
            <Stack gap={2}>
              <Text size={0} muted>
                De pagina van boven naar onder. Klik op een deel om het te openen.
              </Text>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 4 }}>
                {sections.map((s) => (
                  <Card
                    key={s.group}
                    as="button"
                    type="button"
                    radius={2}
                    padding={2}
                    onClick={() => props.onFieldGroupSelect(s.group)}
                    style={{ textAlign: "left", cursor: "pointer", width: "100%", border: `1px solid ${active === s.group ? "#D4552B" : "transparent"}` }}
                  >
                    <Help s={s} />
                  </Card>
                ))}
              </div>
            </Stack>
          ) : null}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
