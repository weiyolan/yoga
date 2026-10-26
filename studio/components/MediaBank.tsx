import { AddIcon } from "@sanity/icons/Add";
import { CloseIcon } from "@sanity/icons/Close";
import { EditIcon } from "@sanity/icons/Edit";
import { SearchIcon } from "@sanity/icons/Search";
import { SparklesIcon } from "@sanity/icons/Sparkles";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
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
  used: number;
};
type Client = ReturnType<typeof useClient>;

const QUERY = `*[_type == "mediaItem" && !(_id in path("drafts.**"))] | order(_createdAt desc){
  _id, _createdAt, "ref": image.asset._ref, "url": image.asset->url, "file": image.asset->originalFilename,
  "w": image.asset->metadata.dimensions.width, "h": image.asset->metadata.dimensions.height,
  alt, categories, showInGallery, highlight, "used": count(*[references(^._id) && !(_id in path("drafts.**"))])
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

/** Patch the published photo and, when there is one, its draft (the Fotobank edits apply at once). */
export async function save(
  client: Client,
  id: string,
  set: Record<string, unknown>,
) {
  const tx = client.transaction().patch(id, (p) => p.set(set));
  const draft = await client.getDocument(`drafts.${id}`);
  if (draft) tx.patch(draft._id, (p) => p.set(set));
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
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const upload = useRef<HTMLInputElement>(null);

  const load = useCallback(
    () => client.fetch<Item[]>(QUERY).then(setItems, console.error),
    [client],
  );
  useEffect(() => {
    void load();
    let t: ReturnType<typeof setTimeout> | undefined;
    const sub = client
      .listen(
        `*[_type == "mediaItem"]`,
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
    </Flex>
  );
}

/** Alt text NL + EN: saved when you leave the field. */
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
  return (
    <Stack gap={3}>
      {(["nl", "en"] as const).map((l) => (
        <Stack key={l} gap={2}>
          <Text size={1} weight="semibold">
            Alt-tekst {l.toUpperCase()}
            {l === "nl" ? " (verplicht)" : ""}
          </Text>
          <TextInput
            value={vals[l]}
            maxLength={125}
            placeholder="Beschrijf wat je ziet, zonder “foto van …”"
            onChange={(e) =>
              setVals((v) => ({ ...v, [l]: e.currentTarget.value }))
            }
            onBlur={commit}
            fontSize={1}
          />
        </Stack>
      ))}
    </Stack>
  );
}
