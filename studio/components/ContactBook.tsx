import { CopyIcon } from "@sanity/icons/Copy";
import { DownloadIcon } from "@sanity/icons/Download";
import { AddIcon } from "@sanity/icons/Add";
import { SearchIcon } from "@sanity/icons/Search";
import { UploadIcon } from "@sanity/icons/Upload";
import { Badge, Box, Button, Card, Checkbox, Dialog, Flex, Radio, Stack, Text, TextInput } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { useIntentLink } from "sanity/router";
import { contacts, CONTACTS_QUERY, SOURCE_TITLES, type Contact, type ContactSource, type ContactsData } from "../../lib/contacts";
import { apiVersion } from "../../sanity/site.config";

const TYPES: Record<ContactSource, string> = { signup: "signup", message: "message", subscriber: "subscriber", review: "reviewSubmission", contact: "contact" };
const TONES: Record<ContactSource, "primary" | "positive" | "caution" | "default"> = { signup: "primary", subscriber: "positive", message: "caution", review: "default", contact: "default" };

const FILTERS: { id: string; title: string; test: (c: Contact) => boolean }[] = [
  { id: "all", title: "Alle", test: () => true },
  { id: "subscribed", title: "Nieuwsbrief", test: (c) => c.subscribed },
  { id: "signup", title: "Retreat-deelnemers", test: (c) => c.items.some((i) => i.type === "signup") },
  { id: "message", title: "Contactformulier", test: (c) => c.items.some((i) => i.type === "message") },
  { id: "review", title: "Testimonials", test: (c) => c.items.some((i) => i.type === "review") },
  { id: "unsubscribed", title: "Afgemeld", test: (c) => c.unsubscribed },
];

/** Same hash as the site (lib/unsubscribe.ts subscriberId): one subscriber / contact document per address. */
async function hashId(prefix: "subscriber" | "contact", email: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase()));
  return `${prefix}.${[...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32)}`;
}
const subscriberId = (email: string) => hashId("subscriber", email);

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** A contact to add: by hand or one CSV row. `newsletter`: true = sign on, false = signed off (“afgemeld” in an export), undefined = leave as is. */
type NewContact = { email: string; name?: string; phone?: string; lang: "nl" | "en"; newsletter?: boolean };

/** CSV (; or , separated, first row = column names; also our own export) → contacts. Column names in NL or EN. */
export function parseCsv(text: string): { rows: NewContact[]; skipped: number } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], skipped: 0 };
  const sep = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === sep) out.push(cur.trim()), (cur = "");
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const head = split(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const col = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const iEmail = col("email", "mail", "emailadres", "emailaddress");
  // no header row: the column with an @ is the e-mail
  const hasHead = iEmail >= 0;
  const data = (hasHead ? lines.slice(1) : lines).map(split);
  const e = hasHead ? iEmail : Math.max(0, data[0]?.findIndex((v) => v.includes("@")) ?? 0);
  const iName = hasHead ? col("naam", "name", "voornaam", "fullname") : -1;
  const iPhone = hasHead ? col("gsm", "telefoon", "phone", "tel", "mobile", "gsmnummer") : -1;
  const iLang = hasHead ? col("taal", "lang", "language") : -1;
  const iNews = hasHead ? col("nieuwsbrief", "newsletter") : -1;
  const seen = new Set<string>();
  let skipped = 0;
  const rows: NewContact[] = [];
  for (const r of data) {
    const email = r[e]?.trim().toLowerCase() ?? "";
    if (!EMAIL.test(email) || seen.has(email)) {
      skipped++;
      continue;
    }
    seen.add(email);
    const news = iNews >= 0 ? r[iNews]?.toLowerCase() : "";
    rows.push({
      email,
      name: (iName >= 0 && r[iName]) || undefined,
      phone: (iPhone >= 0 && r[iPhone]) || undefined,
      lang: iLang >= 0 && /^en/i.test(r[iLang] ?? "") ? "en" : "nl",
      newsletter: /^(ja|yes|j|y|1|true|x)$/.test(news ?? "") ? true : /afgemeld|unsubscribed|nee|no/.test(news ?? "") ? false : undefined,
    });
  }
  return { rows, skipped };
}

