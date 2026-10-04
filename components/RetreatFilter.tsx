"use client";

/** "Zoek een retreat": filter all retreats on destination and month. Cards are server-rendered. */
import { useId, useState, type ReactNode } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";

export type FilterItem = { id: string; destination: string | null; months: { key: string; label: string }[]; card: ReactNode };

export function RetreatFilter({ lang, items }: { lang: Lang; items: FilterItem[] }) {
  const t = getDictionary(lang).retreats;
  const id = useId();
  const [dest, setDest] = useState("");
  const [month, setMonth] = useState("");
  const destinations = [...new Set(items.map((i) => i.destination).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
  const months = [...new Map(items.flatMap((i) => i.months).map((m) => [m.key, m.label])).entries()].sort(([a], [b]) => b.localeCompare(a));
  const active = !!(dest || month);
  const shown = items.filter((i) => (!dest || i.destination === dest) && (!month || i.months.some((m) => m.key === month)));

  return (
    <>
      <div className="filters">
        <div className="select">
          <label htmlFor={`${id}-d`}>{t.destination}</label>
          <select id={`${id}-d`} value={dest} onChange={(e) => setDest(e.target.value)}>
            <option value="">{t.all}</option>
            {destinations.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="select">
          <label htmlFor={`${id}-m`}>{t.month}</label>
          <select id={`${id}-m`} value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">{t.all}</option>
            {months.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {active ? (
          <p className="muted small" role="status" style={{ margin: 0, paddingBottom: 8 }}>
            {t.results(shown.length)}
          </p>
        ) : null}
      </div>
      {active ? (
        shown.length ? (
          <div className="g3" style={{ marginTop: 40 }}>
            {shown.map((i) => (
              <div key={i.id}>{i.card}</div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 32 }}>
            {t.none}
          </p>
        )
      ) : null}
    </>
  );
}
