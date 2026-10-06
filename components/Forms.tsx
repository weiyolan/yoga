"use client";

import { useActionState } from "react";
import { sendContact, signup, subscribe, type FormState } from "@/app/actions/forms";
import { getDictionary } from "@/lib/dictionary";
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

export function NewsletterForm({ lang }: { lang: Lang }) {
  const t = getDictionary(lang).footer;
  const [state, action, pending] = useActionState(subscribe, idle);
  if (state.status === "sent") return <p className="sub-done" role="status">{t.subscribed}</p>;
  return (
    <form className="sub" action={action}>
      <label className="visually-hidden" htmlFor="sub-email">{t.emailPlaceholder}</label>
      <input id="sub-email" name="email" type="email" required placeholder={t.emailPlaceholder} autoComplete="email" aria-invalid={state.status === "invalid" || undefined} />
      <Honeypot />
      <button className="btn sm white" disabled={pending}>{t.subscribe}</button>
      {state.status === "error" || state.status === "invalid" ? <p className="form-msg" role="alert">{getDictionary(lang).contact[state.status === "error" ? "error" : "invalid"]}</p> : null}
    </form>
  );
}

export function ContactForm({ lang, subjects, notifyLabel }: { lang: Lang; subjects: string[]; notifyLabel: string | null }) {
  const t = getDictionary(lang).contact;
  const [state, action, pending] = useActionState(sendContact, idle);
  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {t.sent}
      </p>
    );
  const options = subjects.filter(Boolean);
  return (
    <form className="form" style={{ marginTop: 32 }} action={action}>
      <div className="field">
        <label htmlFor="c-name">{t.name}</label>
        <input id="c-name" name="name" required placeholder={t.namePlaceholder} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="c-email">{t.email}</label>
        <input id="c-email" name="email" type="email" required placeholder={t.emailPlaceholder} autoComplete="email" />
      </div>
      <div className="field full">
        {options.length ? (
          <Select label={t.subject} name="subject" options={options.map((s) => ({ value: s, label: s }))} />
        ) : (
          <>
            <label htmlFor="c-subject">{t.subject}</label>
            <input id="c-subject" name="subject" />
          </>
        )}
      </div>
      <div className="field full">
        <label htmlFor="c-message">{t.message}</label>
        <textarea id="c-message" name="message" required placeholder={t.messagePlaceholder} />
      </div>
      {notifyLabel ? (
        <label className="check full">
          <input type="checkbox" name="notify" defaultChecked /> {notifyLabel}
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

/** Retreat sign-up (retreat page, #inschrijven): stored in Sanity → Inschrijvingen. */
export function SignupForm({ lang, retreatId, rooms }: { lang: Lang; retreatId: string; rooms: string[] }) {
  const t = getDictionary(lang).signup;
  const [state, action, pending] = useActionState(signup, idle);
  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {t.sent}
      </p>
    );
  const options = rooms.filter(Boolean);
  return (
    <form className="form" style={{ marginTop: 32 }} action={action}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      <div className="field">
        <label htmlFor="s-name">{t.name}</label>
        <input id="s-name" name="name" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="s-email">{t.email}</label>
        <input id="s-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="s-phone">{t.phone}</label>
        <input id="s-phone" name="phone" type="tel" autoComplete="tel" />
      </div>
      <div className="field">
        <Select label={t.persons} name="persons" options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: t.personsN(n) }))} />
      </div>
      {options.length ? (
        <div className="field full">
          <Select label={t.room} name="room" options={options.map((r) => ({ value: r, label: r }))} />
        </div>
      ) : null}
      <div className="field full">
        <label htmlFor="s-diet">{t.diet}</label>
        <input id="s-diet" name="diet" />
      </div>
      <div className="field full">
        <label htmlFor="s-message">{t.message}</label>
        <textarea id="s-message" name="message" />
      </div>
      <label className="check full">
        <input type="checkbox" name="consent" required /> {t.consent}
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