/** Add or update contacts (+ their subscriber documents). `subscribeAll`: sign everyone on (unless the row says afgemeld). */
async function saveContacts(client: ReturnType<typeof useClient>, list: NewContact[], source: "manual" | "csv", subscribeAll: boolean) {
  const now = new Date().toISOString();
  for (let i = 0; i < list.length; i += 100) {
    const tx = client.transaction();
    for (const c of list.slice(i, i + 100)) {
      const id = await hashId("contact", c.email);
      const fields = Object.fromEntries(Object.entries({ name: c.name, phone: c.phone, lang: c.lang }).filter(([, v]) => v));
      tx.createIfNotExists({ _id: id, _type: "contact", email: c.email, source, addedAt: now }).patch(id, (p) => p.set(fields));
      const news = c.newsletter === false ? false : subscribeAll || c.newsletter === true ? true : undefined;
      if (news !== undefined) {
        const sid = await subscriberId(c.email);
        tx.createIfNotExists({ _id: sid, _type: "subscriber", email: c.email, name: c.name, lang: c.lang, source: "studio", subscribedAt: now }).patch(sid, (p) =>
          news ? p.set({ unsubscribed: false }).unset(["unsubscribedAt"]) : p.set({ unsubscribed: true, unsubscribedAt: now }),
        );
      }
    }
    await tx.commit();
  }
}

const GDPR = "Enkel wie daar toestemming voor gaf (GDPR). Elke nieuwsbrief heeft een afmeldlink.";

/** “+ Toevoegen”: one contact by hand. */
function AddDialog({ onClose }: { onClose: () => void }) {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [c, setC] = useState<NewContact>({ email: "", lang: "nl" });
  const [news, setNews] = useState(true);
  const [busy, setBusy] = useState(false);
  const ok = EMAIL.test(c.email.trim());
  const save = async () => {
    setBusy(true);
    try {
      await saveContacts(client, [{ ...c, email: c.email.trim().toLowerCase(), name: c.name?.trim() || undefined, phone: c.phone?.trim() || undefined }], "manual", news);
      toast.push({ status: "success", title: "Contact toegevoegd", description: c.email });
      onClose();
    } catch (err) {
      toast.push({ status: "error", title: "Toevoegen mislukt", description: String(err instanceof Error ? err.message : err) });
      setBusy(false);
    }
  };
  const field = (label: string, input: React.ReactNode) => (
    <Stack gap={2}>
      <Text size={1} weight="medium">
        {label}
      </Text>
      {input}
    </Stack>
  );
  return (
    <Dialog id="contact-add" header="Contact toevoegen" onClose={onClose} width={1}>
      <Stack gap={4} padding={4}>
        {field("E-mail *", <TextInput type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.currentTarget.value })} autoFocus />)}
        {field("Naam", <TextInput value={c.name ?? ""} onChange={(e) => setC({ ...c, name: e.currentTarget.value })} />)}
        {field("GSM", <TextInput value={c.phone ?? ""} onChange={(e) => setC({ ...c, phone: e.currentTarget.value })} />)}
        {field(
          "Taal",
          <Flex gap={4}>
            {(["nl", "en"] as const).map((l) => (
              <Flex key={l} gap={2} align="center" as="label">
                <Radio checked={c.lang === l} onChange={() => setC({ ...c, lang: l })} />
                <Text size={1}>{l === "nl" ? "Nederlands" : "English"}</Text>
              </Flex>
            ))}
          </Flex>,
        )}
        <Flex gap={2} align="flex-start" as="label">
          <Checkbox checked={news} onChange={(e) => setNews(e.currentTarget.checked)} />
          <Stack gap={2}>
            <Text size={1}>Inschrijven voor de nieuwsbrief</Text>
            <Text size={0} muted>
              {GDPR}
            </Text>
          </Stack>
        </Flex>
        <Flex gap={2} justify="flex-end">
          <Button mode="ghost" text="Annuleren" onClick={onClose} />
          <Button tone="primary" text={busy ? "Opslaan…" : "Toevoegen"} disabled={!ok || busy} onClick={save} />
        </Flex>
      </Stack>
    </Dialog>
  );
}

