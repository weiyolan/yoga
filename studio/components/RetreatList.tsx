import { AddIcon } from "@sanity/icons/Add";
import { EarthGlobeIcon } from "@sanity/icons/EarthGlobe";
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

/**
 * Inhoud → Retreats: every retreat in one list, filtered by chips (Komend / Voorbij / Alle), with
 * the Retreats page (its texts) on top. One level less than separate lists. Drafts included; the
 * list follows edits live. Clicking opens the document to the right (structure: .child()).
 */
export function RetreatList() {
  const client = useClient({ apiVersion });
  const schema = useSchema();
  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const open = routerPanesState[groupIndex + 1]?.[0]?.id;

  useEffect(() => {
    const query = `*[_type == "retreat"]{ _id, _type, startDate, endDate }`;
    const load = () =>
      client
        .fetch<Row[]>(query, {}, { perspective: "drafts" })
        .then(setRows, console.error);
    void load();
    let t: ReturnType<typeof setTimeout> | undefined;
    const sub = client
      .listen(query, {}, { visibility: "query", includeResult: false })
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
                <Preview
                  schemaType={type}
                  value={{ _id: r._id, _type: "retreat" }}
                  layout="default"
                />,
              ),
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
