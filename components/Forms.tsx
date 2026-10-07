"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { sendContact, sendReview, signup, subscribe, type FormState } from "@/app/actions/forms";
import { getDictionary } from "@/lib/dictionary";
import { href } from "@/lib/routes";
import type { Lang } from "@/sanity/site.config";
import { Select } from "./Select";

const idle: FormState = { status: "idle" };

/** Hidden from people (and screen readers); bots fill it in. */
const Honeypot = () => (
  <div className="visually-hidden" aria-hidden="true">
    <label>
      Website <input name="website" tabIndex={-1} autoComplete="off" />
    </label>
  </div>
);

/** Editable texts from Studio → Instellingen → Formulieren (empty = the dictionary default). */
type Texts = { thanks?: string | null; consent?: string | null };

export function NewsletterForm({ lang, thanks }: { lang: Lang; thanks?: string | null }) {
  const t = getDictionary(lang).footer;
  const [state, action, pending] = useActionState(subscribe, idle);
  if (state.status === "sent") return <p className="sub-done" role="status">{thanks || t.subscribed}</p>;
  return (
    <form className="sub" action={action}>
      <label className="visually-hidden" htmlFor="sub-email">{t.emailPlaceholder}</label>
      <input id="sub-email" name="email" type="email" defaultValue={state.values?.email} required placeholder={t.emailPlaceholder} autoComplete="email" aria-invalid={state.status === "invalid" || undefined} />
      <input type="hidden" name="lang" value={lang} />
      <Honeypot />
      <button className="btn sm white" disabled={pending}>{t.subscribe}</button>
      {state.status === "error" || state.status === "invalid" ? <p className="form-msg" role="alert">{getDictionary(lang).contact[state.status === "error" ? "error" : "invalid"]}</p> : null}
    </form>
  );
}

