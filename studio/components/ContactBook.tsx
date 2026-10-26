import { CopyIcon } from "@sanity/icons/Copy";
import { DownloadIcon } from "@sanity/icons/Download";
import { SearchIcon } from "@sanity/icons/Search";
import { Badge, Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { useIntentLink } from "sanity/router";
import { contacts, CONTACTS_QUERY, SOURCE_TITLES, type Contact, type ContactSource, type ContactsData } from "../../lib/contacts";
import { apiVersion } from "../../sanity/site.config";

const TYPES: Record<ContactSource, string> = { signup: "signup", message: "message", subscriber: "subscriber", review: "reviewSubmission" };
const TONES: Record<ContactSource, "primary" | "positive" | "caution" | "default"> = { signup: "primary", subscriber: "positive", message: "caution", review: "default" };

const FILTERS: { id: string; title: string; test: (c: Contact) => boolean }[] = [
  { id: "all", title: "Alle", test: () => true },
  { id: "subscribed", title: "Nieuwsbrief", test: (c) => c.subscribed },
  { id: "signup", title: "Retreat-deelnemers", test: (c) => c.items.some((i) => i.type === "signup") },
  { id: "message", title: "Contactformulier", test: (c) => c.items.some((i) => i.type === "message") },
  { id: "review", title: "Reviews", test: (c) => c.items.some((i) => i.type === "review") },
  { id: "unsubscribed", title: "Afgemeld", test: (c) => c.unsubscribed },
];

/** Same id as the site (lib/unsubscribe.ts subscriberId): one subscriber document per address. */
async function subscriberId(email: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  return `subscriber.${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32)}`;
}

const date = (s?: string) => (s ? s.slice(0, 10) : "");
const cell = { padding: "8px 10px", borderBottom: "1px solid var(--card-border-color)", verticalAlign: "top", fontSize: 13, lineHeight: 1.4 } as const;

function csv(rows: Contact[]) {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const head = ["Naam", "E-mail", "GSM", "Taal", "Via", "Nieuwsbrief", "Eerste contact", "Laatste contact"];
  const body = rows.map((c) => [
    c.name ?? "",
    c.email,
    c.phone ?? "",
    c.lang,
    [...new Set(c.items.map((i) => SOURCE_TITLES[i.type]))].join(", "),
    c.unsubscribed ? "afgemeld" : c.subscribed ? "ja" : "",
    date(c.first),
    date(c.last),
  ]);
  return [head, ...body].map((l) => l.map(esc).join(";")).join("\r\n");
}

/** One document this address came from, clickable. */
function Item({ type, id, at, label }: Contact["items"][number]) {
  const { onClick, href } = useIntentLink({ intent: "edit", params: { id, type: TYPES[type] } });
  return (
    <a href={href} onClick={onClick} style={{ color: "inherit", display: "flex", gap: 8, alignItems: "center", textDecoration: "none", padding: "2px 0" }}>
      <Badge tone={TONES[type]} fontSize={0}>
        {SOURCE_TITLES[type]}
      </Badge>
      <span style={{ fontSize: 13 }}>{[label, date(at)].filter(Boolean).join(" · ")}</span>
      <span style={{ fontSize: 12, opacity: 0.6 }}>openen →</span>
    </a>
  );
}

/**
 * Binnengekomen → Contactboek: every address that came in through the site (lib/contacts.ts), one row
 * each, with where it came from. Search, filter, copy the addresses or export to CSV; sign someone on
 * or off for the newsletter by hand. Click a row for the documents behind it.
 */
export function ContactBook() {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [data, setData] = useState<ContactsData | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => client.fetch<ContactsData>(CONTACTS_QUERY, {}, { perspective: "raw" }).then((d) => alive && setData(d), (e: Error) => alive && setError(e.message));
    load();
    const sub = client.listen(`*[_type in ["signup", "message", "subscriber", "reviewSubmission"]]`, {}, { events: ["mutation"], includeResult: false, visibility: "query" }).subscribe(() => load());
    return () => {
      alive = false;
      sub.unsubscribe();
    };
  }, [client]);

  const all = useMemo(() => (data ? contacts(data) : []), [data]);
  const rows = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)!.test;
    const needle = q.trim().toLowerCase();
    return all.filter((c) => test(c) && (!needle || `${c.name ?? ""} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(needle)));
  }, [all, filter, q]);

  const copy = async () => {
    const list = rows.filter((c) => !c.unsubscribed).map((c) => c.email);
    await navigator.clipboard.writeText(list.join(", "));
    toast.push({ status: "success", title: `${list.length} adressen gekopieerd`, description: "Zonder wie zich afmeldde. Plak ze in BCC." });
  };
  const download = () => {
    const blob = new Blob(["﻿" + csv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contactboek-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const toggle = async (c: Contact) => {
    setBusy(c.email);
    try {
      const now = new Date().toISOString();
      if (c.subscribed) {
        await client.patch(c.subscriberId!).set({ unsubscribed: true, unsubscribedAt: now }).commit();
      } else {
        const id = c.subscriberId ?? (await subscriberId(c.email));
        await client
          .transaction()
          .createIfNotExists({ _id: id, _type: "subscriber", email: c.email, name: c.name, lang: c.lang, source: "studio", subscribedAt: now })
          .patch(id, (p) => p.set({ unsubscribed: false }).unset(["unsubscribedAt"]))
          .commit();
      }
    } catch (err) {
      toast.push({ status: "error", title: "Wijzigen mislukt", description: String(err instanceof Error ? err.message : err) });
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Card padding={4} tone="critical"><Text size={1}>Laden mislukt: {error}</Text></Card>;

  return (
    <Stack gap={4} padding={4}>
      <Flex gap={2} wrap="wrap">
        {FILTERS.map((f) => (
          <Button key={f.id} mode={filter === f.id ? "default" : "ghost"} tone={filter === f.id ? "primary" : "default"} fontSize={1} padding={2} text={`${f.title} (${all.filter(f.test).length})`} onClick={() => setFilter(f.id)} />
        ))}
      </Flex>
      <Flex gap={2} wrap="wrap" align="center">
        <Box flex={1} style={{ minWidth: 220 }}>
          <TextInput icon={SearchIcon} value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Zoek op naam, e-mail of GSM" fontSize={1} />
        </Box>
        <Button icon={CopyIcon} mode="ghost" fontSize={1} text="Kopieer e-mails" onClick={copy} disabled={!rows.length} />
        <Button icon={DownloadIcon} mode="ghost" fontSize={1} text="CSV" onClick={download} disabled={!rows.length} />
      </Flex>
      {!data ? (
        <Text size={1} muted>
          Laden…
        </Text>
      ) : (
        <Card border radius={2} overflow="auto">
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Naam", "E-mail", "GSM", "Taal", "Via", "Nieuwsbrief", "Laatst"].map((h) => (
                  <th key={h} style={{ ...cell, textAlign: "left", fontWeight: 600, position: "sticky", top: 0, background: "var(--card-bg-color)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <Fragment key={c.email}>
                  <tr onClick={() => setOpen(open === c.email ? null : c.email)} style={{ cursor: "pointer" }} title="Toon waar dit adres vandaan komt">
                    <td style={{ ...cell, fontWeight: 600, minWidth: 130 }}>{c.name || "—"}</td>
                    <td style={{ ...cell, overflowWrap: "anywhere", minWidth: 180 }}>{c.email}</td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{c.phone ?? ""}</td>
                    <td style={cell}>{c.lang.toUpperCase()}</td>
                    <td style={cell}>
                      <Flex gap={1} wrap="wrap">
                        {[...new Set(c.items.map((i) => i.type))].map((t) => (
                          <Badge key={t} tone={TONES[t]} fontSize={0}>
                            {SOURCE_TITLES[t]}
                            {c.items.filter((i) => i.type === t).length > 1 ? ` ×${c.items.filter((i) => i.type === t).length}` : ""}
                          </Badge>
                        ))}
                      </Flex>
                    </td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                      <Flex gap={2} align="center">
                        {c.subscribed ? <Badge tone="positive">Ja</Badge> : c.unsubscribed ? <Badge tone="critical">Afgemeld</Badge> : null}
                        <Button
                          mode="bleed"
                          fontSize={0}
                          padding={2}
                          text={busy === c.email ? "…" : c.subscribed ? "Afmelden" : "Inschrijven"}
                          disabled={busy === c.email}
                          title={c.subscribed ? "Krijgt geen nieuwsbrief meer" : c.unsubscribed ? "Enkel als ze dat zelf vroegen: ze meldden zich eerder af" : "Enkel met hun toestemming (GDPR)"}
                          onClick={() => toggle(c)}
                        />
                      </Flex>
                    </td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{date(c.last)}</td>
                  </tr>
                  {open === c.email ? (
                    <tr>
                      <td colSpan={7} style={{ ...cell, background: "var(--card-muted-bg-color, rgba(127,127,127,.06))" }}>
                        <Stack gap={1}>
                          {c.items.map((i) => (
                            <Item key={i.id} {...i} />
                          ))}
                        </Stack>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <Box padding={4}>
              <Text size={1} muted>
                Niemand gevonden.
              </Text>
            </Box>
          ) : null}
        </Card>
      )}
      <Text size={0} muted>
        {all.length} adressen, één rij per e-mailadres. Nieuwsbrieven gaan nooit naar wie zich afmeldde (Mails → Nieuwsbrieven).
      </Text>
    </Stack>
  );
}
