import { DownloadIcon } from "@sanity/icons/Download";
import { Badge, Box, Button, Card, Flex, Select, Stack, Text } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { useIntentLink } from "sanity/router";
import { apiVersion } from "../../sanity/site.config";
import { SIGNUP_STATUSES } from "../schemaTypes/documents/signup";
import { STATUS_TONE } from "./SignupView";

type Row = {
  _id: string;
  status?: string;
  submittedAt?: string;
  name?: string;
  email?: string;
  phone?: string;
  persons?: number;
  room?: string;
  answers?: { question?: string; answer?: string }[];
  diet?: string;
  message?: string;
  lang?: string;
  notes?: string;
  retreatId?: string;
  retreat?: string;
};
type Retreat = { _id: string; title?: string; startDate?: string; capacity?: number; booked?: number };

const NL = `coalesce(title[language == "nl"][0].value, title[0].value)`;
const QUERY = `{
  "signups": *[_type == "signup"] | order(submittedAt desc) { _id, status, submittedAt, name, email, phone, persons, room, answers, diet, message, lang, notes, "retreatId": retreat._ref, "retreat": retreat->{ "t": ${NL} }.t },
  "retreats": *[_type == "retreat" && !(_id in path("drafts.**"))] | order(startDate desc) { _id, "title": ${NL}, startDate, capacity, booked }
}`;

type Col = { id: string; title: string; width?: number; get: (r: Row) => string };

const statusTitle = (s?: string) => SIGNUP_STATUSES.find((x) => x.value === s)?.title ?? "Nieuw";
const field = (key: keyof Row, title: string, width?: number): Col => ({ id: key, title, width, get: (r) => String(r[key] ?? "") });
/** “Mijn ervaring met yoga …:” → the same label without the trailing colon (one column per question). */
const label = (q?: string) => (q ?? "").trim().replace(/[:：]+$/, "");

const BEFORE: Col[] = [
  { id: "submittedAt", title: "Datum", width: 110, get: (r) => (r.submittedAt ?? "").slice(0, 10) },
  { id: "status", title: "Status", width: 110, get: (r) => statusTitle(r.status) },
  field("retreat", "Retreat", 160),
  field("name", "Naam", 150),
  field("email", "E-mail", 200),
  field("phone", "GSM", 130),
  field("room", "Kamer / prijs", 160),
];
const AFTER: Col[] = [
  field("diet", "Dieet / allergieën", 200),
  field("message", "Vragen / opmerkingen", 260),
  field("lang", "Taal", 60),
  field("notes", "Interne notitie", 200),
];

/** The columns for these rows: the fixed ones, with one column per extra question (in the order of the form) in between. */
function columns(rows: Row[]): Col[] {
  const questions: string[] = [];
  // oldest first, so the form's order wins over later edits
  for (const r of [...rows].reverse()) for (const a of r.answers ?? []) if (label(a.question) && !questions.includes(label(a.question))) questions.push(label(a.question));
  return [
    ...BEFORE,
    ...questions.map((q) => ({ id: `q:${q}`, title: q, width: 200, get: (r: Row) => r.answers?.find((a) => label(a.question) === q)?.answer ?? "" })),
    ...AFTER,
  ];
}

function csv(rows: Row[], cols: Col[]) {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  return [cols.map((c) => c.title), ...rows.map((r) => cols.map((c) => c.get(r)))].map((line) => line.map(esc).join(";")).join("\r\n");
}

function TableRow({ row, cols }: { row: Row; cols: Col[] }) {
  const { onClick, href } = useIntentLink({ intent: "edit", params: { id: row._id, type: "signup" } });
  return (
    <tr onClick={onClick} style={{ cursor: "pointer" }} title="Open inschrijving">
      {cols.map((c) => (
        <td key={c.id} style={{ ...cell, maxWidth: c.width, minWidth: c.width }}>
          {c.id === "status" ? (
            <Badge tone={STATUS_TONE[row.status ?? "new"]}>{statusTitle(row.status)}</Badge>
          ) : c.id === "name" ? (
            <a href={href} onClick={(e) => e.preventDefault()} style={{ color: "inherit", fontWeight: 600 }}>
              {row.name}
            </a>
          ) : (
            c.get(row) || (c.id.startsWith("q:") ? <span style={{ opacity: 0.4 }}>-</span> : "")
          )}
        </td>
      ))}
    </tr>
  );
}

