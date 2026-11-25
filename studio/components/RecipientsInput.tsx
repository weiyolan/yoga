import { AddIcon } from "@sanity/icons/Add";
import { CloseIcon } from "@sanity/icons/Close";
import { SearchIcon } from "@sanity/icons/Search";
import { Badge, Box, Button, Card, Checkbox, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import { set, setIfMissing, useClient, useFormValue, type ObjectInputProps } from "sanity";
import { AUDIENCES, contacts, CONTACTS_QUERY, reasons, recipients, SIGNUP_STATUS_TITLES, type Contact, type ContactsData, type Recipients, type SignupStatus } from "../../lib/contacts";
import { apiVersion } from "../../sanity/site.config";

type Value = NonNullable<Recipients> & { retreats?: { _key?: string; _type?: string; _ref?: string }[] | null };
type Retreat = { _id: string; title?: string; startDate?: string; endDate?: string };

const STATUSES: SignupStatus[] = ["confirmed", "new", "waitlist", "cancelled"];
const key = () => Math.random().toString(36).slice(2, 14).padEnd(12, "0");
const year = (d?: string) => (d ? d.slice(0, 4) : "");
const today = new Date().toISOString().slice(0, 10);

/**
 * Brief → Naar wie: pick the recipients instead of ticking one fixed list. Groups (with live counts), the
 * participants of one or more retreats (by sign-up status), people added one by one from the contact book,
 * and below the resulting list with why each person gets it and a × to leave someone out.
 * Stored as `to` (lib/contacts.ts → recipients(), the same rule the site uses when sending).
 */
export function RecipientsInput(props: ObjectInputProps) {
  const { onChange, readOnly } = props;
  const value = (props.value ?? {}) as Value;
  const audience = useFormValue(["audience"]) as string[] | undefined;
  const client = useClient({ apiVersion });
  const [data, setData] = useState<ContactsData | null>(null);
  const [retreats, setRetreats] = useState<Retreat[]>([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [allRetreats, setAllRetreats] = useState(false);

  useEffect(() => {
    let alive = true;
    client.fetch<ContactsData>(CONTACTS_QUERY, {}, { perspective: "raw" }).then((d) => alive && setData(d), (e: Error) => alive && setError(e.message));
    client
      .fetch<Retreat[]>(`*[_type == "retreat" && !(_id in path("drafts.**"))] | order(startDate desc){ _id, "title": coalesce(title[language == "nl"][0].value, title[0].value), startDate, endDate }`)
      .then((r) => alive && setRetreats(r), () => {});
    return () => {
      alive = false;
    };
  }, [client]);

  const all = useMemo(() => (data ? contacts(data) : []), [data]);
  // an older letter without `to`: its groups (audience) until something is changed here
  const to: Value = props.value ? value : { groups: audience?.length ? audience : ["subscribers"], statuses: ["confirmed"] };
  const groups = new Set(to.groups ?? []);
  const picked = new Set((to.retreats ?? []).map((r) => r._ref));
  const statuses = new Set(to.statuses?.length ? to.statuses : ["confirmed"]);
  const include = new Set((to.include ?? []).map((e) => e.toLowerCase()));
  const exclude = new Set((to.exclude ?? []).map((e) => e.toLowerCase()));
  const list = useMemo(() => recipients(all, to), [all, JSON.stringify(to)]); // eslint-disable-line react-hooks/exhaustive-deps
  const byEmail = useMemo(() => new Map(all.map((c) => [c.email, c])), [all]);

  const save = (field: keyof Value, next: unknown) =>
    onChange([setIfMissing({}), ...(props.value ? [] : [set(to.groups ?? [], ["groups"]), set([...statuses], ["statuses"])]), set(next, [field])]);
  const toggleGroup = (g: string) => save("groups", groups.has(g) ? [...groups].filter((x) => x !== g) : [...groups, g]);
  const toggleRetreat = (id: string) =>
    save("retreats", picked.has(id) ? (to.retreats ?? []).filter((r) => r._ref !== id) : [...(to.retreats ?? []), { _key: key(), _type: "reference", _ref: id }]);
  const toggleStatus = (s: string) => {
    const next = statuses.has(s) ? [...statuses].filter((x) => x !== s) : [...statuses, s];
    save("statuses", next.length ? next : ["confirmed"]);
  };
  const add = (email: string) => {
    onChange([setIfMissing({}), set([...include, email], ["include"]), set([...exclude].filter((e) => e !== email), ["exclude"])]);
    setQ("");
  };
  const removeInclude = (email: string) => save("include", [...include].filter((e) => e !== email));
  const leaveOut = (email: string) => onChange([setIfMissing({}), set([...exclude, email], ["exclude"]), set([...include].filter((e) => e !== email), ["include"])]);
  const putBack = (email: string) => save("exclude", [...exclude].filter((e) => e !== email));

  // counts per group and per retreat (with the chosen statuses), without who unsubscribed
  const live = all.filter((c) => !c.unsubscribed);
  const groupCount = (g: string) => live.filter((c) => reasons(c, { groups: [g] }).length).length;
  const retreatCount = (id: string) => live.filter((c) => c.items.some((i) => i.type === "signup" && i.retreat === id && statuses.has(i.status ?? "new"))).length;
  const shownRetreats = allRetreats ? retreats : retreats.slice(0, 6).concat(retreats.slice(6).filter((r) => picked.has(r._id)));

  const needle = q.trim().toLowerCase();
  const matches = needle.length >= 2 ? all.filter((c) => !include.has(c.email) && `${c.name ?? ""} ${c.email}`.toLowerCase().includes(needle)).slice(0, 8) : [];
  const f = filter.trim().toLowerCase();
  const shown = list.filter((c) => !f || `${c.name ?? ""} ${c.email}`.toLowerCase().includes(f));
  const title = (id: string) => {
    const r = retreats.find((x) => x._id === id);
    return r ? `${r.title ?? "Retreat"} ${year(r.startDate)}` : "Retreat";
  };
  const why = (c: Contact) =>
    reasons(c, to).map((r) =>
      r === "include" ? "toegevoegd" : r === "subscribers" ? "abonnee" : r === "participants" ? "deelnemer" : r === "contacts" ? "contactboek" : title(r.slice(8)),
    );

  if (error) return <Text size={1}>Contactboek laden mislukt: {error}</Text>;

  return (
    <Stack gap={5}>
      {/* the result first: how many, per language */}
      <Card padding={3} radius={2} border tone={list.length ? "positive" : "caution"}>
        <Text size={2} weight="semibold">
          {data ? `${list.length} ontvanger${list.length === 1 ? "" : "s"} (${list.filter((c) => c.lang === "nl").length} NL, ${list.filter((c) => c.lang === "en").length} EN)` : "Contactboek laden…"}
        </Text>
      </Card>

      <Stack gap={3}>
        <Text size={1} weight="semibold">
          Groepen
        </Text>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
          {AUDIENCES.map((a) => {
            const on = groups.has(a.value);
            return (
              <Card key={a.value} as="label" padding={3} radius={2} border tone={on ? "primary" : "default"} style={{ cursor: readOnly ? "default" : "pointer" }}>
                <Flex gap={3} align="flex-start">
                  <Checkbox checked={on} disabled={readOnly} onChange={() => toggleGroup(a.value)} />
                  <Stack gap={2} flex={1}>
                    <Text size={1} weight="medium">
                      {a.title} {data ? <span style={{ opacity: 0.6 }}>· {groupCount(a.value)}</span> : null}
                    </Text>
                    <Text size={0} muted>
                      {a.description}
                    </Text>
                  </Stack>
                </Flex>
              </Card>
            );
          })}
        </div>
      </Stack>

      <Stack gap={3}>
        <Text size={1} weight="semibold">
          Deelnemers van een retreat
        </Text>
        <Text size={0} muted>
          Bv. een bedankje of de praktische info: enkel wie zich voor die retreat inschreef, met deze status:
        </Text>
        <Flex gap={2} wrap="wrap">
          {STATUSES.map((s) => (
            <Button key={s} mode={statuses.has(s) ? "default" : "ghost"} tone={statuses.has(s) ? "primary" : "default"} fontSize={1} padding={2} text={SIGNUP_STATUS_TITLES[s]} disabled={readOnly} onClick={() => toggleStatus(s)} />
          ))}
        </Flex>
        <Card border radius={2} overflow="hidden">
          {shownRetreats.map((r, i) => {
            const on = picked.has(r._id);
            return (
              <Card key={r._id} as="label" padding={3} borderTop={i > 0} tone={on ? "primary" : "default"} style={{ cursor: readOnly ? "default" : "pointer", display: "block" }}>
                <Flex gap={3} align="center">
                  <Checkbox checked={on} disabled={readOnly} onChange={() => toggleRetreat(r._id)} />
                  <Box flex={1}>
                    <Text size={1} weight={on ? "semibold" : "regular"}>
                      {r.title ?? "Retreat"} <span style={{ opacity: 0.6 }}>{year(r.startDate)}</span>
                    </Text>
                  </Box>
                  {r.endDate && r.endDate >= today ? <Badge tone="caution">komend</Badge> : null}
                  <Text size={1} muted>
                    {data ? `${retreatCount(r._id)} pers.` : ""}
                  </Text>
                </Flex>
              </Card>
            );
          })}
        </Card>
        {retreats.length > 6 ? (
          <Box>
            <Button mode="bleed" fontSize={1} padding={2} text={allRetreats ? "Minder retreats" : `Alle ${retreats.length} retreats`} onClick={() => setAllRetreats((a) => !a)} />
          </Box>
        ) : null}
      </Stack>

      <Stack gap={3}>
        <Text size={1} weight="semibold">
          Losse personen toevoegen
        </Text>
        <TextInput icon={SearchIcon} value={q} placeholder="Zoek op naam of e-mail in het contactboek…" disabled={readOnly} onChange={(e) => setQ(e.currentTarget.value)} />
        {matches.length ? (
          <Card border radius={2} overflow="hidden">
            {matches.map((c, i) => (
              <Card key={c.email} padding={2} borderTop={i > 0}>
                <Flex gap={3} align="center">
                  <Box flex={1}>
                    <Text size={1}>
                      {c.name ? <b>{c.name} </b> : null}
                      <span style={{ opacity: 0.7 }}>{c.email}</span>
                    </Text>
                  </Box>
                  {c.unsubscribed ? <Badge tone="critical">afgemeld</Badge> : <Button icon={AddIcon} mode="ghost" fontSize={1} padding={2} text="Toevoegen" onClick={() => add(c.email)} />}
                </Flex>
              </Card>
            ))}
          </Card>
        ) : needle.length >= 2 ? (
          <Text size={1} muted>
            Niemand gevonden. Iemand nieuw? Voeg hem eerst toe in Contact → Contactboek.
          </Text>
        ) : null}
        {include.size ? (
          <Flex gap={2} wrap="wrap">
            {[...include].map((e) => (
              <Button key={e} icon={CloseIcon} mode="ghost" fontSize={1} padding={2} text={byEmail.get(e)?.name ?? e} title={`${e}: niet meer toevoegen`} disabled={readOnly} onClick={() => removeInclude(e)} />
            ))}
          </Flex>
        ) : null}
      </Stack>

      <Stack gap={3}>
        <Flex gap={3} align="center">
          <Box flex={1}>
            <Text size={1} weight="semibold">
              Wie hem krijgt
            </Text>
          </Box>
          <Box style={{ width: 220 }}>
            <TextInput fontSize={1} padding={2} icon={SearchIcon} value={filter} placeholder="Filter…" onChange={(e) => setFilter(e.currentTarget.value)} />
          </Box>
        </Flex>
        <Card border radius={2} overflow="hidden">
          {(showAll ? shown : shown.slice(0, 12)).map((c, i) => (
            <Card key={c.email} padding={2} borderTop={i > 0}>
              <Flex gap={3} align="center">
                <Box flex={1}>
                  <Text size={1} textOverflow="ellipsis">
                    {c.name ? <b>{c.name} </b> : null}
                    <span style={{ opacity: 0.7 }}>{c.email}</span>
                  </Text>
                </Box>
                <Flex gap={1} wrap="wrap" justify="flex-end">
                  {why(c).map((w) => (
                    <Badge key={w} fontSize={0}>
                      {w}
                    </Badge>
                  ))}
                  <Badge fontSize={0} tone="default">
                    {c.lang.toUpperCase()}
                  </Badge>
                </Flex>
                <Button icon={CloseIcon} mode="bleed" fontSize={1} padding={2} title="Deze persoon niet mailen" disabled={readOnly} onClick={() => leaveOut(c.email)} />
              </Flex>
            </Card>
          ))}
          {!shown.length ? (
            <Box padding={3}>
              <Text size={1} muted>
                {data ? "Nog niemand: kies een groep, een retreat of voeg iemand toe." : "Laden…"}
              </Text>
            </Box>
          ) : null}
        </Card>
        {shown.length > 12 ? (
          <Box>
            <Button mode="bleed" fontSize={1} padding={2} text={showAll ? "Minder tonen" : `Alle ${shown.length} tonen`} onClick={() => setShowAll((s) => !s)} />
          </Box>
        ) : null}
        {exclude.size ? (
          <Stack gap={2}>
            <Text size={0} muted>
              Niet mailen ({exclude.size}), klik om terug te zetten:
            </Text>
            <Flex gap={2} wrap="wrap">
              {[...exclude].map((e) => (
                <Button key={e} mode="ghost" tone="critical" fontSize={1} padding={2} text={byEmail.get(e)?.name ?? e} title={e} disabled={readOnly} onClick={() => putBack(e)} />
              ))}
            </Flex>
          </Stack>
        ) : null}
        <Text size={0} muted>
          Wie zich afmeldde, krijgt nooit een brief. Elke brief heeft onderaan een afmeldlink.
        </Text>
      </Stack>
    </Stack>
  );
}
