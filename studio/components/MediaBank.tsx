import { AddIcon } from "@sanity/icons/Add";
import { CloseIcon } from "@sanity/icons/Close";
import { EditIcon } from "@sanity/icons/Edit";
import { RevertIcon } from "@sanity/icons/Revert";
import { SearchIcon } from "@sanity/icons/Search";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import { TrashIcon } from "@sanity/icons/Trash";
import { UploadIcon } from "@sanity/icons/Upload";
import { UsersIcon } from "@sanity/icons/Users";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { randomKey } from "@sanity/util/content";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { usePaneRouter } from "sanity/structure";
import { apiVersion } from "../../sanity/site.config";
import { ai, imageUrl } from "../lib/ai";
import { MEDIA_CATEGORIES } from "../schemaTypes/documents/media-item";

type Alt = { _key: string; _type?: string; language: string; value?: string }[];
type Item = {
  _id: string;
  _createdAt: string;
  ref?: string;
  url?: string;
  file?: string;
  w?: number;
  h?: number;
  alt?: Alt;
  categories?: string[];
  showInGallery?: boolean;
  highlight?: boolean;
  photographer?: { _type: "reference"; _ref: string } | null;
  used: number;
};
type Photographer = { _id: string; name?: string; website?: string };
type Client = ReturnType<typeof useClient>;

const QUERY = `*[_type == "mediaItem" && !(_id in path("drafts.**"))] | order(_createdAt desc){
  _id, _createdAt, "ref": image.asset._ref, "url": image.asset->url, "file": image.asset->originalFilename,
  "w": image.asset->metadata.dimensions.width, "h": image.asset->metadata.dimensions.height,
  alt, categories, showInGallery, highlight, photographer, "used": count(*[references(^._id) && !(_id in path("drafts.**"))])
}`;

const altOf = (i: Item, lang: string) =>
  i.alt?.find((a) => a.language === lang)?.value?.trim() ?? "";

const FILTERS: { id: string; title: string; match: (i: Item) => boolean }[] = [
  { id: "all", title: "Alle", match: () => true },
  { id: "todo", title: "Zonder alt-tekst", match: (i) => !altOf(i, "nl") },
  {
    id: "gallery",
    title: "In de gallery",
    match: (i) => i.showInGallery !== false,
  },
  { id: "highlight", title: "Uitgelicht", match: (i) => !!i.highlight },
  { id: "unused", title: "Niet gebruikt", match: (i) => !i.used },
  ...MEDIA_CATEGORIES.map((c) => ({
    id: c.value,
    title: c.title,
    match: (i: Item) => !!i.categories?.includes(c.value),
  })),
];

const PHOTOGRAPHERS = `*[_type == "photographer" && !(_id in path("drafts.**"))] | order(name asc){ _id, name, website }`;

/** Patch the published photo and, when there is one, its draft (the Fotobank edits apply at once). `null` clears a field. */
export async function save(
  client: Client,
  id: string,
  set: Record<string, unknown>,
) {
  const clear = Object.keys(set).filter((k) => set[k] === null);
  const keep = Object.fromEntries(Object.entries(set).filter(([, v]) => v !== null));
  const patch = (p: ReturnType<Client["patch"]>) => p.set(keep).unset(clear);
  const tx = client.transaction().patch(id, patch);
  const draft = await client.getDocument(`drafts.${id}`);
  if (draft) tx.patch(draft._id, patch);
  await tx.commit();
}

/** NL + EN alt text by AI; `overwrite` false keeps what's already filled in. */
export async function aiAlt(client: Client, item: Item, overwrite: boolean) {
  const { projectId, dataset } = client.config();
  if (!item.ref) throw new Error("geen foto");
  const out = await ai<{ alt: Record<string, string> }>(client, {
    task: "alt",
    image: imageUrl(item.ref, projectId!, dataset!),
  });
  const keep = (item.alt ?? []).filter(
    (a) => a.value?.trim() && !(overwrite && out.alt[a.language]),
  );
  const add = Object.entries(out.alt)
    .filter(([lang]) => !keep.some((a) => a.language === lang))
    .map(([language, value]) => ({
      _key: randomKey(12),
      _type: "internationalizedArrayStringValue",
      language,
      value,
    }));
  const alt = [...keep, ...add];
  await save(client, item._id, { alt });
  return alt;
}

