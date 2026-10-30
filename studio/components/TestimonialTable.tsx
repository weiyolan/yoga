import { DownloadIcon } from "@sanity/icons/Download";
import { Badge, Box, Button, Card, Checkbox, Flex, Select, Stack, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { useIntentLink } from "sanity/router";
import { apiVersion } from "../../sanity/site.config";
import { REVIEW_STATUSES } from "../schemaTypes/documents/review";
import { stars, TESTIMONIAL_SOURCES } from "../schemaTypes/documents/testimonial";

type Testimonial = {
  _id: string;
  name?: string;
  rating?: number;
  quote?: string;
  showOnHome?: boolean;
  source?: string;
  lang?: string;
  date?: string;
  retreatId?: string;
  retreat?: string;
  context?: string;
};
type Submission = { _id: string; status?: string; name?: string; rating?: number; text?: string; lang?: string; submittedAt?: string; email?: string; retreatId?: string; retreat?: string };
type Retreat = { _id: string; title?: string; startDate?: string };

/** One row = a testimonial, or a submission that isn't one (yet): Nieuw / Geweigerd. Linked via the uuid. */
type Row = {
  key: string;
  testimonialId?: string;
  /** published + draft ids of the testimonial: “Op Home” is set on both, so publishing a draft doesn't undo it */
  ids: string[];
  submissionId?: string;
  home: boolean;
  name: string;
  rating?: number;
  text: string;
  retreatId?: string;
  context: string;
  source: string;
  status: string;
  lang: string;
  date: string;
  email: string;
};

const NL = (f: string) => `coalesce(${f}[language == "nl"][0].value, ${f}[0].value)`;
const QUERY = `{
  "testimonials": *[_type == "testimonial"] { _id, name, rating, "quote": ${NL("quote")}, showOnHome, source, lang, date, "retreatId": retreat._ref, "retreat": retreat->{ "t": ${NL("title")} + " " + string::split(startDate, "-")[0] }.t, "context": ${NL("context")} },
  "submissions": *[_type == "reviewSubmission"] { _id, status, name, rating, text, lang, submittedAt, email, "retreatId": retreat._ref, "retreat": retreat->{ "t": ${NL("title")} + " " + string::split(startDate, "-")[0] }.t },
  "retreats": *[_type == "retreat" && !(_id in path("drafts.**"))] | order(startDate desc) { _id, "title": ${NL("title")}, startDate }
}`;

const uuid = (id: string) => id.replace(/^drafts\./, "").replace(/^(testimonial-|reviewSubmission\.)/, "");
const statusTitle = (s?: string) => REVIEW_STATUSES.find((x) => x.value === (s ?? "new"))?.title ?? "Nieuw";
const sourceTitle = (s?: string) => TESTIMONIAL_SOURCES.find((x) => x.value === s)?.title ?? "Zelf toegevoegd";
const TONE: Record<string, "primary" | "positive" | "critical" | "default"> = { Nieuw: "primary", Gepubliceerd: "positive", Online: "positive", Geweigerd: "critical" };

function rows(data: { testimonials: Testimonial[]; submissions: Submission[] }): Row[] {
  const subs = new Map(data.submissions.map((s) => [uuid(s._id), s]));
  // a draft and its published version are one testimonial (the published values win, the draft only if it's new)
  const groups = new Map<string, Testimonial[]>();
  for (const t of data.testimonials) {
    const id = t._id.replace(/^drafts\./, "");
    groups.set(id, [...(groups.get(id) ?? []), t]);
  }
  const out: Row[] = [];
  const linked = new Set<string>();
  for (const [id, versions] of groups) {
    const t = versions.find((v) => !v._id.startsWith("drafts.")) ?? versions[0];
    const sub = id.startsWith("testimonial-") ? subs.get(uuid(id)) : undefined;
    if (sub) linked.add(sub._id);
    out.push({
      key: id,
      testimonialId: id,
      ids: versions.map((v) => v._id),
      submissionId: sub?._id,
      home: !!t.showOnHome,
      name: t.name ?? "",
      rating: t.rating,
      text: t.quote ?? "",
      retreatId: t.retreatId,
      context: t.context || t.retreat || "",
      source: t.source ?? (sub ? "form" : "manual"),
      status: sub ? statusTitle(sub.status) : versions.some((v) => !v._id.startsWith("drafts.")) ? "Online" : "Concept",
      lang: t.lang ?? "",
      date: (t.date ?? sub?.submittedAt ?? "").slice(0, 10),
      email: sub?.email ?? "",
    });
  }
  for (const s of data.submissions)
    if (!linked.has(s._id))
      out.push({
        key: s._id,
        ids: [],
        submissionId: s._id,
        home: false,
        name: s.name ?? "",
        rating: s.rating,
        text: s.text ?? "",
        retreatId: s.retreatId,
        context: s.retreat ?? "",
        source: "form",
        status: statusTitle(s.status),
        lang: s.lang ?? "",
        date: (s.submittedAt ?? "").slice(0, 10),
        email: s.email ?? "",
      });
  return out;
}

type Col = { id: string; title: string; width?: number; get: (r: Row) => string };
const COLS: Col[] = [
  { id: "home", title: "Op Home", width: 70, get: (r) => (r.home ? "ja" : "") },
  { id: "name", title: "Naam", width: 140, get: (r) => r.name },
  { id: "rating", title: "Score", width: 90, get: (r) => (r.rating ? String(r.rating) : "") },
  { id: "text", title: "Tekst", width: 340, get: (r) => r.text },
  { id: "context", title: "Retreat / context", width: 150, get: (r) => r.context },
  { id: "source", title: "Bron", width: 120, get: (r) => sourceTitle(r.source) },
  { id: "status", title: "Status", width: 110, get: (r) => r.status },
  { id: "lang", title: "Taal", width: 50, get: (r) => r.lang.toUpperCase() },
  { id: "date", title: "Datum", width: 100, get: (r) => r.date },
  { id: "email", title: "E-mail", width: 200, get: (r) => r.email },
];

function csv(list: Row[]) {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  return [COLS.map((c) => c.title), ...list.map((r) => COLS.map((c) => c.get(r)))].map((line) => line.map(esc).join(";")).join("\r\n");
}

const cell = { padding: "8px 10px", borderBottom: "1px solid var(--card-border-color)", verticalAlign: "top", fontSize: 13, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis" } as const;

function TableRow({ row, onHome }: { row: Row; onHome: (r: Row, on: boolean) => void }) {
  const { onClick, href } = useIntentLink({
    intent: "edit",
    params: row.testimonialId ? { id: row.testimonialId, type: "testimonial" } : { id: row.submissionId ?? "", type: "reviewSubmission" },
  });
  return (
    <tr onClick={onClick} style={{ cursor: "pointer" }} title={row.testimonialId ? "Open testimonial" : "Open inzending"}>
      {COLS.map((c) => (
        <td key={c.id} style={{ ...cell, maxWidth: c.width, minWidth: c.width, ...(c.id === "home" ? { textAlign: "center", background: "var(--card-muted-bg-color)" } : {}) }}>
          {c.id === "home" ? (
            <span onClick={(e) => e.stopPropagation()} title={row.testimonialId ? "Op Home aan/uit" : "Eerst publiceren (open de inzending → Gepubliceerd)"}>
              <Checkbox checked={row.home} disabled={!row.testimonialId} onChange={(e) => onHome(row, e.currentTarget.checked)} />
            </span>
          ) : c.id === "name" ? (
            <a href={href} onClick={(e) => e.preventDefault()} style={{ color: "inherit", fontWeight: 600 }}>
              {row.name || "—"}
            </a>
          ) : c.id === "rating" ? (
            <span style={{ color: "#D4552B", letterSpacing: 1 }}>{stars(row.rating) || <span style={{ opacity: 0.4 }}>-</span>}</span>
          ) : c.id === "status" ? (
            <Badge tone={TONE[row.status] ?? "default"}>{row.status}</Badge>
          ) : c.id === "text" ? (
            <span style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{row.text}</span>
          ) : (
            c.get(row)
          )}
        </td>
      ))}
    </tr>
  );
}

/** Studio → Contact → Testimonials → Tabel: every testimonial and form submission as a row, “Op Home” in the first column (works at once). */
export function TestimonialTable() {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const [data, setData] = useState<{ testimonials: Testimonial[]; submissions: Submission[]; retreats: Retreat[] } | null>(null);
  const [error, setError] = useState("");
  const [retreat, setRetreat] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [homeOnly, setHomeOnly] = useState(false);
  const [sort, setSort] = useState<{ key: string; desc: boolean }>({ key: "date", desc: true });

  useEffect(() => {
    let alive = true;
    const load = () => client.fetch(QUERY, {}, { perspective: "raw" }).then((d) => alive && setData(d), (e: Error) => alive && setError(e.message));
    load();
    const sub = client.listen(`*[_type in ["testimonial", "reviewSubmission"]]`, {}, { events: ["mutation"], includeResult: false, visibility: "query" }).subscribe(() => load());
    return () => {
      alive = false;
      sub.unsubscribe();
    };
  }, [client]);

  const all = useMemo(() => (data ? rows(data) : []), [data]);
  const list = useMemo(() => {
    const col = COLS.find((c) => c.id === sort.key) ?? COLS[0];
    const dir = sort.desc ? -1 : 1;
    return all
      .filter((r) => (!retreat || r.retreatId === retreat) && (!source || r.source === source) && (!status || r.status === status) && (!homeOnly || r.home))
      .sort((a, b) => dir * col.get(a).localeCompare(col.get(b), "nl", { numeric: true }));
  }, [all, retreat, source, status, homeOnly, sort]);

  const onHome = async (r: Row, on: boolean) => {
    // optimistic: the listener reloads right after
    setData((d) => d && { ...d, testimonials: d.testimonials.map((t) => (r.ids.includes(t._id) ? { ...t, showOnHome: on } : t)) });
    try {
      const tx = client.transaction();
      for (const id of r.ids) tx.patch(id, (p) => p.set({ showOnHome: on }));
      await tx.commit();
      toast.push({ status: "success", title: on ? `${r.name} staat op Home` : `${r.name} niet meer op Home` });
    } catch (e) {
      toast.push({ status: "error", title: "Opslaan mislukt", description: (e as Error).message });
    }
  };

  const download = () => {
    const blob = new Blob(["﻿" + csv(list)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "testimonials.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statuses = [...new Set(all.map((r) => r.status))];
  const filter = (label: string, value: string, set: (v: string) => void, options: { value: string; title: string }[], all: string, width = 170) => (
    <Box style={{ minWidth: width }}>
      <Stack gap={2}>
        <Text size={1} muted weight="medium">
          {label}
        </Text>
        <Select value={value} onChange={(e) => set(e.currentTarget.value)}>
          <option value="">{all}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.title}
            </option>
          ))}
        </Select>
      </Stack>
    </Box>
  );

  return (
    <Stack gap={4} padding={4}>
      <Flex gap={3} wrap="wrap" align="flex-end">
        {filter("Retreat", retreat, setRetreat, (data?.retreats ?? []).map((r) => ({ value: r._id, title: `${r.title ?? ""} ${r.startDate ? `(${r.startDate.slice(0, 4)})` : ""}` })), "Alle retreats", 240)}
        {filter("Bron", source, setSource, TESTIMONIAL_SOURCES, "Alle bronnen")}
        {filter("Status", status, setStatus, statuses.map((s) => ({ value: s, title: s })), "Alle statussen")}
        <Flex as="label" gap={2} align="center" style={{ paddingBottom: 8, cursor: "pointer" }}>
          <Checkbox checked={homeOnly} onChange={(e) => setHomeOnly(e.currentTarget.checked)} />
          <Text size={1}>Enkel op Home</Text>
        </Flex>
        <Button icon={DownloadIcon} text="Exporteer CSV" mode="ghost" onClick={download} disabled={!list.length} />
      </Flex>

      <Text size={1} muted>
        {list.length} testimonials · {list.filter((r) => r.home).length} op Home · {all.filter((r) => r.status === "Nieuw").length} nieuwe inzendingen. Vinkje “Op Home” werkt meteen (de site wordt opnieuw opgebouwd).
      </Text>

      <Card radius={2} border style={{ overflow: "auto", maxHeight: "calc(100vh - 260px)" }}>
        {data === null ? (
          <Box padding={4}>
            <Text muted>{error ? `Laden mislukt: ${error}` : "Laden…"}</Text>
          </Box>
        ) : list.length ? (
          <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th
                    key={c.id}
                    title={c.title}
                    onClick={() => setSort((s) => ({ key: c.id, desc: s.key === c.id ? !s.desc : false }))}
                    style={{ ...cell, position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg-color)", textAlign: c.id === "home" ? "center" : "left", fontWeight: 600, cursor: "pointer", maxWidth: c.width, minWidth: c.width, verticalAlign: "bottom" }}
                  >
                    {c.title} {sort.key === c.id ? (sort.desc ? "↓" : "↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <TableRow key={r.key} row={r} onHome={onHome} />
              ))}
            </tbody>
          </table>
        ) : (
          <Box padding={4}>
            <Text muted>Geen testimonials voor deze selectie.</Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}
