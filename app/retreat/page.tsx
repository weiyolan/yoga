import StubPage from "@/components/StubPage";

export const metadata = {
  title: "Retreat — Yoga, Zen & Tonic",
};

const NAMES: Record<string, string> = {
  "dahab-2026": "Dahab · Yoga & Freediving",
  "eifel-2026": "Eifel · Yoga & Hike",
  "ardennen-2026": "Ardennen · Yoga & Spa",
};

export default function RetreatPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const slugRaw = searchParams?.slug;
  const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;
  const name = slug ? NAMES[slug] : undefined;

  return (
    <StubPage
      eyebrowNl="retreat"
      eyebrowEn="retreat"
      titleNl="Volledig programma komt eraan"
      titleEn="Full programme is coming"
      bodyNl="De gedetailleerde retreatpagina — met dag-tot-dag programma, inbegrepen extra's, sfeerbeelden en inschrijving — is in de maak."
      bodyEn="The detailed retreat page — with a day-by-day programme, included extras, gallery and sign-up — is in the works."
      note={name ? name : slug ? `slug: ${slug}` : undefined}
    />
  );
}
