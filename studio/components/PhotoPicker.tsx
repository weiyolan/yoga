import { AddIcon } from "@sanity/icons/Add";
import { ImagesIcon } from "@sanity/icons/Images";
import { SearchIcon } from "@sanity/icons/Search";
import { TrashIcon } from "@sanity/icons/Trash";
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { randomKey } from "@sanity/util/content";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  insert,
  set,
  setIfMissing,
  unset,
  useClient,
  type ArrayOfObjectsInputProps,
  type ObjectInputProps,
} from "sanity";
import { apiVersion } from "../../sanity/site.config";
import { MEDIA_CATEGORIES } from "../schemaTypes/documents/media-item";
import { aiAlt } from "./MediaBank";

type Photo = {
  _id: string;
  url?: string;
  ref?: string;
  file?: string;
  alt?: { _key: string; language: string; value?: string }[];
  categories?: string[];
};
type Ref = { _ref?: string; _key?: string };

const QUERY = `*[_type == "mediaItem" && !(_id in path("drafts.**"))] | order(_createdAt desc){
  _id, "url": image.asset->url, "ref": image.asset._ref, "file": image.asset->originalFilename, alt, categories
}`;
const altNl = (p?: Photo) =>
  p?.alt?.find((a) => a.language === "nl")?.value?.trim() ?? "";
const thumb = (url: string, w: number, h = w) =>
  `${url}?w=${w}&h=${h}&fit=crop&auto=format`;

/** The Fotobank, loaded once per Studio tab (and refreshed after an upload). */
let cache: Promise<Photo[]> | null = null;
function usePhotos() {
  const client = useClient({ apiVersion });
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const reload = () => {
    cache = client.fetch<Photo[]>(QUERY);
    return cache.then(setPhotos, console.error);
  };
  useEffect(() => {
    (cache ??= client.fetch<Photo[]>(QUERY)).then(setPhotos, console.error);
  }, [client]);
  return { photos, reload };
}

