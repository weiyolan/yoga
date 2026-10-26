/**
 * HTML version of every mail, in the Yoga, Zen & Tonic style (cream background, serif logo with
 * the ember ampersand, optional photo). Table layout + inline styles: what mail clients understand.
 * The plain-text version is sent alongside it.
 */
const C = { bg: "#F4F1EC", card: "#FFFFFF", ink: "#1A1917", soft: "#5E5A54", line: "#D8D2C8", ember: "#D4552B", dark: "#0F1A1D" };
const SERIF = `Georgia, 'Times New Roman', serif`;
const SANS = `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;

const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Plain text → paragraphs (blank line) and line breaks; bare URLs and e-mail addresses become links. */
function paragraphs(text: string) {
  const link = (s: string) =>
    s.replace(/(https?:\/\/[^\s<]+)|([\w.+-]+@[\w-]+\.[\w.-]+)/g, (m, url) => `<a href="${url ? m : `mailto:${m}`}" style="color:${C.ember}">${m}</a>`);
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font:16px/1.6 ${SANS};color:${C.ink};overflow-wrap:anywhere;word-break:break-word">${link(esc(p)).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

export type MailContent = {
  text: string;
  /** Big serif title above the text. */
  heading?: string;
  /** Absolute image URL (e.g. the retreat's card photo), shown full-width on top. */
  photo?: string | null;
  /** Label/value rows (a sign-up's answers), shown as a small table under the text. */
  rows?: [string, string][];
  /** Small line at the bottom, e.g. "Bekijk in de Studio → Inschrijvingen". */
  footnote?: string;
};

export function mailHtml({ text, heading, photo, rows, footnote }: MailContent) {
  const img = photo ? `<tr><td><img src="${esc(photo)}?w=1200&h=600&fit=crop&auto=format" width="600" alt="" style="display:block;width:100%;height:auto;border:0"></td></tr>` : "";
  const table = rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;border-top:1px solid ${C.line}">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${C.line};font:600 11px/1.4 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:${C.soft};vertical-align:top;width:38%">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${C.line};font:15px/1.5 ${SANS};color:${C.ink};vertical-align:top">${esc(v || "-").replaceAll("\n", "<br>")}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 0 20px;font:26px/1 ${SERIF};color:${C.ink}">Yoga, Zen <em style="color:${C.ember}">&amp;</em> Tonic</td></tr>
<tr><td style="background:${C.card}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${img}
<tr><td style="padding:32px 32px 16px">
${heading ? `<h1 style="margin:0 0 20px;font:400 30px/1.2 ${SERIF};color:${C.ink}">${esc(heading)}</h1>` : ""}
${paragraphs(text)}
${table}
</td></tr></table></td></tr>
<tr><td style="padding:20px 4px;font:12px/1.5 ${SANS};color:${C.soft}">${footnote ? `${esc(footnote)}<br>` : ""}<a href="https://yogazentonic.com" style="color:${C.soft}">yogazentonic.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

/** The plain-text twin: text + rows as "Label: value" lines. */
export function mailText({ text, rows, footnote }: MailContent) {
  return [text.trim(), rows?.length ? rows.map(([k, v]) => `${k}: ${v || "-"}`).join("\n") : "", footnote ?? ""].filter(Boolean).join("\n\n");
}
