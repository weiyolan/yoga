"use client";

/**
 * Draft mode UI. Inside Studio → Live preview: click-to-edit overlays. On the site itself
 * (the draft cookie outlives the Studio tab, same domain): no overlays, just a bar to leave
 * draft mode — the pattern from Sanity's Next.js Visual Editing guide.
 */
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { VisualEditing } from "next-sanity/visual-editing";
import { getDictionary } from "@/lib/dictionary";
import type { Lang } from "@/sanity/site.config";

export function DraftMode({ lang }: { lang: Lang }) {
  // Live preview loads the site in an iframe (or a window it opened). next-sanity's
  // useIsPresentationTool() needs <VisualEditing /> mounted first, i.e. the overlays.
  const [inStudio, setInStudio] = useState<boolean | null>(null);
  useEffect(() => setInStudio(window.self !== window.top || !!window.opener), []);
  const path = usePathname();
  if (inStudio === null) return null; // not known yet
  if (inStudio) return <VisualEditing />;
  const t = getDictionary(lang).draft;
  return (
    <div className="draft-bar" role="status">
      {t.notice}
      <a href={`/api/draft-mode/disable?redirect=${encodeURIComponent(path)}`}>{t.exit}</a>
    </div>
  );
}
