import type { DocumentBadgeComponent } from "sanity";

/** Form submissions (sign-ups, messages, reviews) that are still "Nieuw". */
export const newBadge: DocumentBadgeComponent = ({ published, draft }) => {
  const doc = (draft ?? published) as { status?: string; _type?: string } | null;
  if (!doc || doc._type === "subscriber" || (doc.status && doc.status !== "new")) return null;
  return { label: "Nieuw", color: "primary", title: "Nog niet behandeld" };
};
