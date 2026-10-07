"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, signup, subscribe, type FormState } from "@/app/actions/forms";
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

/** Retreat sign-up (retreat page, #inschrijven): stored in Sanity → Inschrijvingen. */
export function SignupForm({ lang, retreatId, rooms, texts }: { lang: Lang; retreatId: string; rooms: string[]; texts?: Texts }) {
  const t = getDictionary(lang).signup;
  const [state, action, pending] = useActionState(signup, idle);
  if (state.status === "sent")
    return (
      <p className="form-done" role="status">
        {texts?.thanks || t.sent}
      </p>
    );
  const options = rooms.filter(Boolean);
  return (
    <form className="form" style={{ marginTop: 32 }} action={action}>
      <input type="hidden" name="retreat" value={retreatId} />
      <input type="hidden" name="lang" value={lang} />
      <div className="field">
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
      <div className="field">
        <Select label={t.persons} name="persons" defaultValue={state.values?.persons} options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: t.personsN(n) }))} />
      </div>
      {options.length ? (
        <div className="field full">
          <Select label={t.room} name="room" defaultValue={state.values?.room} options={options.map((r) => ({ value: r, label: r }))} />
        </div>
      ) : null}
      <div className="field full">
        <label htmlFor="s-diet">{t.diet}</label>
        <input id="s-diet" name="diet" defaultValue={state.values?.diet} />
      </div>
      <div className="field full">
        <label htmlFor="s-message">{t.message}</label>
        <textarea id="s-message" name="message" defaultValue={state.values?.message} />
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