export function ContactForm({ lang, subjects, notifyLabel, thanks }: { lang: Lang; subjects: string[]; notifyLabel: string | null; thanks?: string | null }) {
  const t = getDictionary(lang).contact;
  const [state, action, pending] = useActionState(sendContact, idle);
  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {thanks || t.sent}
      </p>
    );
  const options = subjects.filter(Boolean);
  return (
    <form className="form" style={{ marginTop: 32 }} action={action}>
      <input type="hidden" name="lang" value={lang} />
      <div className="field">
        <label htmlFor="c-name">{t.name}</label>
        <input id="c-name" name="name" defaultValue={state.values?.name} required placeholder={t.namePlaceholder} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="c-email">{t.email}</label>
        <input id="c-email" name="email" type="email" defaultValue={state.values?.email} required placeholder={t.emailPlaceholder} autoComplete="email" />
      </div>
      <div className="field full">
        {options.length ? (
          <Select label={t.subject} name="subject" defaultValue={state.values?.subject} options={options.map((s) => ({ value: s, label: s }))} />
        ) : (
          <>
            <label htmlFor="c-subject">{t.subject}</label>
            <input id="c-subject" name="subject" defaultValue={state.values?.subject} />
          </>
        )}
      </div>
      <div className="field full">
        <label htmlFor="c-message">{t.message}</label>
        <textarea id="c-message" name="message" defaultValue={state.values?.message} required placeholder={t.messagePlaceholder} />
      </div>
      {notifyLabel ? (
        <label className="check full">
          <input type="checkbox" name="notify" defaultChecked={state.values ? state.values.notify === "on" : true} /> {notifyLabel}
        </label>
      ) : null}
      <Honeypot />
      {state.status === "invalid" || state.status === "error" ? (
        <p className="form-msg full" role="alert">
          {t[state.status]}
        </p>
      ) : null}
      <div className="full">
        <button className="btn" disabled={pending}>
          {pending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}

/** Which step holds each field: after a failed submit the form opens on the first step with a problem. */
const STEP_OF: Record<string, number> = { name: 0, email: 0, phone: 0, persons: 1, room: 1, diet: 2, message: 2, consent: 3 };

/**
 * Retreat sign-up (retreat page, #inschrijven): stored in Sanity → Inschrijvingen.
 * One question group at a time (Typeform-like) with a progress bar; every step stays in the DOM,
 * so the whole form is posted at once and refilled after a failed submit. `full`: waiting list.
 */
export function SignupForm({ lang, retreatId, rooms, texts, full = false }: { lang: Lang; retreatId: string; rooms: string[]; texts?: Texts; full?: boolean }) {
  const t = getDictionary(lang).signup;
  const [state, action, pending] = useActionState(signup, idle);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [summary, setSummary] = useState<[string, string][]>([]);
  const form = useRef<HTMLFormElement>(null);
  const moved = useRef(false);

  // Server said "invalid": go back to the first step with a missing or wrong answer.
  useEffect(() => {
    if (state.status !== "invalid") return;
    const v = state.values ?? {};
    const bad = !v.name ? "name" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email ?? "") ? "email" : "consent";
    setStep(STEP_OF[bad]);
  }, [state]);

  // Focus the first field of a new step (not on page load).
  useEffect(() => {
    if (!moved.current) return;
    form.current?.querySelector<HTMLElement>(`[data-step="${step}"] :is(input:not([type=hidden]), textarea, button[role=combobox], [role=combobox])`)?.focus({ preventScroll: true });
  }, [step]);

  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {full ? t.waitlistSent : texts?.thanks || t.sent}
      </p>
    );

  const options = rooms.filter(Boolean);
  const total = t.steps.length;
  const last = step === total - 1;

  const go = (to: number) => {
    const el = form.current;
    if (!el) return;
    if (to > step) {
      // validate the current step only
      for (const f of el.querySelectorAll<HTMLInputElement>(`[data-step="${step}"] :is(input, textarea)`)) if (!f.checkValidity()) return void f.reportValidity();
    }
    if (to === total - 1) {
      const data = new FormData(el);
      const rows: [string, string][] = [
        [t.name, String(data.get("name") ?? "")],
        [t.email, String(data.get("email") ?? "")],
        [t.phone, String(data.get("phone") ?? "")],
        [t.persons, t.personsN(Number(data.get("persons") ?? 1))],
        [t.room, options.length ? String(data.get("room") ?? "") : ""],
        [t.diet, String(data.get("diet") ?? "")],
        [t.message, String(data.get("message") ?? "")],
      ];
      setSummary(rows.filter(([, v]) => v.trim()));
    }
    moved.current = true;
    setDir(to > step ? "fwd" : "back");
    setStep(to);
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  // Enter = next step (not in a textarea, not on the last step where it submits).
  const onKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key !== "Enter" || last || target.tagName === "TEXTAREA" || target.getAttribute("role") === "combobox") return;
    e.preventDefault();
    go(step + 1);
  };

  const at = (n: number) => ({ "data-step": n, hidden: step !== n, className: `form step${step === n ? " on" : ""}` });

  return (
    <form className="stepper" style={{ marginTop: 32 }} action={action} ref={form} onKeyDown={onKeyDown} data-dir={dir}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      {full ? <p className="form-note">{t.waitlist}</p> : null}

      <div className="progress" aria-hidden="true">
        <span style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <p className="progress-label" aria-live="polite">
        <b>{t.step(step + 1, total)}</b> · {t.steps[step]}
      </p>

      <fieldset {...at(0)}>
        <legend className="visually-hidden">{t.steps[0]}</legend>
        <div className="field full">
          <label htmlFor="s-name">{t.name}</label>
          <input id="s-name" name="name" defaultValue={state.values?.name} required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="s-email">{t.email}</label>
          <input id="s-email" name="email" type="email" defaultValue={state.values?.email} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="s-phone">{t.phone}</label>
          <input id="s-phone" name="phone" type="tel" defaultValue={state.values?.phone} autoComplete="tel" />
        </div>
      </fieldset>

      <fieldset {...at(1)}>
        <legend className="visually-hidden">{t.steps[1]}</legend>
        <div className="field full">
          <Select label={t.persons} name="persons" defaultValue={state.values?.persons} options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: t.personsN(n) }))} />
        </div>
        {options.length ? (
          <div className="field full">
            <Select label={t.room} name="room" defaultValue={state.values?.room} options={options.map((r) => ({ value: r, label: r }))} />
          </div>
        ) : null}
      </fieldset>

      <fieldset {...at(2)}>
        <legend className="visually-hidden">{t.steps[2]}</legend>
        <div className="field full">
          <label htmlFor="s-diet">{t.diet}</label>
          <input id="s-diet" name="diet" defaultValue={state.values?.diet} />
        </div>
        <div className="field full">
          <label htmlFor="s-message">{t.message}</label>
          <textarea id="s-message" name="message" defaultValue={state.values?.message} />
        </div>
      </fieldset>

      <fieldset {...at(3)}>
        <legend className="visually-hidden">{t.steps[3]}</legend>
        <div className="full">
          <h3 className="summary-title">{t.summary}</h3>
          <dl className="summary">
            {summary.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <label className="check full">
          <input type="checkbox" name="consent" defaultChecked={state.values?.consent === "on"} required />
          <span>
            {texts?.consent || t.consent}{" "}
            <Link href={href(lang, "privacy")} target="_blank">
              {getDictionary(lang).privacy.link}
            </Link>
          </span>
        </label>
      </fieldset>

      <Honeypot />
      {state.status === "invalid" || state.status === "error" ? (
        <p className="form-msg" role="alert">
          {t[state.status]}
        </p>
      ) : null}
      <div className="step-nav">
        {step > 0 ? (
          <button type="button" className="link" onClick={() => go(step - 1)}>
            ← {t.back}
          </button>
        ) : (
          <span />
        )}
        {last ? (
          <button className="btn" disabled={pending}>
            {pending ? t.sending : full ? t.waitlistSend : t.send}
          </button>
        ) : (
          <span className="step-next">
            <span className="hint">{t.enterHint}</span>
            <button type="button" className="btn" onClick={() => go(step + 1)}>
              {t.next} →
            </button>
          </span>
        )}
      </div>
    </form>
  );
}