const thumb = (url: string, size: number) =>
  `${url}?w=${size}&h=${size}&fit=crop&auto=format`;

/**
 * Inhoud → Fotobank: every photo as tiles over the full width, with search, filters, upload and
 * “alt-teksten aanvullen (AI)” on top. A photo opens large on the side with its fields (saved at once);
 * “Focuspunt & alle velden” opens the full form next to it.
 */
export function MediaBank() {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const { ChildLink } = usePaneRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Fotografen dialog; `assignTo` = the photo that gets a newly added photographer
  const [people, setPeople] = useState<{ assignTo?: string } | null>(null);
  const upload = useRef<HTMLInputElement>(null);

  const load = useCallback(
    () =>
      Promise.all([client.fetch<Item[]>(QUERY), client.fetch<Photographer[]>(PHOTOGRAPHERS)]).then(
        ([list, ph]) => {
          setItems(list);
          setPhotographers(ph);
        },
        console.error,
      ),
    [client],
  );
  useEffect(() => {
    void load();
    let t: ReturnType<typeof setTimeout> | undefined;
    const sub = client
      .listen(
        `*[_type in ["mediaItem", "photographer"]]`,
        {},
        { visibility: "query", includeResult: false },
      )
      .subscribe(() => {
        clearTimeout(t);
        t = setTimeout(load, 500);
      });
    return () => {
      clearTimeout(t);
      sub.unsubscribe();
    };
  }, [client, load]);

  const f = FILTERS.find((x) => x.id === filter) ?? FILTERS[0];
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (items ?? []).filter(f.match).filter((i) => {
      const hay =
        `${altOf(i, "nl")} ${altOf(i, "en")} ${i.file ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, f, q]);
  const todo = (items ?? []).filter((i) => !altOf(i, "nl"));
  const item = items?.find((i) => i._id === sel) ?? null;
  // the photo as it was when opened: “Herstellen” puts that back
  const [orig, setOrig] = useState<Item | null>(null);
  useEffect(() => {
    setOrig(items?.find((i) => i._id === sel) ?? null);
    // only when another photo is opened, not on every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const patchLocal = (id: string, set: Partial<Item>) =>
    setItems(
      (list) => list?.map((i) => (i._id === id ? { ...i, ...set } : i)) ?? null,
    );
  const update = async (i: Item, set: Partial<Item>) => {
    patchLocal(i._id, set);
    try {
      await save(client, i._id, set);
    } catch (err) {
      toast.push({
        status: "error",
        title: "Niet bewaard",
        description: String(err),
      });
      void load();
    }
  };

  const fillAll = async (list: Item[]) => {
    setBusy(`AI: 0 / ${list.length}`);
    let n = 0;
    for (const i of list) {
      try {
        patchLocal(i._id, { alt: await aiAlt(client, i, false) });
      } catch (err) {
        toast.push({
          status: "error",
          title: `AI: ${i.file ?? i._id}`,
          description: String(err),
        });
      }
      setBusy(`AI: ${++n} / ${list.length}`);
    }
    setBusy(null);
    toast.push({
      status: "success",
      title: `${n} alt-tekst(en) ingevuld: kijk ze even na`,
    });
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const made: Item[] = [];
    let n = 0;
    for (const file of Array.from(files)) {
      setBusy(`Uploaden ${++n} / ${files.length}`);
      try {
        const asset = await client.assets.upload("image", file, {
          filename: file.name,
        });
        const doc = await client.create({
          _id: randomKey(22),
          _type: "mediaItem",
          image: {
            _type: "image",
            asset: { _type: "reference", _ref: asset._id },
          },
          showInGallery: true,
          highlight: false,
          categories: MEDIA_CATEGORIES.some((c) => c.value === filter)
            ? [filter]
            : [],
        });
        made.push({
          _id: doc._id,
          _createdAt: doc._createdAt,
          ref: asset._id,
          url: asset.url,
          file: file.name,
          used: 0,
          categories: doc.categories as string[],
        });
      } catch (err) {
        toast.push({
          status: "error",
          title: `Upload: ${file.name}`,
          description: String(err),
        });
      }
    }
    if (upload.current) upload.current.value = "";
    setItems((list) => [...made, ...(list ?? [])]);
    if (made.length)
      await fillAll(made); // new photos get their alt text right away
    else setBusy(null);
  };

  return (
    <Flex style={{ height: "100%", minHeight: 0 }}>
      <Flex direction="column" flex={1} style={{ minWidth: 0 }}>
        {/* top bar: search, AI, upload, filters */}
        <Card
          padding={3}
          borderBottom
          style={{ position: "sticky", top: 0, zIndex: 2 }}
        >
          <Stack gap={3}>
            <Flex gap={2} align="center" wrap="wrap">
              <Box flex={1} style={{ minWidth: 200 }}>
                <TextInput
                  icon={SearchIcon}
                  placeholder="Zoek in alt-tekst of bestandsnaam…"
                  value={q}
                  onChange={(e) => setQ(e.currentTarget.value)}
                  fontSize={1}
                  padding={3}
                />
              </Box>
              <Button
                icon={SparklesIcon}
                mode="ghost"
                text={
                  busy?.startsWith("AI")
                    ? busy
                    : `Alt-teksten aanvullen (AI)${todo.length ? ` · ${todo.length}` : ""}`
                }
                disabled={!!busy || !todo.length}
                onClick={() => fillAll(todo)}
                title="AI vult de ontbrekende alt-teksten in (NL + EN), alleen waar ze leeg zijn"
              />
              <Button
                icon={UsersIcon}
                mode="ghost"
                text={`Fotografen (${photographers.length})`}
                onClick={() => setPeople({})}
                title="Wie de foto's nam: toevoegen, aanpassen, verwijderen"
              />
              <Button
                icon={AddIcon}
                tone="primary"
                text={busy?.startsWith("Upload") ? busy : "Foto's uploaden"}
                disabled={!!busy}
                onClick={() => upload.current?.click()}
              />
              <input
                ref={upload}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => onUpload(e.currentTarget.files)}
              />
            </Flex>
            <Flex gap={1} wrap="wrap">
              {FILTERS.map((x) => (
                <Button
                  key={x.id}
                  mode={filter === x.id ? "default" : "bleed"}
                  tone={filter === x.id ? "primary" : "default"}
                  padding={2}
                  fontSize={1}
                  text={`${x.title} (${(items ?? []).filter(x.match).length})`}
                  onClick={() => setFilter(x.id)}
                />
              ))}
            </Flex>
          </Stack>
        </Card>

        {/* tiles */}
        <Box padding={3} flex={1} style={{ overflowY: "auto" }}>
          {items === null ? (
            <Text muted size={1}>
              Laden…
            </Text>
          ) : !shown.length ? (
            <Text muted size={1}>
              Geen foto's.
            </Text>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 10,
              }}
            >
              {shown.map((i) => (
                <button
                  key={i._id}
                  type="button"
                  onClick={() => setSel(sel === i._id ? null : i._id)}
                  title={altOf(i, "nl") || i.file}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    padding: 0,
                    border: 0,
                    borderRadius: 4,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "var(--card-muted-bg-color, #222)",
                    outline:
                      sel === i._id
                        ? "3px solid var(--card-focus-ring-color, #2276fc)"
                        : "none",
                    outlineOffset: 2,
                  }}
                >
                  {i.url ? (
                    <img
                      src={thumb(i.url, 360)}
                      alt={altOf(i, "nl")}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    {!altOf(i, "nl") ? (
                      <Badge tone="caution" fontSize={0}>
                        geen alt
                      </Badge>
                    ) : null}
                    {i.highlight ? (
                      <Badge tone="primary" fontSize={0}>
                        ★
                      </Badge>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Box>
      </Flex>

      {/* the selected photo, large, with its fields */}
      {item ? (
        <Card
          borderLeft
          style={{
            width: 420,
            maxWidth: "45%",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <Stack gap={4} padding={4}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Text size={1} muted textOverflow="ellipsis">
                  {item.file ?? item._id}
                  {item.w ? ` · ${item.w} × ${item.h}` : ""}
                </Text>
              </Box>
              <Button
                icon={CloseIcon}
                mode="bleed"
                padding={2}
                onClick={() => setSel(null)}
                title="Sluiten"
              />
            </Flex>
            {item.url ? (
              <img
                src={`${item.url}?w=900&auto=format`}
                alt=""
                style={{ width: "100%", borderRadius: 4, display: "block" }}
              />
            ) : null}
            <Text size={1} muted>
              {item.used
                ? `Gebruikt op ${item.used} plaats${item.used > 1 ? "en" : ""}.`
                : "Nog nergens gebruikt."}
            </Text>
            <AltFields
              key={item._id}
              item={item}
              onSave={(alt) => update(item, { alt })}
            />
            <Button
              icon={SparklesIcon}
              mode="ghost"
              text={
                busy === item._id
                  ? "AI bekijkt de foto…"
                  : "Alt-tekst met AI (NL + EN)"
              }
              disabled={!!busy}
              onClick={async () => {
                setBusy(item._id);
                try {
                  patchLocal(item._id, {
                    alt: await aiAlt(client, item, true),
                  });
                } catch (err) {
                  toast.push({
                    status: "error",
                    title: "AI",
                    description: String(err),
                  });
                }
                setBusy(null);
              }}
            />
            <Stack gap={2}>
              <Text size={1} weight="semibold">
                Categorieën
              </Text>
              <Flex gap={3} wrap="wrap">
                {MEDIA_CATEGORIES.map((c) => (
                  <Flex key={c.value} as="label" gap={2} align="center">
                    <Checkbox
                      checked={!!item.categories?.includes(c.value)}
                      onChange={(e) => {
                        const on = e.currentTarget.checked;
                        update(item, {
                          categories: on
                            ? [...(item.categories ?? []), c.value]
                            : (item.categories ?? []).filter(
                                (x) => x !== c.value,
                              ),
                        });
                      }}
                    />
                    <Text size={1}>{c.title}</Text>
                  </Flex>
                ))}
              </Flex>
            </Stack>
            <Stack gap={2}>
              <Text size={1} weight="semibold">
                Fotograaf
              </Text>
              <Select
                fontSize={1}
                value={item.photographer?._ref ?? ""}
                onChange={(e) => {
                  const ref = e.currentTarget.value;
                  if (ref === NEW) return setPeople({ assignTo: item._id });
                  update(item, {
                    photographer: ref ? { _type: "reference", _ref: ref } : null,
                  });
                }}
              >
                <option value="">— Niet ingevuld —</option>
                {photographers.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || "(zonder naam)"}
                  </option>
                ))}
                <option value={NEW}>+ Nieuwe fotograaf…</option>
              </Select>
              <Text size={0} muted>
                Staat klein onder de foto op volledig scherm, met link naar hun website.
              </Text>
            </Stack>
            <Flex as="label" gap={2} align="center">
              <Switch
                checked={item.showInGallery !== false}
                onChange={(e) =>
                  update(item, { showInGallery: e.currentTarget.checked })
                }
              />
              <Text size={1}>Tonen in de gallery</Text>
            </Flex>
            <Flex as="label" gap={2} align="center">
              <Switch
                checked={!!item.highlight}
                onChange={(e) =>
                  update(item, { highlight: e.currentTarget.checked })
                }
              />
              <Text size={1}>Uitgelicht (grotere plek, Home / Instagram)</Text>
            </Flex>
            <PhotoActions
              key={`actions-${item._id}`}
              client={client}
              item={item}
              orig={orig}
              onChange={(set) => patchLocal(item._id, set)}
              onDeleted={() => {
                setSel(null);
                setItems(
                  (list) => list?.filter((i) => i._id !== item._id) ?? null,
                );
              }}
              onError={(title, err) =>
                toast.push({ status: "error", title, description: String(err) })
              }
            />
            <Box className="media-bank-link">
              <style>{`.media-bank-link a { color: inherit; text-decoration: none; }`}</style>
              <ChildLink childId={item._id}>
                <Button
                  as="span"
                  icon={EditIcon}
                  mode="bleed"
                  text="Focuspunt & alle velden"
                />
              </ChildLink>
            </Box>
          </Stack>
        </Card>
      ) : null}
      {people ? (
        <Photographers
          client={client}
          list={photographers}
          items={items ?? []}
          onClose={() => setPeople(null)}
          onAdded={(p) => {
            setPhotographers((l) => [...l, p].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
            const photo = items?.find((i) => i._id === people.assignTo);
            if (photo) {
              void update(photo, { photographer: { _type: "reference", _ref: p._id } });
              setPeople(null);
            }
          }}
          onChanged={(id, set) =>
            setPhotographers((l) =>
              set ? l.map((p) => (p._id === id ? { ...p, ...set } : p)) : l.filter((p) => p._id !== id),
            )
          }
          onError={(title, err) => toast.push({ status: "error", title, description: String(err) })}
        />
      ) : null}
    </Flex>
  );
}

const NEW = "__new";

/** "https://" in front when it's left out (miloweiler.com → https://miloweiler.com). */
const asUrl = (s: string) => {
  const v = s.trim();
  return !v || /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

/**
 * Fotobank → Fotografen: everyone who took photos, edited in place (saved when you leave a field).
 * Adding from a photo's dropdown assigns the new photographer to that photo. Deleting is only
 * possible once no photo uses them any more.
 */
function Photographers({
  client,
  list,
  items,
  onClose,
  onAdded,
  onChanged,
  onError,
}: {
  client: Client;
  list: Photographer[];
  items: Item[];
  onClose: () => void;
  onAdded: (p: Photographer) => void;
  onChanged: (id: string, set: Partial<Photographer> | null) => void;
  onError: (title: string, err: unknown) => void;
}) {
  const [draft, setDraft] = useState({ name: "", website: "" });
  const [busy, setBusy] = useState(false);
  const uses = (id: string) => items.filter((i) => i.photographer?._ref === id).length;

  const add = async () => {
    const name = draft.name.trim();
    if (!name) return;
    setBusy(true);
    try {
      const website = asUrl(draft.website) || undefined;
      const doc = await client.create({ _type: "photographer", name, website });
      setDraft({ name: "", website: "" });
      onAdded({ _id: doc._id, name, website });
    } catch (err) {
      onError("Fotograaf toevoegen", err);
    }
    setBusy(false);
  };
  const edit = async (p: Photographer, set: Partial<Photographer>) => {
    const k = Object.keys(set)[0] as "name" | "website";
    if ((set[k] ?? "") === (p[k] ?? "") || (k === "name" && !set.name)) return;
    onChanged(p._id, set);
    try {
      await save(client, p._id, { [k]: set[k] || null });
    } catch (err) {
      onError("Niet bewaard", err);
    }
  };
  const remove = async (p: Photographer) => {
    try {
      await client.transaction().delete(p._id).delete(`drafts.${p._id}`).commit();
      onChanged(p._id, null);
    } catch (err) {
      onError("Verwijderen", err);
    }
  };

  return (
    <Dialog id="media-photographers" header="Fotografen" onClose={onClose} width={1}>
      <Stack padding={4} gap={4}>
        <Text size={1} muted>
          De naam staat klein onder de foto op volledig scherm (met link naar de website) en gaat
          naar Google als maker van de foto. Kies per foto wie hem nam.
        </Text>
        {list.map((p) => (
          <PhotographerRow key={p._id} p={p} uses={uses(p._id)} onEdit={(set) => edit(p, set)} onRemove={() => remove(p)} />
        ))}
        <Card padding={3} radius={2} tone="primary" border>
          <Stack gap={2}>
            <Text size={1} weight="semibold">
              Nieuwe fotograaf
            </Text>
            <Flex gap={2} wrap="wrap">
              <Box flex={1} style={{ minWidth: 140 }}>
                <TextInput
                  fontSize={1}
                  placeholder="Naam, bv. Milo Weiler"
                  value={draft.name}
                  autoFocus
                  onChange={(e) => {
                    // read now: React clears currentTarget before it runs the updater
                    const value = e.currentTarget.value;
                    setDraft((d) => ({ ...d, name: value }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                />
              </Box>
              <Box flex={1} style={{ minWidth: 140 }}>
                <TextInput
                  fontSize={1}
                  placeholder="Website (optioneel)"
                  value={draft.website}
                  onChange={(e) => {
                    // read now: React clears currentTarget before it runs the updater
                    const value = e.currentTarget.value;
                    setDraft((d) => ({ ...d, website: value }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                />
              </Box>
              <Button icon={AddIcon} tone="primary" fontSize={1} text="Toevoegen" disabled={busy || !draft.name.trim()} onClick={add} />
            </Flex>
          </Stack>
        </Card>
      </Stack>
    </Dialog>
  );
}

function PhotographerRow({
  p,
  uses,
  onEdit,
  onRemove,
}: {
  p: Photographer;
  uses: number;
  onEdit: (set: Partial<Photographer>) => void;
  onRemove: () => void;
}) {
  const [vals, setVals] = useState({ name: p.name ?? "", website: p.website ?? "" });
  useEffect(() => setVals({ name: p.name ?? "", website: p.website ?? "" }), [p.name, p.website]);
  return (
    <Flex gap={2} align="center" wrap="wrap">
      <Box flex={1} style={{ minWidth: 140 }}>
        <TextInput
          fontSize={1}
          value={vals.name}
          onChange={(e) => {
                    // read now: React clears currentTarget before it runs the updater
                    const value = e.currentTarget.value;
                    setVals((v) => ({ ...v, name: value }));
                  }}
          onBlur={() => onEdit({ name: vals.name.trim() })}
          customValidity={vals.name.trim() ? undefined : "Naam is verplicht"}
        />
      </Box>
      <Box flex={1} style={{ minWidth: 140 }}>
        <TextInput
          fontSize={1}
          placeholder="Website (optioneel)"
          value={vals.website}
          onChange={(e) => {
                    // read now: React clears currentTarget before it runs the updater
                    const value = e.currentTarget.value;
                    setVals((v) => ({ ...v, website: value }));
                  }}
          onBlur={() => {
            const website = asUrl(vals.website);
            setVals((v) => ({ ...v, website }));
            onEdit({ website });
          }}
        />
      </Box>
      <Flex justify="flex-end" style={{ width: 64 }}>
        <Badge tone={uses ? "primary" : "default"} fontSize={0}>
          {uses} foto{uses === 1 ? "" : "'s"}
        </Badge>
      </Flex>
      <Button
        icon={TrashIcon}
        mode="bleed"
        tone="critical"
        fontSize={1}
        disabled={!!uses}
        title={uses ? "Nog gekozen bij foto's: haal hem daar eerst weg" : "Verwijderen"}
        onClick={onRemove}
      />
    </Flex>
  );
}

const FIELDS = ["alt", "categories", "showInGallery", "highlight", "photographer"] as const;
const same = (a: Item, b: Item) =>
  a.ref === b.ref &&
  FIELDS.every(
    (k) => JSON.stringify(a[k] ?? null) === JSON.stringify(b[k] ?? null),
  );

/**
 * Under a photo: “Herstellen” (back to how it was when you opened it), “Andere foto uploaden” (a new
 * file in the same Fotobank item: changes everywhere it's used; focus point reset) and “Verwijderen”
 * (only once nothing uses it any more: Sanity won't delete a photo that is still referenced; the
 * dialog lists where it's used). The file itself is deleted too when nothing else uses it.
 */
function PhotoActions({
  client,
  item,
  orig,
  onChange,
  onDeleted,
  onError,
}: {
  client: Client;
  item: Item;
  orig: Item | null;
  onChange: (set: Partial<Item>) => void;
  onDeleted: () => void;
  onError: (title: string, err: unknown) => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    { _id: string; _type: string; title?: string }[] | null
  >(null);
  const image = (ref: string) => ({
    _type: "image",
    asset: { _type: "reference", _ref: ref },
  });

  const replace = async (f?: File) => {
    if (!f) return;
    setBusy("Uploaden…");
    try {
      const asset = await client.assets.upload("image", f, {
        filename: f.name,
      });
      await save(client, item._id, { image: image(asset._id) });
      onChange({
        ref: asset._id,
        url: asset.url,
        file: f.name,
        w: asset.metadata?.dimensions?.width,
        h: asset.metadata?.dimensions?.height,
      });
    } catch (err) {
      onError("Uploaden", err);
    }
    if (file.current) file.current.value = "";
    setBusy(null);
  };

  const restore = async () => {
    if (!orig) return;
    setBusy("Herstellen…");
    try {
      const set: Record<string, unknown> = {};
      for (const k of FIELDS) set[k] = orig[k] ?? null;
      if (orig.ref && orig.ref !== item.ref) set.image = image(orig.ref);
      await save(client, item._id, set);
      onChange(orig);
    } catch (err) {
      onError("Herstellen", err);
    }
    setBusy(null);
  };

  const askDelete = async () => {
    setBusy("Nakijken…");
    try {
      setConfirm(
        await client.fetch(
          `*[references($id) && _id != $draft]{ _id, _type, "title": coalesce(title[language == "nl"][0].value, title, name, internalTitle) }`,
          { id: item._id, draft: `drafts.${item._id}` },
          { perspective: "raw" },
        ),
      );
    } catch (err) {
      onError("Verwijderen", err);
    }
    setBusy(null);
  };

  const remove = async () => {
    setBusy("Verwijderen…");
    try {
      await client
        .transaction()
        .delete(item._id)
        .delete(`drafts.${item._id}`)
        .commit();
      // the file too, unless something else still uses it (then Sanity refuses: fine)
      if (item.ref) await client.delete(item.ref).catch(() => undefined);
      setConfirm(null);
      onDeleted();
    } catch (err) {
      onError("Verwijderen", err);
      setBusy(null);
    }
  };

  return (
    <Stack gap={2}>
      <Flex gap={2} wrap="wrap">
        <Button
          icon={RevertIcon}
          mode="ghost"
          text="Herstellen"
          title="Terug naar hoe de foto was toen je hem opende"
          disabled={!!busy || !orig || same(orig, item)}
          onClick={restore}
        />
        <Button
          icon={UploadIcon}
          mode="ghost"
          text={busy === "Uploaden…" ? busy : "Andere foto uploaden"}
          title="Vervangt het bestand overal waar deze foto gebruikt wordt"
          disabled={!!busy}
          onClick={() => file.current?.click()}
        />
        <Button
          icon={TrashIcon}
          mode="ghost"
          tone="critical"
          text="Verwijderen"
          disabled={!!busy}
          onClick={askDelete}
        />
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => replace(e.currentTarget.files?.[0])}
        />
      </Flex>
      {confirm ? (
        <Dialog
          id="media-delete"
          header="Foto verwijderen"
          onClose={() => setConfirm(null)}
          width={1}
          footer={
            <Flex padding={3} gap={2} justify="flex-end">
              <Button
                mode="bleed"
                text="Annuleren"
                onClick={() => setConfirm(null)}
              />
              {!confirm.length ? (
                <Button
                  tone="critical"
                  icon={TrashIcon}
                  text={busy === "Verwijderen…" ? busy : "Verwijderen"}
                  disabled={!!busy}
                  onClick={remove}
                />
              ) : null}
            </Flex>
          }
        >
          <Stack gap={3} padding={4}>
            {confirm.length ? (
              <>
                <Text size={1}>
                  Deze foto wordt nog gebruikt op {confirm.length} plaats
                  {confirm.length > 1 ? "en" : ""}. Kies daar eerst een andere
                  foto (of haal hem weg), dan kan je hem verwijderen:
                </Text>
                <Stack gap={2}>
                  {confirm.map((d) => (
                    <Text key={d._id} size={1} muted>
                      • {d.title || d._type}
                      {d._id.startsWith("drafts.") ? " (concept)" : ""}
                    </Text>
                  ))}
                </Stack>
              </>
            ) : (
              <Text size={1}>
                De foto wordt nergens gebruikt. Definitief verwijderen uit de
                Fotobank? Dit kan je niet ongedaan maken.
              </Text>
            )}
          </Stack>
        </Dialog>
      ) : null}
    </Stack>
  );
}

/**
 * Alt text with the same small NL | EN tabs as every localized field in the forms (components/I18nTabs.tsx):
 * one language at a time; a dot = still empty, red = NL (required) empty. Saved when you leave the field.
 */
function AltFields({
  item,
  onSave,
}: {
  item: Item;
  onSave: (alt: Alt) => void;
}) {
  const [vals, setVals] = useState({
    nl: altOf(item, "nl"),
    en: altOf(item, "en"),
  });
  const [active, setActive] = useState<"nl" | "en">("nl");
  useEffect(
    () => setVals({ nl: altOf(item, "nl"), en: altOf(item, "en") }),
    [item.alt],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const commit = () => {
    if (vals.nl === altOf(item, "nl") && vals.en === altOf(item, "en")) return;
    const alt = (["nl", "en"] as const)
      .filter((l) => vals[l].trim())
      .map((language) => ({
        _key:
          item.alt?.find((a) => a.language === language)?._key ?? randomKey(12),
        _type: "internationalizedArrayStringValue",
        language,
        value: vals[language].trim(),
      }));
    onSave(alt);
  };
  const tab = (l: "nl" | "en") => {
    const empty = !vals[l].trim();
    const label = l.toUpperCase();
    return (
      <Button
        key={l}
        role="tab"
        aria-selected={active === l}
        mode={active === l ? "default" : "bleed"}
        tone={l === "nl" && empty ? "critical" : active === l ? "primary" : "default"}
        paddingX={2}
        paddingY={1}
        fontSize={0}
        radius={2}
        text={`${label}${empty ? " •" : ""}`}
        title={empty ? `${label}: nog leeg` : label}
        onClick={() => setActive(l)}
      />
    );
  };
  return (
    <Stack gap={2}>
      <Flex align="center" gap={2}>
        <Text size={1} weight="semibold">
          Alt-tekst
        </Text>
        <Card radius={2} padding={0} tone="transparent" border style={{ display: "inline-flex" }}>
          <Flex role="tablist" gap={0}>
            {tab("nl")}
            {tab("en")}
          </Flex>
        </Card>
      </Flex>
      <TextInput
        key={active}
        value={vals[active]}
        maxLength={125}
        placeholder={
          active === "nl"
            ? "Verplicht: beschrijf wat je ziet, zonder “foto van …”"
            : "Leeg = de Nederlandse tekst op de site"
        }
        onChange={(e) => {
          const v = e.currentTarget.value;
          setVals((x) => ({ ...x, [active]: v }));
        }}
        onBlur={commit}
        fontSize={1}
      />
    </Stack>
  );
}