/** Big grid of Fotobank photos to choose from: search, category filters, upload (+ AI alt text). */
function PickerDialog({
  multiple,
  taken,
  onClose,
  onPick,
}: {
  multiple: boolean;
  taken: string[];
  onClose: () => void;
  onPick: (ids: string[]) => void;
}) {
  const client = useClient({ apiVersion });
  const toast = useToast();
  const { photos, reload } = usePhotos();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (photos ?? []).filter(
      (p) =>
        (!cat || p.categories?.includes(cat)) &&
        words.every((w) =>
          `${altNl(p)} ${p.file ?? ""}`.toLowerCase().includes(w),
        ),
    );
  }, [photos, q, cat]);

  const pick = (id: string) => {
    if (!multiple) return onPick([id]);
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const ids: string[] = [];
    let n = 0;
    for (const f of Array.from(files)) {
      setBusy(`Uploaden ${++n} / ${files.length}`);
      try {
        const asset = await client.assets.upload("image", f, {
          filename: f.name,
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
          categories: cat ? [cat] : [],
        });
        ids.push(doc._id);
        // alt text by AI in the background (the photo can be used right away)
        aiAlt(
          client,
          { _id: doc._id, _createdAt: doc._createdAt, ref: asset._id, used: 0 },
          false,
        ).catch((err) =>
          toast.push({
            status: "warning",
            title: `Alt-tekst (AI): ${f.name}`,
            description: String(err),
          }),
        );
      } catch (err) {
        toast.push({
          status: "error",
          title: `Upload: ${f.name}`,
          description: String(err),
        });
      }
    }
    if (file.current) file.current.value = "";
    setBusy(null);
    await reload();
    if (!ids.length) return;
    if (multiple) setChosen((c) => [...c, ...ids]);
    else onPick([ids[0]]);
  };

  return (
    <Dialog
      id="photo-picker"
      header={
        multiple
          ? "Foto's kiezen uit de Fotobank"
          : "Foto kiezen uit de Fotobank"
      }
      onClose={onClose}
      width={4}
      footer={
        multiple ? (
          <Flex padding={3} gap={2} justify="flex-end">
            <Button mode="bleed" text="Annuleren" onClick={onClose} />
            <Button
              tone="primary"
              text={
                chosen.length
                  ? `Voeg ${chosen.length} foto${chosen.length > 1 ? "'s" : ""} toe`
                  : "Kies foto's"
              }
              disabled={!chosen.length}
              onClick={() => onPick(chosen)}
            />
          </Flex>
        ) : undefined
      }
    >
      <Stack gap={3} padding={3}>
        <Flex gap={2} wrap="wrap" align="center">
          <Box flex={1} style={{ minWidth: 200 }}>
            <TextInput
              icon={SearchIcon}
              placeholder="Zoek in alt-tekst of bestandsnaam…"
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              fontSize={1}
              autoFocus
            />
          </Box>
          <Button
            icon={AddIcon}
            mode="ghost"
            text={busy ?? "Uploaden"}
            disabled={!!busy}
            onClick={() => file.current?.click()}
          />
          <input
            ref={file}
            type="file"
            accept="image/*"
            multiple={multiple}
            hidden
            onChange={(e) => upload(e.currentTarget.files)}
          />
        </Flex>
        <Flex gap={1} wrap="wrap">
          {[{ title: "Alle", value: "" }, ...MEDIA_CATEGORIES].map((c) => (
            <Button
              key={c.value}
              mode={cat === c.value ? "default" : "bleed"}
              tone={cat === c.value ? "primary" : "default"}
              padding={2}
              fontSize={1}
              text={c.title}
              onClick={() => setCat(c.value)}
            />
          ))}
        </Flex>
        {photos === null ? (
          <Text size={1} muted>
            Laden…
          </Text>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            {shown.map((p) => {
              const on = chosen.includes(p._id);
              const used = taken.includes(p._id);
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => pick(p._id)}
                  title={altNl(p) || p.file}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    padding: 0,
                    border: 0,
                    borderRadius: 4,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#222",
                    outline: on ? "3px solid #2276fc" : "none",
                    outlineOffset: 2,
                    opacity: used && multiple ? 0.45 : 1,
                  }}
                >
                  {p.url ? (
                    <img
                      src={thumb(p.url, 320)}
                      alt={altNl(p)}
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
                    {on ? (
                      <Badge tone="primary">{chosen.indexOf(p._id) + 1}</Badge>
                    ) : null}
                    {used ? <Badge tone="default">gekozen</Badge> : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Stack>
    </Dialog>
  );
}

/** One photo field (mediaField): the chosen photo shown large, “Kies een foto” opens the grid. */
export function MediaRefInput(props: ObjectInputProps) {
  const value = props.value as Ref | undefined;
  const { photos } = usePhotos();
  const [open, setOpen] = useState(false);
  const photo = photos?.find((p) => p._id === value?._ref);
  const ro = !!props.readOnly;

  return (
    <Stack gap={2}>
      {value?._ref ? (
        <Card radius={2} border overflow="hidden">
          <Flex wrap="wrap">
            <Box
              style={{
                width: 260,
                maxWidth: "100%",
                aspectRatio: "4 / 3",
                background: "#222",
              }}
            >
              {photo?.url ? (
                <img
                  src={thumb(photo.url, 520, 390)}
                  alt={altNl(photo)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
            </Box>
            <Stack gap={3} padding={3} flex={1} style={{ minWidth: 180 }}>
              <Text size={1}>
                {photo
                  ? altNl(photo) || (
                      <span style={{ opacity: 0.6 }}>⚠ geen alt-tekst</span>
                    )
                  : "Laden…"}
              </Text>
              {!ro ? (
                <Flex gap={2} wrap="wrap">
                  <Button
                    icon={ImagesIcon}
                    mode="ghost"
                    text="Andere foto"
                    onClick={() => setOpen(true)}
                  />
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    tone="critical"
                    text="Verwijderen"
                    onClick={() => props.onChange(unset())}
                  />
                </Flex>
              ) : null}
            </Stack>
          </Flex>
        </Card>
      ) : (
        <Card radius={2} border style={{ borderStyle: "dashed" }}>
          <Button
            icon={ImagesIcon}
            mode="bleed"
            text="Kies een foto uit de Fotobank"
            disabled={ro}
            onClick={() => setOpen(true)}
            style={{ width: "100%", padding: 28 }}
          />
        </Card>
      )}
      {open ? (
        <PickerDialog
          multiple={false}
          taken={value?._ref ? [value._ref] : []}
          onClose={() => setOpen(false)}
          onPick={([id]) => {
            props.onChange(set({ _type: "reference", _ref: id }));
            setOpen(false);
          }}
        />
      ) : null}
    </Stack>
  );
}

/** A list of photos (mediaArrayField): the usual grid + “Kies foto's” to add several at once from the big grid. */
export function MediaArrayInput(props: ArrayOfObjectsInputProps) {
  const [open, setOpen] = useState(false);
  const value = (props.value ?? []) as Ref[];
  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      {!props.readOnly ? (
        <Button
          icon={ImagesIcon}
          mode="ghost"
          text="Kies foto's uit de Fotobank"
          onClick={() => setOpen(true)}
        />
      ) : null}
      {open ? (
        <PickerDialog
          multiple
          taken={value.map((v) => v._ref ?? "")}
          onClose={() => setOpen(false)}
          onPick={(ids) => {
            const add = ids
              .filter((id) => !value.some((v) => v._ref === id))
              .map((id) => ({
                _type: "reference",
                _ref: id,
                _key: randomKey(12),
              }));
            if (add.length)
              props.onChange([setIfMissing([]), insert(add, "after", [-1])]);
            setOpen(false);
          }}
        />
      ) : null}
    </Stack>
  );
}
