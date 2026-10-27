/**
 * HTML version of every mail, in the Yoga, Zen & Tonic style (cream background, serif logo with
 * the ember ampersand, optional photo). Table layout + inline styles: what mail clients understand.
 * The plain-text version is sent alongside it.
 */
const C = {
  bg: "#F4F1EC",
  card: "#FFFFFF",
  ink: "#1A1917",
  soft: "#5E5A54",
  line: "#D8D2C8",
  ember: "#D4552B",
  dark: "#0F1A1D",
};
const SERIF = `Georgia, 'Times New Roman', serif`;
const SANS = `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Plain text → paragraphs (blank line) and line breaks; bare URLs and e-mail addresses become links. */
function paragraphs(text: string) {
  const link = (s: string) =>
    s.replace(
      /(https?:\/\/[^\s<]+)|([\w.+-]+@[\w-]+\.[\w.-]+)/g,
      (m, url) =>
        `<a href="${url ? m : `mailto:${m}`}" style="color:${C.ember}">${m}</a>`,
    );
  return text
    .trim()
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font:16px/1.6 ${SANS};color:${C.ink};overflow-wrap:anywhere;word-break:break-word">${link(esc(p)).replaceAll("\n", "<br>")}</p>`,
    )
    .join("");
}

/** Portable Text as the Studio stores it (simpleBlockContent: paragraphs, bullets, bold/italic, links). */
export type MailBlock = {
  _type: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: { _type: string; text?: string; marks?: string[] }[];
  markDefs?: { _key: string; _type: string; href?: string }[];
};

/** A small linked card, e.g. a retreat in a newsletter. */
export type MailCard = {
  title: string;
  meta?: string;
  url: string;
  photo?: string | null;
  /** A short text under the title. */
  text?: string;
  more?: string;
};

/** Rich text → mail HTML: paragraphs, bullet lists, bold/italic, links. */
function blocksHtml(blocks: MailBlock[], fill: (s: string) => string) {
  const P = `margin:0 0 16px;font:16px/1.6 ${SANS};color:${C.ink};overflow-wrap:anywhere;word-break:break-word`;
  const inline = (b: MailBlock) =>
    (b.children ?? [])
      .map((c) => {
        let h = esc(fill(c.text ?? "")).replaceAll("\n", "<br>");
        for (const m of c.marks ?? []) {
          if (m === "strong") h = `<strong>${h}</strong>`;
          else if (m === "em") h = `<em>${h}</em>`;
          else {
            const href = b.markDefs?.find((d) => d._key === m)?.href;
            if (href)
              h = `<a href="${esc(href)}" style="color:${C.ember}">${h}</a>`;
          }
        }
        return h;
      })
      .join("");
  let out = "";
  let list = "";
  for (const b of blocks.filter((x) => x._type === "block")) {
    if (b.listItem) {
      list += `<li style="margin:0 0 6px">${inline(b)}</li>`;
      continue;
    }
    if (list)
      ((out += `<ul style="${P};padding-left:22px">${list}</ul>`), (list = ""));
    out += `<p style="${P}">${inline(b)}</p>`;
  }
  if (list) out += `<ul style="${P};padding-left:22px">${list}</ul>`;
  return out;
}

/** Rich text → plain text (links as “text (url)”), for the text version of the mail. */
export function blocksText(
  blocks: MailBlock[],
  fill: (s: string) => string = (s) => s,
) {
  return blocks
    .filter((b) => b._type === "block")
    .map((b) => {
      const t = (b.children ?? [])
        .map((c) => {
          const href = c.marks
            ?.map((m) => b.markDefs?.find((d) => d._key === m)?.href)
            .find(Boolean);
          const text = fill(c.text ?? "");
          return href && href !== text ? `${text} (${href})` : text;
        })
        .join("");
      return b.listItem ? `• ${t}` : t;
    })
    .join("\n\n")
    .replace(/(• [^\n]*)\n\n(?=• )/g, "$1\n");
}

/** One block under the text of a mail. */
export type MailSection = { card: MailCard } | { button: { label: string; url: string } } | { blocks: MailBlock[] };