const cell = { padding: "8px 10px", borderBottom: "1px solid var(--card-border-color)", verticalAlign: "top", fontSize: 13, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis" } as const;

/** Studio → Inschrijvingen → Tabel: every sign-up as a row, filterable per retreat and status, exportable to CSV. */
export function SignupTable() {
  const client = useClient({ apiVersion });
  const [data, setData] = useState<{ signups: Row[]; retreats: Retreat[] } | null>(null);
  const [error, setError] = useState("");
  const [retreat, setRetreat] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ key: string; desc: boolean }>({ key: "submittedAt", desc: true });

  useEffect(() => {
    let alive = true;
    const load = () => client.fetch(QUERY, {}, { perspective: "raw" }).then((d) => alive && setData(d), (e: Error) => alive && setError(e.message));
    load();
    const sub = client.listen(`*[_type in ["signup", "retreat"]]`, {}, { events: ["mutation"], includeResult: false, visibility: "query" }).subscribe(() => load());
    return () => {
      alive = false;
      sub.unsubscribe();
    };
  }, [client]);

  const list = useMemo(
    () => (data?.signups ?? []).filter((r) => (!retreat || r.retreatId === retreat) && (!status || (r.status ?? "new") === status)),
    [data, retreat, status],
  );
  const cols = useMemo(() => columns(list), [list]);
  const rows = useMemo(() => {
    const col = cols.find((c) => c.id === sort.key) ?? cols[0];
    const dir = sort.desc ? -1 : 1;
    return [...list].sort((a, b) => dir * col.get(a).localeCompare(col.get(b), "nl", { numeric: true }));
  }, [list, cols, sort]);

  const chosen = data?.retreats.find((r) => r._id === retreat);
  // new sign-ups are one person; old ones can have `persons`
  const people = (r: Row) => r.persons ?? 1;
  const confirmed = rows.filter((r) => r.status === "confirmed").reduce((n, r) => n + people(r), 0);
  const total = rows.reduce((n, r) => n + people(r), 0);

  const download = () => {
    const blob = new Blob(["﻿" + csv(rows, cols)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inschrijvingen${chosen?.title ? `-${chosen.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Stack gap={4} padding={4}>
      <Flex gap={3} wrap="wrap" align="flex-end">
        <Box style={{ minWidth: 240 }}>
          <Stack gap={2}>
            <Text size={1} muted weight="medium">
              Retreat
            </Text>
            <Select value={retreat} onChange={(e) => setRetreat(e.currentTarget.value)}>
              <option value="">Alle retreats</option>
              {data?.retreats.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title} {r.startDate ? `(${r.startDate.slice(0, 4)})` : ""}
                </option>
              ))}
            </Select>
          </Stack>
        </Box>
        <Box style={{ minWidth: 170 }}>
          <Stack gap={2}>
            <Text size={1} muted weight="medium">
              Status
            </Text>
            <Select value={status} onChange={(e) => setStatus(e.currentTarget.value)}>
              <option value="">Alle statussen</option>
              {SIGNUP_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.title}
                </option>
              ))}
            </Select>
          </Stack>
        </Box>
        <Button icon={DownloadIcon} text="Exporteer CSV" mode="ghost" onClick={download} disabled={!rows.length} />
      </Flex>

      <Text size={1} muted>
        {rows.length} inschrijvingen · {total} personen · {confirmed} bevestigd
        {chosen?.capacity ? ` · geboekt ${chosen.booked ?? 0} / ${chosen.capacity}` : ""}
      </Text>

      <Card radius={2} border style={{ overflow: "auto", maxHeight: "calc(100vh - 260px)" }}>
        {data === null ? (
          <Box padding={4}>
            <Text muted>{error ? `Laden mislukt: ${error}` : "Laden…"}</Text>
          </Box>
        ) : rows.length ? (
          <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr>
                {cols.map((c) => (
                  <th
                    key={c.id}
                    title={c.title}
                    onClick={() => setSort((s) => ({ key: c.id, desc: s.key === c.id ? !s.desc : false }))}
                    style={{ ...cell, position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg-color)", textAlign: "left", fontWeight: 600, cursor: "pointer", maxWidth: c.width, minWidth: c.width, verticalAlign: "bottom" }}
                  >
                    {c.title} {sort.key === c.id ? (sort.desc ? "↓" : "↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <TableRow key={r._id} row={r} cols={cols} />
              ))}
            </tbody>
          </table>
        ) : (
          <Box padding={4}>
            <Text muted>Geen inschrijvingen voor deze selectie.</Text>
          </Box>
        )}
      </Card>
    </Stack>
  );
}
