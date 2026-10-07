import "server-only";

/**
 * Gemini (Google AI Studio key) for the Studio's AI helpers: alt texts and NL → EN translations.
 * GEMINI_API_KEY on the server only; GEMINI_MODEL overrides the default Flash model.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const ENDPOINT = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

export const geminiConfigured = () => !!process.env.GEMINI_API_KEY;

/** One request with a JSON schema response; returns the parsed JSON. */
export async function geminiJson<T>(parts: Part[], schema: object, system: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const res = await fetch(ENDPOINT(MODEL), {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return JSON.parse(text) as T;
}

const VOICE = `You write for Yoga, Zen & Tonic, a small Belgian yoga and retreat brand run by Rita & Philippe
(retreats in nature, yoga classes, freediving, private coaching). Tone: warm, calm, personal, never salesy.
Dutch is Flemish/Belgian Dutch with informal "je"; English is British English.`;

/** Alt text + short title for a photo, in Dutch and English. */
export function altText(image: { mime: string; base64: string }, context?: string) {
  const s = { type: "object", properties: { nl: { type: "string" }, en: { type: "string" } }, required: ["nl", "en"] };
  return geminiJson<{ alt: { nl: string; en: string }; title: { nl: string; en: string } }>(
    [
      { inline_data: { mime_type: image.mime, data: image.base64 } },
      {
        text: `Describe this photo for the website.
- alt: what a screen-reader user needs to know, max 125 characters, no "photo of" / "foto van", no trailing period.
- title: a short caption of 2–6 words.
${context ? `Context (place, retreat): ${context}` : ""}`,
      },
    ],
    { type: "object", properties: { alt: s, title: s }, required: ["alt", "title"] },
    `${VOICE}\nYou write image alt texts and captions. Be concrete and factual about what is visible.`,
  );
}

/** Translates a flat map of texts; keys are kept, line breaks and placeholders like {naam} too. */
export async function translate(texts: Record<string, string>, from: string, to: string) {
  const entries = Object.entries(texts).filter(([, v]) => v.trim());
  if (!entries.length) return {};
  const items = await geminiJson<{ key: string; text: string }[]>(
    [{ text: `Translate every "text" from ${from} to ${to}. Keep each "key" unchanged.\n\n${JSON.stringify(entries.map(([key, text]) => ({ key, text })))}` }],
    { type: "array", items: { type: "object", properties: { key: { type: "string" }, text: { type: "string" } }, required: ["key", "text"] } },
    `${VOICE}\nYou translate website copy. Keep the meaning, length and tone; keep line breaks, emoji, names, place names and placeholders in curly braces as they are. Leading/trailing spaces must be preserved.`,
  );
  return Object.fromEntries(items.filter((i) => i.key in texts).map((i) => [i.key, i.text]));
}