export type MailContent = {
  text: string;
  /** Rich text instead of `text` in the HTML version (`text` stays the plain-text version). */
  blocks?: MailBlock[];
  /** Applied to the text in `blocks`, e.g. {naam} → the name. */
  fill?: (s: string) => string;
  /** Big button under the text. */
  button?: { label: string; url: string } | null;
  /** Linked cards under the text (photo, title, one line). */
  cards?: MailCard[];
  /** Blocks under the text, in this order (a newsletter): cards, buttons, extra text. Before `cards`/`button`. */
  sections?: MailSection[];
  /** Small unsubscribe link at the very bottom. */
  unsubscribe?: { label: string; url: string } | null;
  /** Big serif title above the text. */
  heading?: string;
  /** Absolute image URL (e.g. the retreat's card photo), shown full-width on top. */
  photo?: string | null;
  /** Label/value rows (a sign-up's answers), shown as a small table under the text. */
  rows?: [string, string][];
  /** Small line at the bottom, e.g. "Bekijk in de Studio → Inschrijvingen". */
  footnote?: string;
};

export function mailHtml({
  text,
  heading,
  photo,
  rows,
  footnote,
  blocks,
  fill,
  button,
  cards,
  sections,
  unsubscribe,
}: MailContent) {
  const btnHtml = (button: { label: string; url: string } | null | undefined) =>
    button?.url && button.label
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:${C.dark};border-radius:999px"><a href="${esc(button.url)}" style="display:inline-block;padding:14px 28px;font:600 15px/1 ${SANS};color:#FFFFFF;text-decoration:none">${esc(button.label)}</a></td></tr></table>`
      : "";
  const btn = btnHtml(button);
  const cardHtml = (c: MailCard) =>
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid ${C.line}">${
              // photo on top, full width, cropped 2:1: always fills its box, in every mail app (no side-by-side cell to stretch)
              c.photo
                ? `<tr><td><a href="${esc(c.url)}"><img src="${esc(c.photo)}?w=1072&h=536&fit=crop&auto=format" width="536" alt="" style="display:block;width:100%;height:auto;border:0"></a></td></tr>`
                : ""
            }<tr><td style="padding:16px 18px 18px"><a href="${esc(c.url)}" style="font:400 20px/1.25 ${SERIF};color:${C.ink};text-decoration:none">${esc(c.title)}</a>${
              c.meta
                ? `<div style="margin-top:6px;font:13px/1.4 ${SANS};color:${C.soft}">${esc(c.meta)}</div>`
                : ""
            }${c.text ? `<div style="margin-top:8px;font:15px/1.5 ${SANS};color:${C.ink}">${esc(c.text)}</div>` : ""}${c.more ? `<div style="margin-top:10px"><a href="${esc(c.url)}" style="font:600 13px/1 ${SANS};color:${C.ember};text-decoration:none">${esc(c.more)} →</a></div>` : ""}</td></tr></table>`;
  const cardList = (cards ?? []).map(cardHtml).join("");
  const sectionList = (sections ?? [])
    .map((s) => ("card" in s ? cardHtml(s.card) : "button" in s ? btnHtml(s.button) : blocksHtml(s.blocks, fill ?? ((x) => x))))
    .join("");
  const img = photo
    ? `<tr><td><img src="${esc(photo)}?w=1200&h=600&fit=crop&auto=format" width="600" alt="" style="display:block;width:100%;height:auto;border:0"></td></tr>`
    : "";
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
${blocks?.length ? blocksHtml(blocks, fill ?? ((x) => x)) : paragraphs(text)}
${sectionList}
${cardList}
${btn}
${table}
</td></tr></table></td></tr>
<tr><td style="padding:20px 4px;font:12px/1.5 ${SANS};color:${C.soft}">${footnote ? `${esc(footnote)}<br>` : ""}<a href="https://yogazentonic.com" style="color:${C.soft}">yogazentonic.com</a>${unsubscribe ? ` · <a href="${esc(unsubscribe.url)}" style="color:${C.soft}">${esc(unsubscribe.label)}</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

/** The plain-text twin: text + rows as "Label: value" lines. */
export function mailText({
  text,
  rows,
  footnote,
  button,
  cards,
  sections,
  fill,
  unsubscribe,
}: MailContent) {
  const card = (c: MailCard) => [c.title, c.meta, c.text, c.url].filter(Boolean).join("\n");
  return [
    text.trim(),
    ...(sections ?? []).map((s) =>
      "card" in s ? card(s.card) : "button" in s ? `${s.button.label}: ${s.button.url}` : blocksText(s.blocks, fill),
    ),
    button?.url && button.label ? `${button.label}: ${button.url}` : "",
    cards?.length
      ? cards
          .map(card)
          .join("\n\n")
      : "",
    unsubscribe ? `${unsubscribe.label}: ${unsubscribe.url}` : "",
    rows?.length ? rows.map(([k, v]) => `${k}: ${v || "-"}`).join("\n") : "",
    footnote ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
