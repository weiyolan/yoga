import { DownloadIcon } from "@sanity/icons/Download";
import { Badge, Box, Button, Card, Flex, Heading, Select, Stack, Text } from "@sanity/ui";
import { useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import type { UserViewComponent } from "sanity/structure";
import { PUBLISH_DEFAULT } from "../../lib/review-form";
import { apiVersion } from "../../sanity/site.config";

type I18n = { language?: string; value?: string }[];
type Q = { _key: string; type?: string; label?: I18n; options?: I18n; rows?: I18n; scaleMax?: number };
type A = { qKey?: string; type?: string; question?: string; row?: string; rowIndex?: number; answer?: string; value?: number };
type Sub = { _id: string; retreat?: string; retreatTitle?: string; year?: string; name?: string; submittedAt?: string; answers?: A[] };

const nl = (v?: I18n) => v?.find((x) => x.language === "nl")?.value?.trim() ?? v?.[0]?.value?.trim() ?? "";
const lines = (v?: I18n) => nl(v).split("\n").map((l) => l.trim()).filter(Boolean);
const TEXT = new Set(["text", "textarea", "quote", "name", "email"]);
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

/** A horizontal bar with a count, for one option. */
function Bar({ label, n, of, best }: { label: string; n: number; of: number; best?: boolean }) {
  return (
    <Flex gap={3} align="center">
      <Box style={{ width: "38%" }}>
        <Text size={1} textOverflow="ellipsis">
          {label}
        </Text>
      </Box>
      <Box flex={1} style={{ height: 10, borderRadius: 5, background: "var(--card-border-color)", overflow: "hidden" }}>
        <div style={{ width: `${pct(n, of)}%`, height: "100%", background: best ? "var(--card-badge-positive-dot-color, #3ab667)" : "var(--card-focus-ring-color)" }} />
      </Box>
      <Box style={{ width: 70, textAlign: "right" }}>
        <Text size={1} muted>
          {n} · {pct(n, of)}%
        </Text>
      </Box>
    </Flex>
  );
}

/**
 * Feedbackformulier → “Resultaten”: every submission of this form summed up, per retreat or all together,
 * like Google Forms' summary: a grid as a table (count per column, the most chosen in bold), a scale / stars
 * as average + spread, choices as bars, open answers as a list. Export: one CSV row per submission.
 * Answers are matched to the questions by their key, so renaming a question keeps its results.
 */
export const ReviewResults: UserViewComponent = ({ document }) => {
  const doc = document.displayed as { _id?: string; name?: string; questions?: Q[] };
  const id = (doc._id ?? "").replace(/^drafts\./, "");
  const client = useClient({ apiVersion });
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [error, setError] = useState("");
  const [retreat, setRetreat] = useState("all");

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const query = `*[_type == "reviewSubmission" && formId == $id] | order(submittedAt desc){ _id, "retreat": retreat._ref, "retreatTitle": coalesce(retreat->title[language == "nl"][0].value, retreat->title[0].value), "year": string::split(retreat->startDate, "-")[0], name, submittedAt, answers }`;
    const load = () => client.fetch<Sub[]>(query, { id }, { perspective: "raw" }).then((r) => alive && setSubs(r), (e: Error) => alive && setError(e.message));
    load();
    const sub = client.listen(`*[_type == "reviewSubmission" && formId == $id]`, { id }, { includeResult: false, visibility: "query" }).subscribe(() => load());
    return () => {
      alive = false;
      sub.unsubscribe();
    };
  }, [client, id]);

  const retreats = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subs ?? []) if (s.retreat) m.set(s.retreat, [s.retreatTitle ?? "Retreat", s.year].filter(Boolean).join(" "));
    return [...m];
  }, [subs]);
  const list = (subs ?? []).filter((s) => retreat === "all" || s.retreat === retreat);
  const questions = (doc.questions ?? []).filter((q) => q.type !== "section" && nl(q.label));
  const of = (q: Q) => list.flatMap((s) => (s.answers ?? []).filter((a) => a.qKey === q._key));

  const csv = () => {
    const cols: { title: string; get: (s: Sub) => string }[] = [
      { title: "Verstuurd op", get: (s) => s.submittedAt?.slice(0, 16).replace("T", " ") ?? "" },
      { title: "Retreat", get: (s) => [s.retreatTitle, s.year].filter(Boolean).join(" ") },
      ...questions.flatMap((q) =>
        q.type === "grid"
          ? lines(q.rows).map((row, i) => ({ title: `${nl(q.label)} [${row}]`, get: (s: Sub) => s.answers?.find((a) => a.qKey === q._key && a.rowIndex === i)?.answer ?? "" }))
          : [{ title: nl(q.label), get: (s: Sub) => s.answers?.find((a) => a.qKey === q._key)?.answer ?? "" }],
      ),
    ];
    const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const text = [cols.map((c) => esc(c.title)).join(";"), ...list.map((s) => cols.map((c) => esc(c.get(s))).join(";"))].join("\n");
    const a = window.document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
    a.download = `feedback-${(doc.name ?? "formulier").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
  };

  if (error) return <Box padding={4}><Text>Laden mislukt: {error}</Text></Box>;
  if (!subs) return <Box padding={4}><Text muted>Laden…</Text></Box>;

  return (
    <Box padding={4} style={{ maxWidth: 900 }}>
      <Stack gap={5}>
        <Flex gap={3} align="center" wrap="wrap">
          <Box flex={1}>
            <Heading size={2}>
              {list.length} {list.length === 1 ? "antwoord" : "antwoorden"}
            </Heading>
          </Box>
          {retreats.length > 1 ? (
            <Select value={retreat} onChange={(e) => setRetreat(e.currentTarget.value)} style={{ minWidth: 220 }}>
              <option value="all">Alle retreats ({subs.length})</option>
              {retreats.map(([rid, title]) => (
                <option key={rid} value={rid}>
                  {title} ({subs.filter((s) => s.retreat === rid).length})
                </option>
              ))}
            </Select>
          ) : retreats.length === 1 ? (
            <Badge>{retreats[0][1]}</Badge>
          ) : null}
          <Button icon={DownloadIcon} mode="ghost" text="Exporteer CSV" disabled={!list.length} onClick={csv} />
        </Flex>
        {!list.length ? (
          <Card padding={4} radius={2} border tone="transparent">
            <Text size={1} muted>
              Nog geen antwoorden. Kies dit formulier bij een retreat (tab Achteraf), publiceer, en stuur de reviewlink (of “Bedankbrief maken”).
            </Text>
          </Card>
        ) : null}
        {list.length
          ? questions.map((q) => {
              const answers = of(q);
              const title = nl(q.label);
              const n = new Set(list.filter((s) => s.answers?.some((a) => a.qKey === q._key)).map((s) => s._id)).size;
              return (
                <Card key={q._key} padding={4} radius={3} shadow={1}>
                  <Stack gap={4}>
                    <Stack gap={2}>
                      <Text size={2} weight="semibold">
                        {title}
                      </Text>
                      <Text size={1} muted>
                        {n} van {list.length} beantwoord
                      </Text>
                    </Stack>
                    {q.type === "grid" ? (
                      <Grid q={q} answers={answers} />
                    ) : q.type === "scale" || q.type === "stars" ? (
                      <Scale q={q} answers={answers} />
                    ) : TEXT.has(q.type ?? "text") ? (
                      <Stack gap={3}>
                        {(showAll(answers) as A[]).map((a, i) => (
                          <Card key={i} padding={3} radius={2} tone="transparent" border>
                            <Text size={1}>
                              <span style={{ whiteSpace: "pre-wrap" }}>{a.answer}</span>
                            </Text>
                          </Card>
                        ))}
                        {!answers.length ? <Text size={1} muted>Geen antwoorden.</Text> : null}
                      </Stack>
                    ) : (
                      <Choices q={q} answers={answers} total={n} />
                    )}
                  </Stack>
                </Card>
              );
            })
          : null}
        <Text size={1} muted>
          Elke inzending apart (en een quote publiceren als testimonial): Contact → Testimonials → Inzendingen (formulier).
        </Text>
      </Stack>
    </Box>
  );
};

const showAll = (a: A[]) => a.filter((x) => x.answer?.trim());

function Grid({ q, answers }: { q: Q; answers: A[] }) {
  const rows = lines(q.rows);
  const cols = lines(q.options);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th />
            {cols.map((c) => (
              <th key={c} style={{ padding: "4px 6px", fontWeight: 500, opacity: 0.7, textAlign: "center" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const counts = cols.map((_, ci) => answers.filter((a) => a.rowIndex === ri && a.value === ci).length);
            const max = Math.max(...counts);
            const total = counts.reduce((x, y) => x + y, 0);
            return (
              <tr key={ri} style={{ borderTop: "1px solid var(--card-border-color)" }}>
                <td style={{ padding: "8px 8px 8px 0" }}>{row}</td>
                {counts.map((c, ci) => (
                  <td key={ci} style={{ padding: "8px 6px", textAlign: "center", fontWeight: c && c === max ? 700 : 400, background: c ? `color-mix(in srgb, var(--card-focus-ring-color) ${Math.round((c / (total || 1)) * 45)}%, transparent)` : undefined }}>
                    {c || "·"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Scale({ q, answers }: { q: Q; answers: A[] }) {
  const max = Math.min(10, Math.max(2, q.scaleMax ?? 5));
  const values = answers.map((a) => a.value).filter((v): v is number => typeof v === "number");
  const avg = values.length ? values.reduce((x, y) => x + y, 0) / values.length : 0;
  return (
    <Stack gap={3}>
      <Text size={3} weight="semibold">
        {values.length ? `${avg.toFixed(1).replace(".", ",")} / ${max}` : "-"}
        {q.type === "stars" ? " ★" : ""}
      </Text>
      {Array.from({ length: max }, (_, i) => max - i).map((v) => (
        <Bar key={v} label={String(v)} n={values.filter((x) => x === v).length} of={values.length} />
      ))}
    </Stack>
  );
}

function Choices({ q, answers, total }: { q: Q; answers: A[]; total: number }) {
  const opts = q.type === "yesno" ? ["Ja", "Nee"] : q.type === "publish" && lines(q.options).length !== 3 ? PUBLISH_DEFAULT.nl : lines(q.options);
  const count = (o: string, i: number) =>
    q.type === "multi" ? answers.filter((a) => (a.answer ?? "").split(", ").includes(o)).length : q.type === "yesno" ? answers.filter((a) => a.answer === o).length : answers.filter((a) => a.value === i).length;
  const counts = opts.map(count);
  const max = Math.max(0, ...counts);
  const others = q.type === "choice" || q.type === "multi" ? answers.flatMap((a) => (a.answer ?? "").split(", ").filter((x) => x.startsWith("Andere"))) : [];
  return (
    <Stack gap={3}>
      {opts.map((o, i) => (
        <Bar key={o} label={o.replace(/\{retreat\}/g, "…")} n={counts[i]} of={total} best={counts[i] === max && max > 0} />
      ))}
      {others.length ? (
        <Text size={1} muted>
          {others.join(" · ")}
        </Text>
      ) : null}
    </Stack>
  );
}
