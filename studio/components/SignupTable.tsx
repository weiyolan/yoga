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
  "signups": *[_type == "signup"] | order(submittedAt desc) { _id, status, submittedAt, name, email, phone, persons, room, diet, message, lang, notes, "retreatId": retreat._ref, "retreat": retreat->{ "t": ${NL} }.t },
  "retreats": *[_type == "retreat" && !(_id in path("drafts.**"))] | order(startDate desc) { _id, "title": ${NL}, startDate, capacity, booked }
}`;

const COLUMNS: { key: keyof Row; title: string; width?: number }[] = [
  { key: "submittedAt", title: "Datum", width: 110 },
  { key: "status", title: "Status", width: 110 },
  { key: "retreat", title: "Retreat", width: 160 },
  { key: "name", title: "Naam", width: 150 },
  { key: "email", title: "E-mail", width: 200 },
  { key: "phone", title: "GSM", width: 130 },
  { key: "persons", title: "Pers.", width: 60 },
  { key: "room", title: "Kamer / prijs", width: 160 },
  { key: "diet", title: "Dieet / allergieën", width: 200 },
  { key: "message", title: "Vragen / opmerkingen", width: 260 },
  { key: "lang", title: "Taal", width: 60 },
  { key: "notes", title: "Interne notitie", width: 200 },
];
const statusTitle = (s?: string) => SIGNUP_STATUSES.find((x) => x.value === s)?.title ?? "Nieuw";
const text = (r: Row, key: keyof Row) => (key === "status" ? statusTitle(r.status) : key === "submittedAt" ? (r.submittedAt ?? "").slice(0, 10) : String(r[key] ?? ""));

function csv(rows: Row[]) {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  return [COLUMNS.map((c) => c.title), ...rows.map((r) => COLUMNS.map((c) => text(r, c.key)))].map((line) => line.map(esc).join(";")).join("\r\n");
}

function TableRow({ row }: { row: Row }) {
  const { onClick, href } = useIntentLink({ intent: "edit", params: { id: row._id, type: "signup" } });
  return (
    <tr onClick={onClick} style={{ cursor: "pointer" }} title="Open inschrijving">
      {COLUMNS.map((c) => (
        <td key={c.key} style={{ ...cell, maxWidth: c.width, minWidth: c.width }}>
          {c.key === "status" ? (
            <Badge tone={STATUS_TONE[row.status ?? "new"]}>{statusTitle(row.status)}</Badge>
          ) : c.key === "name" ? (
            <a href={href} onClick={(e) => e.preventDefault()} style={{ color: "inherit", fontWeight: 600 }}>
              {row.name}
            </a>
          ) : (
            text(row, c.key)
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
  const [sort, setSort] = useState<{ key: keyof Row; desc: boolean }>({ key: "submittedAt", desc: true });

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

  const rows = useMemo(() => {
    const list = (data?.signups ?? []).filter((r) => (!retreat || r.retreatId === retreat) && (!status || (r.status ?? "new") === status));
    const dir = sort.desc ? -1 : 1;
    return [...list].sort((a, b) => dir * text(a, sort.key).localeCompare(text(b, sort.key), "nl", { numeric: true }));
  }, [data, retreat, status, sort]);

  const chosen = data?.retreats.find((r) => r._id === retreat);
  const confirmed = rows.filter((r) => r.status === "confirmed").reduce((n, r) => n + (r.persons ?? 1), 0);
  const total = rows.reduce((n, r) => n + (r.persons ?? 1), 0);

  const download = () => {
    const blob = new Blob(["﻿" + csv(rows)], { type: "text/csv;charset=utf-8" });
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
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : false }))}
                    style={{ ...cell, position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg-color)", textAlign: "left", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {c.title} {sort.key === c.key ? (sort.desc ? "↓" : "↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <TableRow key={r._id} row={r} />
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
