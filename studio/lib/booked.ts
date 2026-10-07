import type { useClient } from "sanity";

type SanityClient = ReturnType<typeof useClient>;

/** Statuses that take a place on the retreat. */
export const BOOKED_STATUSES = ["confirmed"];

/**
 * Recomputes `retreat.booked` = persons on confirmed sign-ups, on the published retreat and its draft
 * (whichever exist). Called whenever a sign-up's status changes in the Studio.
 */
export async function recomputeBooked(client: SanityClient, retreatId?: string) {
  if (!retreatId) return;
  const id = retreatId.replace(/^drafts\./, "");
  const { booked, ids } = await client.fetch<{ booked: number | null; ids: string[] }>(
    `{
      "booked": math::sum(*[_type == "signup" && retreat._ref == $id && status in $statuses]{ "p": coalesce(persons, 1) }.p),
      "ids": *[_id in [$id, "drafts." + $id]]._id
    }`,
    { id, statuses: BOOKED_STATUSES },
    { perspective: "raw" },
  );
  if (!ids.length) return;
  const tx = client.transaction();
  for (const docId of ids) tx.patch(docId, (p) => p.set({ booked: booked ?? 0 }));
  await tx.commit({ visibility: "async" });
}
