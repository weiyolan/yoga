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

/**
 * On Netlify without a mail provider, the server hands back the team notification and the browser
 * posts it to Netlify Forms (form “melding” in public/__forms.html), which mails it to Rita & Philippe.
 * Once per submission; a failure here never shows: the submission itself is already stored.
 */
function useNotify(state: FormState) {
  const posted = useRef<FormState["notify"]>(undefined);
  useEffect(() => {
    const n = state.notify;
    if (!n || posted.current === n) return;
    posted.current = n;
    fetch("/__forms.html", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "form-name": "melding", ...n }).toString(),
    }).catch(() => {});
  }, [state.notify]);
}

/** Editable texts from Studio (Formulieren → Inschrijving, Contact, Menu & footer) (empty = the dictionary default). */
type Texts = { thanks?: string | null; consent?: string | null };

export function NewsletterForm({ lang, thanks }: { lang: Lang; thanks?: string | null }) {
  const t = getDictionary(lang).footer;
  const [state, action, pending] = useActionState(subscribe, idle);
  useNotify(state);
  if (state.status === "sent") return <p className="sub-done" role="status">{thanks || t.subscribed}</p>;
  return (
    <form className="sub" action={action}>
      <label className="visually-hidden" htmlFor="sub-name">{t.firstName}</label>
      <input id="sub-name" name="name" type="text" defaultValue={state.values?.name} placeholder={t.firstName} autoComplete="given-name" maxLength={60} className="sub-name" />
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
  useNotify(state);
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

export type SignupFormDef = {
  phone: boolean | null;
  room: boolean | null;
  diet: boolean | null;
  message: boolean | null;
  questions: { _key: string; label: string | null; help: string | null; type: string | null; options: string[] | null; required: boolean | null }[] | null;
} | null;

type StepKey = "about" | "retreat" | "wishes" | "confirm";

/**
 * Retreat sign-up (its own page: /retreats/<slug>/inschrijven): stored in Sanity → Inschrijvingen.
 * Always one person. Which standard fields show and the extra questions come from the retreat's
 * sign-up form (Studio → Inschrijfformulieren). One question group at a time (Typeform-like) with a
 * progress bar; every step stays in the DOM, so the whole form is posted at once and refilled after a
 * failed submit. `full`: waiting list.
 */
export function SignupForm({ lang, retreatId, rooms, form, texts, full = false }: { lang: Lang; retreatId: string; rooms: string[]; form: SignupFormDef; texts?: Texts & { terms?: string | null }; full?: boolean }) {
  const t = getDictionary(lang).signup;
  const [state, action, pending] = useActionState(signup, idle);
  useNotify(state);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [summary, setSummary] = useState<[string, string][]>([]);
  const formEl = useRef<HTMLFormElement>(null);
  const moved = useRef(false);

  const roomOptions = form?.room === false ? [] : rooms.filter(Boolean);
  const questions = (form?.questions ?? []).filter((q) => q.label);
  const askPhone = form?.phone !== false;
  const askDiet = form?.diet !== false;
  const askMessage = form?.message !== false;
  const steps: StepKey[] = ["about", ...(roomOptions.length || questions.length ? ["retreat" as const] : []), ...(askDiet || askMessage ? ["wishes" as const] : []), "confirm"];
  const stepOf = (k: StepKey) => steps.indexOf(k);

  // Server said "invalid": go back to the first step with a missing or wrong answer.
  useEffect(() => {
    if (state.status !== "invalid") return;
    const v = state.values ?? {};
    const missing = questions.some((q) => q.required && !v[`q.${q._key}`]?.trim());
    const bad: StepKey = !v.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email ?? "") ? "about" : missing ? "retreat" : "confirm";
    setStep(Math.max(stepOf(bad), 0));
  }, [state]);

  // Focus the first field of a new step (not on page load).
  useEffect(() => {
    if (!moved.current) return;
    formEl.current?.querySelector<HTMLElement>(`[data-step="${step}"] :is(input:not([type=hidden]), textarea, button[role=combobox], [role=combobox])`)?.focus({ preventScroll: true });
  }, [step]);

  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {full ? t.waitlistSent : texts?.thanks || t.sent}
      </p>
    );

  const total = steps.length;
  const last = step === total - 1;
  const answer = (data: FormData, q: (typeof questions)[number]) => {
    const v = String(data.get(`q.${q._key}`) ?? "");
    if (q.type === "yesno") return v === "yes" ? t.yes : v === "no" ? t.no : "";
    if (q.type === "choice") return v ? (q.options ?? []).filter(Boolean)[Number(v)] ?? "" : "";
    return v;
  };

  const go = (to: number) => {
    const el = formEl.current;
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
        [t.room, roomOptions.length ? String(data.get("room") ?? "") : ""],
        ...questions.map((q) => [q.label ?? "", answer(data, q)] as [string, string]),
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

  const at = (k: StepKey) => {
    const n = stepOf(k);
    return { "data-step": n, hidden: step !== n, className: `form step${step === n ? " on" : ""}` };
  };
  const v = state.values ?? {};
  const legalLink = (route: "terms" | "cancellation") => (
    <Link href={href(lang, route)} target="_blank">
      {getDictionary(lang).legal.titles[route].toLowerCase()}
    </Link>
  );

  return (
    <form className="stepper" style={{ marginTop: 32 }} action={action} ref={formEl} onKeyDown={onKeyDown} data-dir={dir}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      {full ? <p className="form-note">{t.waitlist}</p> : null}

      <div className="progress" aria-hidden="true">
        <span style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <p className="progress-label" aria-live="polite">
        <b>{t.step(step + 1, total)}</b> · {t.steps[steps[step]]}
      </p>

      <fieldset {...at("about")}>
        <legend className="visually-hidden">{t.steps.about}</legend>
        <div className="field full">
          <label htmlFor="s-name">{t.name}</label>
          <input id="s-name" name="name" defaultValue={v.name} required autoComplete="name" />
        </div>
        <div className={`field${askPhone ? "" : " full"}`}>
          <label htmlFor="s-email">{t.email}</label>
          <input id="s-email" name="email" type="email" defaultValue={v.email} required autoComplete="email" />
        </div>
        {askPhone ? (
          <div className="field">
            <label htmlFor="s-phone">{t.phone}</label>
            <input id="s-phone" name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" />
          </div>
        ) : null}
      </fieldset>

      {stepOf("retreat") >= 0 ? (
        <fieldset {...at("retreat")}>
          <legend className="visually-hidden">{t.steps.retreat}</legend>
          {roomOptions.length ? (
            <div className="field full">
              <Select label={t.room} name="room" defaultValue={v.room} options={roomOptions.map((r) => ({ value: r, label: r }))} />
            </div>
          ) : null}
          {questions.map((q) => {
            const name = `q.${q._key}`;
            const id = `s-q-${q._key}`;
            const help = q.help ? (
              <small className="muted" id={`${id}-help`}>
                {q.help}
              </small>
            ) : null;
            const label = `${q.label}${q.required ? " *" : ""}`;
            if (q.type === "yesno" || q.type === "choice") {
              const opts = q.type === "yesno" ? [["yes", t.yes], ["no", t.no]] : (q.options ?? []).filter(Boolean).map((o, i) => [String(i), o]);
              return (
                <fieldset key={q._key} className="field full choices" aria-describedby={q.help ? `${id}-help` : undefined}>
                  <legend className="select-label">{label}</legend>
                  {help}
                  <div className="row">
                    {opts.map(([value, text]) => (
                      <label key={value} className="check">
                        <input type="radio" name={name} value={value} defaultChecked={v[name] === value} required={!!q.required} /> {text}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            }
            return (
              <div key={q._key} className="field full">
                <label htmlFor={id}>{label}</label>
                {q.type === "textarea" ? (
                  <textarea id={id} name={name} defaultValue={v[name]} required={!!q.required} aria-describedby={q.help ? `${id}-help` : undefined} />
                ) : (
                  <input id={id} name={name} defaultValue={v[name]} required={!!q.required} aria-describedby={q.help ? `${id}-help` : undefined} />
                )}
                {help}
              </div>
            );
          })}
        </fieldset>
      ) : null}

      {stepOf("wishes") >= 0 ? (
        <fieldset {...at("wishes")}>
          <legend className="visually-hidden">{t.steps.wishes}</legend>
          {askDiet ? (
            <div className="field full">
              <label htmlFor="s-diet">{t.diet}</label>
              <input id="s-diet" name="diet" defaultValue={v.diet} />
            </div>
          ) : null}
          {askMessage ? (
            <div className="field full">
              <label htmlFor="s-message">{t.message}</label>
              <textarea id="s-message" name="message" defaultValue={v.message} />
            </div>
          ) : null}
        </fieldset>
      ) : null}

      <fieldset {...at("confirm")}>
        <legend className="visually-hidden">{t.steps.confirm}</legend>
        <div className="full">
          <h3 className="summary-title">{t.summary}</h3>
          <dl className="summary">
            {summary.map(([k, val]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </div>
        <label className="check full">
          <input type="checkbox" name="terms" defaultChecked={v.terms === "on"} required />
          <span>
            {texts?.terms || t.terms} ({legalLink("terms")} {t.and} {legalLink("cancellation")})
          </span>
        </label>
        <label className="check full">
          <input type="checkbox" name="consent" defaultChecked={v.consent === "on"} required />
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

/** Review of a past retreat (/retreats/<slug>/review): moderated in Studio → Reviews before it shows on the site. */
export function ReviewForm({ lang, retreatId }: { lang: Lang; retreatId: string }) {
  const t = getDictionary(lang).review;
  const [state, action, pending] = useActionState(sendReview, idle);
  useNotify(state);
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
