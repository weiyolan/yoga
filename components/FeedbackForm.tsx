"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type CSSProperties } from "react";
import { sendFeedback, type FormState } from "@/app/actions/forms";
import { getDictionary } from "@/lib/dictionary";
import { maxOf, optionsOf, rowName, rowsOf, type ReviewQuestion } from "@/lib/review-form";
import { href } from "@/lib/routes";
import { formValues, otherName, qName, visibleKeys } from "@/lib/signup-form";
import type { Lang } from "@/sanity/site.config";

const idle: FormState = { status: "idle" };

/**
 * A retreat's own feedback form (/retreats/<slug>/review; Studio → Formulieren → Feedbackformulieren):
 * one page like a Google Form, “Nieuw deel” as headings, a grid as a table (a list per row on a phone),
 * a scale, stars. Questions can depend on the one before (lib/signup-form.ts). Stored by sendFeedback.
 * The questions come with the defaults filled in (lib/review-form.ts → withDefaults).
 */
export function FeedbackForm({ lang, retreatId, questions }: { lang: Lang; retreatId: string; questions: ReviewQuestion[] }) {
  const t = getDictionary(lang).review;
  const s = getDictionary(lang).signup;
  const [state, action, pending] = useActionState(sendFeedback, idle);
  const v = state.values ?? {};
  const [vals, setVals] = useState<Record<string, string>>(v);
  const formEl = useRef<HTMLFormElement>(null);
  const qs = questions.filter((q) => q.label);
  const shown = visibleKeys(qs, (name) => vals[name] ?? "");

  // Netlify Forms fallback for the team mail, like the other forms
  const posted = useRef<FormState["notify"]>(undefined);
  useEffect(() => {
    const n = state.notify;
    if (!n || posted.current === n) return;
    posted.current = n;
    fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ "form-name": "melding", ...n }).toString() }).catch(() => {});
  }, [state.notify]);

  useEffect(() => {
    if (state.status === "invalid") formEl.current?.querySelector<HTMLElement>(":invalid")?.focus();
  }, [state]);

  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {t.feedbackSent}
      </p>
    );

  const label = (q: ReviewQuestion) => `${q.label}${q.required ? " *" : ""}`;
  const help = (q: ReviewQuestion, id: string) =>
    q.help ? (
      <small className="muted" id={`${id}-help`}>
        {q.help}
      </small>
    ) : null;

  const question = (q: ReviewQuestion) => {
    const name = qName(q);
    const id = `f-q-${q._key}`;
    const described = q.help ? `${id}-help` : undefined;
    const type = q.type ?? "text";

    if (type === "section") return <h3 className="fb-section">{q.label}</h3>;

    if (type === "grid") {
      const rows = rowsOf(q);
      const cols = optionsOf(q);
      return (
        <fieldset className="field full choices fb-grid" aria-describedby={described}>
          <legend className="select-label">{label(q)}</legend>
          {help(q, id)}
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
          <legend className="select-label">{label(q)}</legend>
          {help(q, id)}
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
          <legend className="select-label">{label(q)}</legend>
          {help(q, id)}
          {/* reversed in the DOM so "this star and the ones before it" light up with plain CSS */}
          <div className="stars-row">
            {Array.from({ length: max }, (_, i) => max - i).map((n) => (
              <label key={n} title={t.stars(n)}>
                <input type="radio" name={name} value={n} defaultChecked={v[name] === String(n)} required={!!q.required} />
                <span aria-hidden="true">★</span>
                <span className="visually-hidden">{t.stars(n)}</span>
              </label>
            ))}
          </div>
          {max > 5 ? <span className="fb-starnum" aria-hidden="true">{vals[name] ? `${vals[name]} / ${max}` : ""}</span> : null}
        </fieldset>
      );
    }

    if (type === "yesno" || type === "choice" || type === "publish" || type === "multi") {
      const multi = type === "multi";
      const opts: [string, string][] = type === "yesno" ? [["yes", s.yes], ["no", s.no]] : optionsOf(q).map((o, i) => [String(i), o]);
      const ticked = (vals[name] ?? v[name] ?? "").split(",");
      const none = !ticked.some(Boolean);
      return (
        <fieldset className="field full choices" aria-describedby={described}>
          <legend className="select-label">{label(q)}</legend>
          {help(q, id)}
          <div className={`row${opts.length > 2 ? " stack" : ""}`}>
            {opts.map(([value, text], i) => (
              <label key={value} className="check">
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={name}
                  value={value}
                  defaultChecked={multi ? ticked.includes(value) : v[name] === value}
                  required={!!q.required && (!multi || (none && i === 0))}
                />{" "}
                {text}
              </label>
            ))}
            {(type === "choice" || multi) && q.other ? (
              <label className="check other">
                <input type={multi ? "checkbox" : "radio"} name={name} value="other" defaultChecked={multi ? ticked.includes("other") : v[name] === "other"} />{" "}
                {s.other}:
                <input
                  name={otherName(q)}
                  defaultValue={v[otherName(q)]}
                  placeholder={s.otherPlaceholder}
                  aria-label={`${q.label}: ${s.other}`}
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
        <label htmlFor={id}>{label(q)}</label>
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
            maxLength={type === "name" ? 100 : 300}
            aria-describedby={described}
          />
        )}
        {help(q, id)}
      </div>
    );
  };

  return (
    <form className="form feedback" style={{ marginTop: 28 }} action={action} ref={formEl} onChange={(e) => setVals(formValues(new FormData(e.currentTarget)))}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      {qs.map((q) => (
        <fieldset key={q._key} className="q-wrap" hidden={!shown.has(q._key)} disabled={!shown.has(q._key)}>
          {question(q)}
        </fieldset>
      ))}
      <p className="muted small full">
        {t.feedbackPrivacy}{" "}
        <Link href={href(lang, "privacy")} target="_blank">
          {getDictionary(lang).privacy.link}
        </Link>
      </p>
      <div className="visually-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.status === "invalid" || state.status === "error" ? (
        <p className="form-msg full" role="alert">
          {state.status === "invalid" ? t.feedbackInvalid : t.error}
        </p>
      ) : null}
      <div className="full">
        <button className="btn" disabled={pending}>
          {pending ? t.sending : t.feedbackSend}
        </button>
      </div>
    </form>
  );
}
