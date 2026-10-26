import { Box, Button, Card, Flex, Select, Stack, Text } from "@sanity/ui";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Preview, useClient, useSchema } from "sanity";
import { usePaneRouter } from "sanity/structure";
import { apiVersion } from "../../sanity/site.config";

type Row = {
  _id: string;
  _type: string;
  status?: string;
  waitlist?: boolean;
  retreat?: string;
  submittedAt?: string;
};
export type StatusFilter = {
  id: string;
  title: string;
  match: (r: Row) => boolean;
};
export type TopRow = {
  id: string;
  title: string;
  subtitle: string;
  icon: ComponentType;
};

/**
 * Contact → Inschrijvingen / Contactformulier: every submission in one list, filtered by status chips
 * (with counts; “Nieuw” first), optionally per retreat, newest first. One level less than separate
 * lists, like Inhoud → Retreats. Follows new submissions live; clicking opens it to the right.
 */
export function statusList({
  type,
  filters,
  top = [],
  perRetreat = false,
}: {
  type: string;
  filters: StatusFilter[];
  top?: TopRow[];
  perRetreat?: boolean;
}) {
  function StatusList() {
    const client = useClient({ apiVersion });
    const schema = useSchema();
    const { ChildLink, routerPanesState, groupIndex } = usePaneRouter();
    const [rows, setRows] = useState<Row[] | null>(null);
    const [retreats, setRetreats] = useState<
      { _id: string; title?: string; startDate?: string }[]
    >([]);
    const [filter, setFilter] = useState(filters[0].id);
    const [retreat, setRetreat] = useState("");
    const open = routerPanesState[groupIndex + 1]?.[0]?.id;

    useEffect(() => {
      const query = `*[_type == $type]{ _id, _type, status, waitlist, "retreat": retreat._ref, submittedAt }`;
      const load = () =>
        client
          .fetch<Row[]>(query, { type }, { perspective: "raw" })
          .then(setRows, console.error);
      void load();
      let t: ReturnType<typeof setTimeout> | undefined;
      const sub = client
        .listen(
          `*[_type == $type]`,
          { type },
          { visibility: "query", includeResult: false },
        )
        .subscribe(() => {
          clearTimeout(t);
          t = setTimeout(load, 400);
        });
      if (perRetreat)
        client
          .fetch(
            `*[_type == "retreat" && !(_id in path("drafts.**"))] | order(startDate desc){ _id, "title": title[language == "nl"][0].value, startDate }`,
          )
          .then(setRetreats, console.error);
      return () => {
        clearTimeout(t);
        sub.unsubscribe();
      };
    }, [client]);

    const inRetreat = (rows ?? []).filter(
      (r) => !retreat || r.retreat === retreat,
    );
    const f = filters.find((x) => x.id === filter) ?? filters[0];
    const shown = inRetreat
      .filter(f.match)
      .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
    const schemaType = schema.get(type)!;

    const link = (id: string, content: ReactNode) => (
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
      <Box padding={2} className="status-list">
        <style>{`.status-list a { display: block; color: inherit; text-decoration: none; }`}</style>
        <Stack gap={3}>
          {top.map((r) =>
            link(
              r.id,
              <Flex align="center" gap={3} padding={2}>
                <Text size={2}>
                  <r.icon />
                </Text>
                <Stack gap={2}>
                  <Text size={1} weight="medium">
                    {r.title}
                  </Text>
                  <Text size={1} muted>
                    {r.subtitle}
                  </Text>
                </Stack>
              </Flex>,
            ),
          )}
          <Flex gap={1} align="center" paddingX={1} wrap="wrap">
            {filters.map((x) => {
              const n = inRetreat.filter(x.match).length;
              return (
                <Button
                  key={x.id}
                  mode={filter === x.id ? "default" : "bleed"}
                  tone={filter === x.id ? "primary" : "default"}
                  padding={2}
                  fontSize={1}
                  text={`${x.title} (${n})`}
                  onClick={() => setFilter(x.id)}
                />
              );
            })}
          </Flex>
          {perRetreat && retreats.length ? (
            <Box paddingX={1}>
              <Select
                fontSize={1}
                padding={2}
                value={retreat}
                onChange={(e) => setRetreat(e.currentTarget.value)}
              >
                <option value="">Alle retreats</option>
                {retreats.map((r) => (
                  <option key={r._id} value={r._id}>
                    {[r.title ?? "Retreat", r.startDate?.slice(0, 7)]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </Select>
            </Box>
          ) : null}
          {rows === null ? (
            <Box padding={2}>
              <Text size={1} muted>
                Laden…
              </Text>
            </Box>
          ) : !shown.length ? (
            <Box padding={2}>
              <Text size={1} muted>
                Niets hier.
              </Text>
            </Box>
          ) : (
            <Stack gap={1}>
              {shown.map((r) =>
                link(
                  r._id,
                  <Preview
                    schemaType={schemaType}
                    value={{ _id: r._id, _type: type }}
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
  StatusList.displayName = `StatusList(${type})`;
  return StatusList;
}
