"use client";

/** "Zoek een retreat": filter all retreats on destination and month. Cards are server-rendered. */
import { useState, type ReactNode } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";
import { Select } from "./Select";

export type FilterItem = { id: string; destination: string | null; months: { key: string; label: string }[]; card: ReactNode };

export function RetreatFilter({ lang, items }: { lang: Lang; items: FilterItem[] }) {
  const t = getDictionary(lang).retreats;
  const [dest, setDest] = useState("");
  const [month, setMonth] = useState("");
  const destinations = [...new Set(items.map((i) => i.destination).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
  const months = [...new Map(items.flatMap((i) => i.months).map((m) => [m.key, m.label])).entries()].sort(([a], [b]) => b.localeCompare(a));
  const shown = items.filter((i) => (!dest || i.destination === dest) && (!month || i.months.some((m) => m.key === month)));
  const all = { value: "", label: t.all };

  return (
    <>
      <div className="filters">
        <Select label={t.destination} value={dest} onChange={setDest} options={[all, ...destinations.map((d) => ({ value: d, label: d }))]} />
        <Select label={t.month} value={month} onChange={setMonth} options={[all, ...months.map(([value, label]) => ({ value, label }))]} />
        <p className="muted small" role="status" style={{ margin: 0, paddingBottom: 10 }}>
          {t.results(shown.length)}
        </p>
      </div>
      {shown.length ? (
        <div className="g3" style={{ marginTop: 40 }}>
          {shown.map((i) => (
            <div key={i.id}>{i.card}</div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 32 }}>
          {t.none}
        </p>
      )}
    </>
  );
}
