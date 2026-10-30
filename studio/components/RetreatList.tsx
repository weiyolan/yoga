import { AddIcon } from "@sanity/icons/Add";
import { EarthGlobeIcon } from "@sanity/icons/EarthGlobe";
import { StarFilledIcon } from "@sanity/icons/StarFilled";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { Preview, useClient, useSchema } from "sanity";
import { IntentLink } from "sanity/router";
import { usePaneRouter } from "sanity/structure";
import { apiVersion } from "../../sanity/site.config";

type Row = { _id: string; _type: string; startDate?: string; endDate?: string };
type Filter = "upcoming" | "past" | "all";
const FILTERS: { id: Filter; title: string }[] = [
  { id: "upcoming", title: "Komend" },
  { id: "past", title: "Voorbij" },
  { id: "all", title: "Alle" },
];

/** Same rule as the site: upcoming until the last day is over (a retreat without dates counts as upcoming). */
const upcoming = (r: Row) =>
  !r.endDate || r.endDate >= new Date().toISOString().slice(0, 10);
export const RETREATS_PAGE_ID = "retreatsPage";

// The featured retreat, same rule as the site (sanity/queries.ts → FEATURED_*): the one picked on
// Startpagina, else the first upcoming one with places left, else the first upcoming one.
const UPCOMING = `dateTime(endDate + "T23:59:59Z") >= dateTime(now())`;
const FULL = `coalesce(capacity > 0 && (coalesce(booked, 0) + coalesce(bookedExtra, 0)) >= capacity, false)`;
const QUERY = `{
  "rows": *[_type == "retreat"]{ _id, _type, startDate, endDate },
  "picked": *[_id == "homePage"][0].featuredRetreat._ref,
  "auto": coalesce(
    *[_type == "retreat" && ${UPCOMING} && !${FULL}] | order(startDate asc)[0]._id,
    *[_type == "retreat" && ${UPCOMING}] | order(startDate asc)[0]._id
  )
}`;

/**
 * Inhoud → Retreats: every retreat in one list, filtered by chips (Komend / Voorbij / Alle), with
 * the Retreats page (its texts) on top. One level less than separate lists. Drafts included; the
 * list follows edits live. Clicking opens the document to the right (structure: .child()).
 * The retreat featured on Home (and in the site's header) has a star.
 */
export function RetreatList() {
  const client = useClient({ apiVersion });
  const schema = useSchema();
  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [featured, setFeatured] = useState<{ id: string; picked: boolean } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const open = routerPanesState[groupIndex + 1]?.[0]?.id;

  useEffect(() => {
    const load = () =>
      client
        .fetch<{ rows: Row[]; picked: string | null; auto: string | null }>(QUERY, {}, { perspective: "drafts" })
        .then(({ rows, picked, auto }) => {
          setRows(rows);
          const id = picked ?? auto;
          setFeatured(id ? { id, picked: !!picked } : null);
        }, console.error);
    void load();
    let t: ReturnType<typeof setTimeout> | undefined;
    const sub = client
      .listen(`*[_type == "retreat" || _id in ["homePage", "drafts.homePage"]]`, {}, { visibility: "query", includeResult: false })
      .subscribe(() => {
        clearTimeout(t);
        t = setTimeout(load, 400);
      });
    return () => {
      clearTimeout(t);
      sub.unsubscribe();
    };
  }, [client]);

  const shown = (rows ?? [])
    .filter((r) => filter === "all" || (filter === "upcoming") === upcoming(r))
    .sort(
      (a, b) =>
        (filter === "upcoming" ? 1 : -1) *
        (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999"),
    );
  const type = schema.get("retreat")!;
  const count = (f: Filter) =>
    (rows ?? []).filter(
      (r) => f === "all" || (f === "upcoming") === upcoming(r),
    ).length;

  const row = (id: string, content: React.ReactNode) => (
    <ChildLink key={id} childId={id}>
      <Card
        radius={2}
        padding={1}
        selected={open === id}
        pressed={open === id}
        data-as="a"
      >
        {content}
      </Card>
    </ChildLink>
  );

  return (
    <Box padding={2} className="retreat-list">
      <style>{`.retreat-list a { display: block; color: inherit; text-decoration: none; }`}</style>
      <Stack gap={3}>
        {row(
          RETREATS_PAGE_ID,
          <Flex align="center" gap={3} padding={2}>
            <Text size={2}>
              <EarthGlobeIcon />
            </Text>
            <Stack gap={2}>
              <Text size={1} weight="medium">
                Retreats-pagina
              </Text>
              <Text size={1} muted>
                Kop, intro en teksten van /retreats
              </Text>
            </Stack>
          </Flex>,
        )}
        <Flex gap={1} align="center" paddingX={1}>
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              mode={filter === f.id ? "default" : "bleed"}
              tone={filter === f.id ? "primary" : "default"}
              padding={2}
              fontSize={1}
              text={`${f.title} (${count(f.id)})`}
              onClick={() => setFilter(f.id)}
            />
          ))}
          <Box flex={1} />
          <IntentLink
            intent="create"
            params={{ type: "retreat" }}
            title="Nieuwe retreat"
            style={{ color: "inherit" }}
          >
            <Button as="span" mode="ghost" tone="primary" icon={AddIcon} text="Nieuwe retreat" padding={2} fontSize={1} />
          </IntentLink>
        </Flex>
        {rows === null ? (
          <Box padding={2}>
            <Text size={1} muted>
              Laden…
            </Text>
          </Box>
        ) : !shown.length ? (
          <Box padding={2}>
            <Text size={1} muted>
              Geen retreats.
            </Text>
          </Box>
        ) : (
          <Stack gap={1}>
            {shown.map((r) =>
              row(
                r._id,
                <Flex align="center">
                  <Box flex={1}>
                    <Preview
                      schemaType={type}
                      value={{ _id: r._id, _type: "retreat" }}
                      layout="default"
                    />
                  </Box>
                  {featured?.id === r._id && (
                    <Box
                      paddingX={2}
                      title={
                        featured.picked
                          ? "Uitgelicht op Home en in het menu (Startpagina → Uitgelichte retreat)"
                          : "Uitgelicht op Home en in het menu (automatisch: eerstvolgende met plaats)"
                      }
                    >
                      <Text size={2} style={{ color: "#D4552B" }}>
                        <StarFilledIcon aria-label="Uitgelicht" />
                      </Text>
                    </Box>
                  )}
                </Flex>,
              ),
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
