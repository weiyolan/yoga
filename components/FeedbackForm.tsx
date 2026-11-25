"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { sendFeedback, type FormState } from "@/app/actions/forms";
import { getDictionary } from "@/lib/dictionary";
import type { ReviewQuestion } from "@/lib/review-form";
import { href } from "@/lib/routes";
import { formValues, questionSteps, visibleKeys } from "@/lib/signup-form";
import type { Lang } from "@/sanity/site.config";
import { QuestionField } from "./QuestionField";

const idle: FormState = { status: "idle" };

/**
 * A retreat's own feedback form (/retreats/<slug>/review; Studio → Formulieren → Feedbackformulieren).
 * Every “Nieuwe stap” is a page with a progress bar, like the sign-up form (a form without steps: one page);
 * a step whose questions are all hidden is skipped. Questions can depend on the one before (lib/signup-form.ts).
 * Every step stays in the DOM, so the whole form is posted at once and refilled after a failed submit.
 * The questions come with the defaults filled in (lib/review-form.ts → withDefaults). Stored by sendFeedback.
 */
export function FeedbackForm({ lang, retreatId, questions }: { lang: Lang; retreatId: string; questions: ReviewQuestion[] }) {
  const t = getDictionary(lang).review;
  const s = getDictionary(lang).signup;
  const [state, action, pending] = useActionState(sendFeedback, idle);
  const v = state.values ?? {};
  const [vals, setVals] = useState<Record<string, string>>(v);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const formEl = useRef<HTMLFormElement>(null);
  const moved = useRef(false);
  const qs = questions.filter((q) => q.label);
  const shown = visibleKeys(qs, (name) => vals[name] ?? "");
  const groups = questionSteps(qs);
  // a step whose questions are all hidden (by “Enkel tonen als …”) is skipped
  const active = groups.filter((g) => g.questions.some((q) => shown.has(q._key)));
  const total = Math.max(active.length, 1);
  const paged = active.length > 1;
  const at = Math.min(step, total - 1);
  const last = at === total - 1;

  // Netlify Forms fallback for the team mail, like the other forms
  const posted = useRef<FormState["notify"]>(undefined);
  useEffect(() => {
    const n = state.notify;
    if (!n || posted.current === n) return;
    posted.current = n;
    fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ "form-name": "melding", ...n }).toString() }).catch(() => {});
  }, [state.notify]);

  // Server said "invalid": go to the first step with a missing answer.
  useEffect(() => {
    if (state.status !== "invalid") return;
    const bad = formEl.current?.querySelector<HTMLElement>(":invalid:not(fieldset)");
    const n = Number(bad?.closest<HTMLElement>("[data-step]")?.dataset.step ?? total - 1);
    setStep(n);
    setTimeout(() => bad?.focus(), 50);
  }, [state]);

  // Focus the first field of a new step (not on page load).
  useEffect(() => {
    if (!moved.current) return;
    formEl.current?.querySelector<HTMLElement>(`[data-step="${at}"] :is(input:not([type=hidden]):not(:disabled), textarea:not(:disabled))`)?.focus({ preventScroll: true });
  }, [at]);

  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {t.feedbackSent}
      </p>
    );

  const go = (to: number) => {
    const el = formEl.current;
    if (!el) return;
    if (to > at)
      for (const f of el.querySelectorAll<HTMLInputElement>(`[data-step="${at}"] :is(input, textarea)`))
        if (!f.checkValidity()) return void f.reportValidity();
    moved.current = true;
    setDir(to > at ? "fwd" : "back");
    setStep(to);
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  // Enter = next step (not in a textarea, not on the last step where it submits).
  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (!paged || e.key !== "Enter" || last || (e.target as HTMLElement).tagName === "TEXTAREA") return;
    e.preventDefault();
    go(at + 1);
  };

  return (
    <form className="stepper feedback" style={{ marginTop: 28 }} action={action} ref={formEl} onKeyDown={onKeyDown} onChange={(e) => setVals(formValues(new FormData(e.currentTarget)))} data-dir={dir}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      {paged ? (
        <>
          <div className="progress" aria-hidden="true">
            <span style={{ width: `${((at + 1) / total) * 100}%` }} />
          </div>
          <p className="progress-label" aria-live="polite">
            <b>{s.step(at + 1, total)}</b>
            {active[at]?.title ? ` · ${active[at].title}` : ""}
          </p>
        </>
      ) : null}

      {groups.map((g) => {
        const n = active.indexOf(g);
        return (
          <fieldset key={g.key} data-step={n >= 0 ? n : undefined} hidden={paged && at !== n} disabled={n < 0} className={`form step${!paged || at === n ? " on" : ""}`}>
            {g.title ? <h3 className={`fb-section${paged ? " visually-hidden" : ""}`}>{g.title}</h3> : null}
            {g.help ? <p className="muted full step-help">{g.help}</p> : null}
            {g.questions.map((q) => (
              <fieldset key={q._key} className="q-wrap" hidden={!shown.has(q._key)} disabled={!shown.has(q._key)}>
                <QuestionField q={q} lang={lang} v={v} vals={vals} prefix="f" />
              </fieldset>
            ))}
            {n === total - 1 ? (
              <p className="muted small full">
                {t.feedbackPrivacy}{" "}
                <Link href={href(lang, "privacy")} target="_blank">
                  {getDictionary(lang).privacy.link}
                </Link>
              </p>
            ) : null}
          </fieldset>
        );
      })}

      <div className="visually-hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.status === "invalid" || state.status === "error" ? (
        <p className="form-msg" role="alert">
          {state.status === "invalid" ? t.feedbackInvalid : t.error}
        </p>
      ) : null}
      <div className="step-nav">
        {paged && at > 0 ? (
          <button type="button" className="link" onClick={() => go(at - 1)}>
            ← {s.back}
          </button>
        ) : (
          <span />
        )}
        {last ? (
          <button className="btn" disabled={pending}>
            {pending ? t.sending : t.feedbackSend}
          </button>
        ) : (
          <span className="step-next">
            <span className="hint">{s.enterHint}</span>
            <button type="button" className="btn" onClick={() => go(at + 1)}>
              {s.next} →
            </button>
          </span>
        )}
      </div>
    </form>
  );
}
