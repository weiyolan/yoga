import { useSyncExternalStore } from "react";
import { defaultLanguage } from "../../sanity/site.config";

/** Languages shown in localized fields across the Studio (navbar toggle), remembered per browser. */
const KEY = "yzt.languages";
const listeners = new Set<() => void>();
let shown: string[] = (() => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "");
    return Array.isArray(v) && v.length ? v : [defaultLanguage];
  } catch {
    return [defaultLanguage];
  }
})();

export function toggleLanguage(id: string) {
  const next = shown.includes(id) ? shown.filter((l) => l !== id) : [...shown, id];
  if (!next.length) return; // keep at least one language visible
  shown = next;
  localStorage.setItem(KEY, JSON.stringify(shown));
  listeners.forEach((l) => l());
}

export const useShownLanguages = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => shown,
  );