/** “CSV importeren”: what's in the file, how many are new, then import. */
function ImportDialog({ file, known, onClose }: { file: { name: string; rows: NewContact[]; skipped: number }; known: Set<string>; onClose: () => void }) {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [news, setNews] = useState(false);
  const [busy, setBusy] = useState(false);
  const fresh = file.rows.filter((r) => !known.has(r.email)).length;
  const marked = file.rows.filter((r) => r.newsletter !== undefined).length;
  const go = async () => {
    setBusy(true);
    try {
      await saveContacts(client, file.rows, "csv", news);
      toast.push({ status: "success", title: `${file.rows.length} contacten geïmporteerd`, description: `${fresh} nieuw, ${file.rows.length - fresh} bijgewerkt` });
      onClose();
    } catch (err) {
      toast.push({ status: "error", title: "Importeren mislukt", description: String(err instanceof Error ? err.message : err) });
      setBusy(false);
    }
  };
  return (
    <Dialog id="contact-import" header={`Importeren: ${file.name}`} onClose={onClose} width={1}>
      <Stack gap={4} padding={4}>
        <Text size={2} weight="semibold">
          {file.rows.length} adressen ({fresh} nieuw, {file.rows.length - fresh} al in het contactboek)
        </Text>
        {file.skipped ? (
          <Text size={1} muted>
            {file.skipped} rijen overgeslagen (geen geldig e-mailadres of dubbel).
          </Text>
        ) : null}
        <Card padding={3} radius={2} border>
          <Stack gap={2}>
            {file.rows.slice(0, 5).map((r) => (
              <Text key={r.email} size={1}>
                {[r.name, r.email, r.phone, r.lang.toUpperCase(), r.newsletter === true ? "nieuwsbrief" : r.newsletter === false ? "afgemeld" : null].filter(Boolean).join(" · ")}
              </Text>
            ))}
            {file.rows.length > 5 ? (
              <Text size={1} muted>
                … en {file.rows.length - 5} meer
              </Text>
            ) : null}
          </Stack>
        </Card>
        <Flex gap={2} align="flex-start" as="label">
          <Checkbox checked={news} onChange={(e) => setNews(e.currentTarget.checked)} />
          <Stack gap={2}>
            <Text size={1}>Iedereen inschrijven voor de nieuwsbrief{marked ? " (behalve wie in het bestand “afgemeld” staat)" : ""}</Text>
            <Text size={0} muted>
              {GDPR}
              {marked ? ` Niet aangevinkt: enkel de kolom Nieuwsbrief uit het bestand telt (${marked} rijen met ja / afgemeld).` : ""}
            </Text>
          </Stack>
        </Flex>
        <Text size={0} muted>
          Bestaande contacten krijgen de naam, GSM en taal uit het bestand (lege velden blijven zoals ze waren).
        </Text>
        <Flex gap={2} justify="flex-end">
          <Button mode="ghost" text="Annuleren" onClick={onClose} />
          <Button tone="primary" text={busy ? "Importeren…" : `Importeer ${file.rows.length}`} disabled={!file.rows.length || busy} onClick={go} />
        </Flex>
      </Stack>
    </Dialog>
  );
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
 * Contact → Contactboek: every address that came in through the site (lib/contacts.ts), one row
 * each, with where it came from. Search, filter, copy the addresses or export to CSV; sign someone on
 * or off for the newsletter by hand. “Toevoegen” / “CSV importeren” add `contact` documents (+ subscriber
 * when asked). Click a row for the documents behind it.
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
  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<{ name: string; rows: NewContact[]; skipped: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const load = () => client.fetch<ContactsData>(CONTACTS_QUERY, {}, { perspective: "raw" }).then((d) => alive && setData(d), (e: Error) => alive && setError(e.message));
    load();
    const sub = client.listen(`*[_type in ["signup", "message", "subscriber", "reviewSubmission", "contact"]]`, {}, { events: ["mutation"], includeResult: false, visibility: "query" }).subscribe(() => load());
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
  const pick = async (f?: File) => {
    if (!f) return;
    const parsed = parseCsv(await f.text());
    if (input.current) input.current.value = "";
    if (!parsed.rows.length) return toast.push({ status: "warning", title: "Geen e-mailadressen gevonden", description: "Verwacht: een CSV met een kolom E-mail (en eventueel Naam, GSM, Taal, Nieuwsbrief)." });
    setFile({ name: f.name, ...parsed });
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
        <Button icon={AddIcon} tone="primary" fontSize={1} text="Toevoegen" onClick={() => setAdding(true)} />
        <Button icon={UploadIcon} mode="ghost" fontSize={1} text="CSV importeren" onClick={() => input.current?.click()} />
        <input ref={input} type="file" accept=".csv,text/csv,text/plain" hidden onChange={(e) => pick(e.currentTarget.files?.[0])} />
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
        {all.length} adressen, één rij per e-mailadres. Nieuwsbrieven gaan nooit naar wie zich afmeldde (Contact → Nieuwsbrieven). CSV importeren: een kolom E-mail, eventueel Naam, GSM, Taal, Nieuwsbrief (ja / afgemeld); ook de CSV van hier.
      </Text>
      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
      {file ? <ImportDialog file={file} known={new Set(all.map((c) => c.email))} onClose={() => setFile(null)} /> : null}
    </Stack>
  );
}
