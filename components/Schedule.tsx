"use client";

import { useEffect, useRef, useState } from "react";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";
import type { LESSONS_QUERY_RESULT } from "@/sanity/types";
import { ClassRequestForm } from "./Forms";

export type Slot = NonNullable<
  NonNullable<LESSONS_QUERY_RESULT["page"]>["schedule"]
>[number];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

/** "18:30" + 50 → "19:20". */
function endTime(start: string | null, minutes: number | null) {
  if (!start || !minutes) return null;
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Lessen → weekly schedule: a column per day (a list per day on a phone), filter chips per style, and a
 * class opens a detail card (dialog) with a request form to Rita instead of leaving for the studio's site.
 */
export function Schedule({ lang, slots }: { lang: Lang; slots: Slot[] }) {
  const t = getDictionary(lang).lessons;
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<Slot | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const sorted = [...slots].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );
  const styles = [
    ...new Map(
      sorted
        .filter((s) => s.style?.slug)
        .map((s) => [s.style!.slug!, s.style!.name ?? ""]),
    ).entries(),
  ];
  const shown = sorted.filter((s) => !filter || s.style?.slug === filter);
  const end = open ? endTime(open.startTime, open.durationMinutes) : null;

  return (
    <>
      {styles.length > 1 ? (
        <div className="chips" role="group" aria-label={t.scheduleLabel}>
          <button
            type="button"
            aria-pressed={!filter}
            onClick={() => setFilter(null)}
          >
            {t.all}
          </button>
          {styles.map(([slug, name]) => (
            <button
              key={slug}
              type="button"
              aria-pressed={filter === slug}
              onClick={() => setFilter(filter === slug ? null : slug)}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      <p className="muted small sched-hint">{t.hint}</p>

      <div className="sched">
        {DAYS.map((day) => {
          const list = shown.filter((s) => s.day === day);
          return (
            <div
              key={day}
              className={`sched-day${list.length ? "" : " empty"}`}
            >
              <h3>{t.days[day]}</h3>
              {list.length ? (
                <ul>
                  {list.map((s) => (
                    <li key={s._key}>
                      <button
                        type="button"
                        className="sched-slot"
                        onClick={() => setOpen(s)}
                        aria-haspopup="dialog"
                      >
                        <span className="sched-time">{s.startTime}</span>
                        <span className="sched-what">
                          <b>{s.style?.name}</b>
                          <span>
                            {[
                              s.studio?.name,
                              s.durationMinutes
                                ? `${s.durationMinutes} ${t.min}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        {s.level !== "all" ? (
                          <span className={`level ${s.level}`}>
                            {t.levels[s.level] ?? ""}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sched-none">–</p>
              )}
            </div>
          );
        })}
      </div>

      <dialog
        ref={dialog}
        className="class-card"
        aria-labelledby="class-card-title"
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
      >
        {open ? (
          <div className="class-card-in">
            <button
              type="button"
              className="class-card-x"
              onClick={() => setOpen(null)}
              aria-label={t.close}
            >
              ×
            </button>
            <span className="label">
              {t.days[open.day as (typeof DAYS)[number]]} · {open.startTime}
              {end ? `–${end}` : ""}
            </span>
            <h2 id="class-card-title">{open.style?.name}</h2>
            {open.style?.what ? (
              <p className="muted">{open.style.what}</p>
            ) : null}
            <dl className="facts sm">
              <div>
                <dt>{t.time}</dt>
                <dd>
                  {open.startTime}
                  {end ? `–${end}` : ""}
                  {open.durationMinutes
                    ? ` (${open.durationMinutes} ${t.min})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>{t.level}</dt>
                <dd>{t.levels[open.level] ?? t.levels.all}</dd>
              </div>
              {open.studio?.name ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <dt>{t.studio}</dt>
                  <dd>
                    {open.studio.name}
                    {open.studio.address || open.studio.city ? (
                      <small className="muted">
                        {" "}
                        ·{" "}
                        {[open.studio.address, open.studio.city]
                          .filter(Boolean)
                          .join(", ")}
                      </small>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div className="class-card-links">
              {open.style?.slug ? (
                <a
                  className="link"
                  href={`#${open.style.slug}`}
                  onClick={() => setOpen(null)}
                >
                  {t.more(open.style.name ?? "")}
                </a>
              ) : null}
              {open.bookingUrl ? (
                <a
                  className="link"
                  href={open.bookingUrl}
                  target="_blank"
                  rel="noopener"
                >
                  {t.bookSelf} ↗
                </a>
              ) : null}
            </div>
            <div className="class-card-ask">
              <h3>{t.askTitle}</h3>
              <p className="muted small">{t.askText}</p>
              <ClassRequestForm key={open._key} lang={lang} slot={open._key} />
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
