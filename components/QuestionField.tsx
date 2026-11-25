"use client";

import type { CSSProperties } from "react";
import { getDictionary } from "@/lib/dictionary";
import { maxOf, optionsOf, rowName, rowsOf, type ReviewQuestion } from "@/lib/review-form";
import { otherName, qName } from "@/lib/signup-form";
import type { Lang } from "@/sanity/site.config";

/**
 * One question of a sign-up form (components/Forms.tsx → SignupForm) or a feedback form
 * (components/FeedbackForm.tsx), shared so both look and behave the same: short / long text, yes-no,
 * choices (+ “Andere: …”), a grid (a table; a list of chips per row on a phone), a scale, stars, and the
 * feedback-only quote / publish consent / name / e-mail. Room and diet stay in SignupForm (they use the
 * retreat's prices and own fields). `v`: values to refill after a failed submit; `vals`: the live values.
 */
export function QuestionField({ q, lang, v, vals, prefix }: { q: ReviewQuestion; lang: Lang; v: Record<string, string>; vals: Record<string, string>; prefix: string }) {
  const s = getDictionary(lang).signup;
  const r = getDictionary(lang).review;
  const name = qName(q);
  const id = `${prefix}-q-${q._key}`;
  const described = q.help ? `${id}-help` : undefined;
  const type = q.type ?? "text";
  const label = `${q.label}${q.required ? " *" : ""}`;
  const help = q.help ? (
    <small className="muted" id={`${id}-help`}>
      {q.help}
    </small>
  ) : null;

  if (type === "grid") {
    const rows = rowsOf(q);
    const cols = optionsOf(q);
    return (
      <fieldset className="field full choices fb-grid" aria-describedby={described}>
        <legend className="select-label">{label}</legend>
        {help}
        <div className="fb-table" role="presentation" style={{ "--cols": cols.length } as CSSProperties}>
          <div className="fb-head" aria-hidden="true">
            <span />
            {cols.map((c, ci) => (
              <span key={ci}>{c}</span>
            ))}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} className="fb-row" role="radiogroup" aria-label={row}>
              <span className="fb-rowlabel">{row}</span>
              {cols.map((c, ci) => (
                <label key={ci} className="fb-cell">
                  <input type="radio" name={rowName(q, ri)} value={String(ci)} defaultChecked={v[rowName(q, ri)] === String(ci)} required={!!q.required} aria-label={`${row}: ${c}`} />
                  <span className="fb-col">{c}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  if (type === "scale") {
    const max = maxOf(q);
    return (
      <fieldset className="field full choices" aria-describedby={described}>
        <legend className="select-label">{label}</legend>
        {help}
        <div className="fb-scale">
          {q.low ? <span className="fb-end">{q.low}</span> : null}
          <div className="fb-nums">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <label key={n}>
                <span>{n}</span>
                <input type="radio" name={name} value={String(n)} defaultChecked={v[name] === String(n)} required={!!q.required} aria-label={`${n}${n === 1 && q.low ? ` (${q.low})` : n === max && q.high ? ` (${q.high})` : ""}`} />
              </label>
            ))}
          </div>
          {q.high ? <span className="fb-end">{q.high}</span> : null}
        </div>
      </fieldset>
    );
  }

  if (type === "stars") {
    const max = maxOf(q);
    return (
      <fieldset className={`field full stars${max > 5 ? " many" : ""}`} aria-describedby={described}>
        <legend className="select-label">{label}</legend>
        {help}
        {/* reversed in the DOM so "this star and the ones before it" light up with plain CSS */}
        <div className="stars-row">
          {Array.from({ length: max }, (_, i) => max - i).map((n) => (
            <label key={n} title={r.stars(n)}>
              <input type="radio" name={name} value={n} defaultChecked={v[name] === String(n)} required={!!q.required} />
              <span aria-hidden="true">★</span>
              <span className="visually-hidden">{r.stars(n)}</span>
            </label>
          ))}
        </div>
        {max > 5 ? (
          <span className="fb-starnum" aria-hidden="true">
            {vals[name] ? `${vals[name]} / ${max}` : ""}
          </span>
        ) : null}
      </fieldset>
    );
  }

  if (type === "yesno" || type === "choice" || type === "publish" || type === "multi") {
    const multi = type === "multi";
    const opts: [string, string][] =
      type === "yesno"
        ? [
            ["yes", s.yes],
            ["no", s.no],
          ]
        : optionsOf(q).map((o, i) => [String(i), o]);
    const ticked = (vals[name] ?? v[name] ?? "").split(",");
    // multi + required: at least one ticked (the browser checks the first box while none is)
    const none = !ticked.some(Boolean);
    return (
      <fieldset className="field full choices" aria-describedby={described}>
        <legend className="select-label">{label}</legend>
        {help}
        <div className={`row${multi || opts.length > 2 ? " stack" : ""}`}>
          {opts.map(([value, text], i) => (
            <label key={value} className="check">
              <input type={multi ? "checkbox" : "radio"} name={name} value={value} defaultChecked={multi ? ticked.includes(value) : v[name] === value} required={!!q.required && (!multi || (none && i === 0))} />{" "}
              {text}
            </label>
          ))}
          {(type === "choice" || multi) && q.other ? (
            <label className="check other">
              <input type={multi ? "checkbox" : "radio"} name={name} value="other" defaultChecked={multi ? ticked.includes("other") : v[name] === "other"} required={!multi && !!q.required} />{" "}
              {s.other}:
              <input
                name={otherName(q)}
                defaultValue={v[otherName(q)]}
                placeholder={s.otherPlaceholder}
                aria-label={`${q.label}: ${s.other}`}
                // typing here picks “Andere”
                onFocus={(e) => {
                  const box = e.currentTarget.parentElement?.querySelector<HTMLInputElement>("input[type=radio], input[type=checkbox]");
                  if (box && !box.checked) box.click();
                }}
              />
            </label>
          ) : null}
        </div>
      </fieldset>
    );
  }

  const long = type === "textarea" || type === "quote";
  return (
    <div className="field full">
      <label htmlFor={id}>{label}</label>
      {long ? (
        <textarea id={id} name={name} defaultValue={v[name]} required={!!q.required} maxLength={type === "quote" ? 1200 : 2000} aria-describedby={described} />
      ) : (
        <input
          id={id}
          name={name}
          type={type === "email" ? "email" : "text"}
          autoComplete={type === "email" ? "email" : type === "name" ? "given-name" : undefined}
          defaultValue={v[name]}
          required={!!q.required}
          maxLength={type === "name" ? 100 : 2000}
          aria-describedby={described}
        />
      )}
      {help}
    </div>
  );
}
