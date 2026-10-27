# Sanity Studio UX: best practices

What we changed compared with the classic Sanity Studio UI, why, and the pitfalls we ran into.
The editors (Rita & Philippe) are not technical and often edit on a phone. Every rule below
comes from something that confused them or took too much room.

Code references are relative to `studio/`.

---

## 1. Principles

1. **Explain where the value goes.** Every field says where it appears on the site (or in which
   mail, or "intern") and what it's for. Not "Titel", but "the big title on the card and in Google".
2. **Help on demand, not in the way.** Help texts sit behind a small ⓘ after the title, so long
   explanations cost no space.
3. **Dense but readable.** Short fields take one row (title left, input right). Long texts, lists and
   groups keep the full width.
4. **Keep Sanity's own behaviour.** Restyle Sanity's default field (`renderDefault`) rather than
   rebuilding it, so comments, the "…" menu, validation and change bars keep working.
5. **Fewer clicks in the navigation.** Put things one level higher when a sub-list only holds one or
   two items.
6. **Follow the page.** Tabs and overviews follow the order of the page on the site, top to bottom.
7. **No red for "not done yet".** Empty is not an error: in progress = blue, done = green. Red is for
   real validation errors.
8. **Dutch, plain, with examples** (“bv. …”) and the fallback when empty (“Leeg = …”).

---

## 2. Navigation (structure)

| Classic | Ours | Where |
|---|---|---|
| Type list → sub-list → documents (3 panels) | One panel with the page singleton on top + the documents under a divider | `structure/index.ts` (Formulieren), `components/RetreatList.tsx` (Retreats) |
| Separate lists for upcoming / past | One list with filter chips (Komend / Voorbij / Alle) | `RetreatList.tsx` |
| Component panes fill the whole width | `S.component(...).maxWidth(400)` for list-like components | `structure/index.ts` |
| Generic "+" offers everything | `newDocumentOptions` / `schema.templates` filter out singletons, submissions and fixed docs | `sanity.config.ts` |
| Pink initials as workspace icon | The site icon as `icon` in `defineConfig` | `components/StudioLogo.tsx` |

**A live mixed list (static items + documents).** A child can return an Observable:

```ts
.child(() => {
  const client = S.context.getClient({ apiVersion });
  return client
    .listen(query, {}, { visibility: "query", includeResult: false, events: ["welcome", "mutation"] })
    .pipe(debounceTime(300), switchMap(() => client.fetch(query, {}, { perspective: "drafts" })),
      map((docs) => S.list().items([singleton(...), S.divider(), ...docs.map(...)])));
})
```

- Deduplicate drafts (`drafts.` prefix) and published documents by their published id.
- Add a "+" via `.menuItems([S.menuItem().intent({ type: "create", params: { type } })])`.
- `S.context` has no `documentStore`: use `getClient`.
- Add `rxjs` to the Studio's own dependencies.

**Singletons:** a fixed `documentId`, no duplicate/delete actions, and kept out of "new document".

---

## 3. Fields

### 3.1 Help behind a ⓘ (every field)
- Where: `components/InlineFields.tsx` (`Help`), wired in `components/I18nTabs.tsx` (`I18nTabsField` = `form.components.field`).
- How: render the field with `renderDefault({ ...props, description: undefined, title: <>{title}<Help text={description}/></> })`.
- Behaviour: opens on hover (desktop) and on tap (phone); a tap elsewhere closes it (a `pointerdown` listener on `document`).
- The tooltip: `Popover` from `@sanity/ui/popover`, with a max width of about 320px set on an inner div (setting it on the Popover itself is ignored).
- Every field has a description that answers two questions: **where on the site** and **what for**. Keep examples and "Leeg = …" in it.

### 3.2 One-row fields
- **Which fields:** short ones only: `string`, `number`, `url`, `date`, `slug`, `reference`, and one-line NL | EN.
- **Not:** `text`, booleans, option lists, arrays, objects, or fields with their own `components.input`. The exception is the NL | EN plugin's own input, which is allowed.
- **Layout:** a CSS grid on Sanity's own field markup: `title+ⓘ | input | "…"`. The header is unwrapped with `display: contents`.
  - The "…" card is `position: absolute` by default. Make it `position: static` or it floats away.
  - Use `align-items: center` and a narrow title column (`minmax(80px, 26%)`).
  - A container query (`< 300px`) stacks the title above the input again.
  - A negative `margin-block` pulls the rows together, because the form puts 32px between fields.
- **NL | EN fields:** the language tabs and the ✨ translate button move right of the input (the title column is too narrow). They are passed via React context from the field to the input component.
- **Switch it off** for part of a form with `<InlineFields.Provider value={false}>`.

### 3.3 Languages (sanity-plugin-internationalized-array)
- Show one language at a time with small NL | EN tabs. A dot on a tab means empty; red or amber means an error or warning in that language.
- Hide the other languages with `display: none`, never by leaving them out of `members`. Leaving them out broke the add and translate actions.
- One "Vertaal" (✨) button per field, plus a bulk translator.
- **Previews:** never select an i18n field raw as `title`. It is an array, so Sanity logs *“The "title" field should be a string…”*. Use `pick(value)` in `prepare`.
  - This also applies to Presentation `defineLocations` selects. We removed `locations` entirely: the "Gebruikt op x pagina's" banner only took room.