/** Review of a past retreat (#review): moderated in Studio → Reviews before it shows on the site. */
export function ReviewForm({ lang, retreatId }: { lang: Lang; retreatId: string }) {
  const t = getDictionary(lang).review;
  const [state, action, pending] = useActionState(sendReview, idle);
  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {t.sent}
      </p>
    );
  const rating = state.values?.rating;
  return (
    <form className="form" style={{ marginTop: 28 }} action={action}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      <fieldset className="stars full">
        <legend className="select-label">{t.rating}</legend>
        {/* reversed in the DOM so "this star and the ones before it" light up with plain CSS */}
        <div className="stars-row">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} title={t.stars(n)}>
              <input type="radio" name="rating" value={n} defaultChecked={rating === String(n)} required />
              <span aria-hidden="true">★</span>
              <span className="visually-hidden">{t.stars(n)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="r-name">{t.name}</label>
        <input id="r-name" name="name" defaultValue={state.values?.name} required autoComplete="given-name" />
      </div>
      <div className="field">
        <label htmlFor="r-email">{t.email}</label>
        <input id="r-email" name="email" type="email" defaultValue={state.values?.email} required autoComplete="email" />
      </div>
      <div className="field full">
        <label htmlFor="r-text">{t.text}</label>
        <textarea id="r-text" name="text" defaultValue={state.values?.text} required maxLength={1200} placeholder={t.textPlaceholder} />
      </div>
      <label className="check full">
        <input type="checkbox" name="consent" defaultChecked={state.values?.consent === "on"} required />
        <span>
          {t.consent}{" "}
          <Link href={href(lang, "privacy")} target="_blank">
            {getDictionary(lang).privacy.link}
          </Link>
        </span>
      </label>
      <Honeypot />
      {state.status === "invalid" || state.status === "error" ? (
        <p className="form-msg full" role="alert">
          {t[state.status]}
        </p>
      ) : null}
      <div className="full">
        <button className="btn" disabled={pending}>
          {pending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