### 3.4 Better inputs for common patterns
| Pattern | Input | Where |
|---|---|---|
| Object of on/off options | One compact list of switches (title + ⓘ) instead of a box per toggle (`options.columns` made ragged boxes) | `FormBuilder.tsx` → `ToggleListInput` |
| Choosing a type | Tiles with an icon and a one-line explanation | `QuestionTypeInput` |
| “Show only if …” | Checkboxes of the previous question's answers instead of free text | `ShowIfInput` |
| Status | Radio buttons that also update the derived counts | `StatusInput.tsx` |
| Photo | A picker from the Fotobank (reuse + reset/delete) | `PhotoPicker.tsx`, `MediaBank.tsx` |

**Unset vs default.** For booleans, show `value ?? initialValue`, exactly as the site reads it (`coalesce(x, true)`). Otherwise an untouched toggle looks off while the site treats it as on.

---

## 4. Documents

### 4.1 Large documents (a retreat)
- **Groups:**
  - Groups in page order, each with an icon.
  - `default: true` on the first one, so the document doesn't open on "Alle velden".
- **Overview on top:** a custom root input (`components.input` on the document type) shows:
  - a progress bar;
  - the page from top to bottom, one tile per group: where it shows on the site, x/y filled, what is still empty, and how many texts have no EN;
  - clicking a tile calls `props.onFieldGroupSelect(group)`;
  - collapsible, with the choice stored in `localStorage`; collapsed, it explains only the open tab.
  - Where: `components/RetreatOverview.tsx`.
  - Optional groups (sign-up overrides, SEO) show "standaard" or "aangepast" and don't count toward the progress.
- **Fieldsets** ("Wanneer", "Waar", "Plaatsen & prijs") for grouping. Drop `columns` once fields are one row.
- **Derived values** are `readOnly` (e.g. `booked`). Add a manual correction field next to them (`bookedExtra`) and sum the two in GROQ, instead of letting people overwrite the derived number.

### 4.2 Flexible content
- Replace fixed fields ("retreats + one button") with an ordered array of block types, for example retreat/lesstijl reference cards, an own card, a button and extra text (newsletter "Onder de tekst").
- Give each block type a preview with an icon and a subtitle that says what it is.
- **Migration path:**
  1. Keep the old fields with `deprecated: { reason }` and `hidden: ({ value }) => !value`.
  2. Keep rendering them as a fallback.
  3. Ship a `content:vN` script that moves the data.

### 4.3 Mails
- Show the HTML preview as an inspector next to the form, in the language picked in the preview.
- Add a "test mail to yourself" button and a step indicator (write → test → publish → send).
- Mail texts are editable documents with defaults taken from the site dictionary (templates), so the Studio opens prefilled.

### 4.4 Submissions (sign-ups, messages, reviews)
- A "Nieuw" badge and count badges in the navigation.
- No "duplicate" action, because a copy would get a public id.
- A table view with one column per question, so the same question across forms fills the same column. Export it as CSV.

---

## 5. Pitfalls in @sanity/ui and the Studio (versions in this repo)

| Pitfall | Fix |
|---|---|
| `Stack space={n}` → type error | This version uses `gap` |
| `Popover` not in `@sanity/ui` | `import { Popover } from "@sanity/ui/popover"`; it has no `onClickOutside`, so use your own listener |
| Icons inside `<Text>` scale with the text size | Set the size on the icon itself: `style={{ fontSize: 15, width: "1em", height: "1em" }}` |
| `all: "unset"` on a button removes your margin | Reset only what you need (`appearance`, `background`, `border`, `font`) and use padding for the gap |
| A colour set on a wrapper of an icon inside `Text` is ignored | Set `style.color` on the icon itself |
| `Card selected` turns the whole card blue and hides coloured text | Use a coloured border for "active" instead |
| The field "…" menu jumps to the bottom after a layout change | It is `position: absolute` inside the header; set `position: static` |
| Every field gets `components.input` from the i18n plugin | Don't treat "has a custom input" as "custom UI" for `internationalizedArray*` |
| `options.columns` on objects of booleans gives ragged boxes | Use a custom list input |
| `ObjectInputProps.onFieldGroupSelect` | Takes only `(groupName)` |
| Typegen | `npm run typegen` after schema or query changes; GROQ with an interpolated `${CONST}` is fine |

---

## 6. Verifying without Sanity access

- Build the site with the offline fixture: `npm run fixture`, then `SANITY_FIXTURE=1 npm run build && npm start`. The embedded Studio lives at `/studio`.
- Drive the embedded Studio with Playwright and mock `*.sanity.io`:
  - answer `/data/query` with groq-js over the fixture;
  - answer `/data/doc`, `/users/me`, the ACL/grants endpoints and `/data/listen` (a welcome event).
- Screenshot at desktop width and at 412px. A phone is where most layout bugs show.
- Before reading the Studio console: preview warnings print the schema type and the offending `select` (search for "Check the preview config").
