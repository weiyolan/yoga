import { LinkIcon } from "@sanity/icons/Link";
import { useToast } from "@sanity/ui/toast";
import type { DocumentActionComponent } from "sanity";
import { SITE_URL } from "../lib/site";

type Retreat = { slug?: { current?: string }; endDate?: string };

/** Past retreat → “Kopieer reviewlink”: the review form on the live site, to send to every participant. */
export const reviewLinkAction: DocumentActionComponent = ({ draft, published }) => {
  const doc = (published ?? draft) as Retreat | null;
  const toast = useToast();
  const slug = doc?.slug?.current;
  const past = !!doc?.endDate && doc.endDate < new Date().toISOString().slice(0, 10);
  if (!past) return null;
  const url = `${process.env.SANITY_STUDIO_PREVIEW_URL || SITE_URL}/retreats/${slug}#review`;
  return {
    label: "Kopieer reviewlink",
    icon: LinkIcon,
    disabled: !slug || !published,
    title: published ? `Link naar het reviewformulier: ${url}` : "Publiceer de retreat eerst",
    onHandle: async () => {
      try {
        await navigator.clipboard.writeText(url);
        toast.push({ status: "success", title: "Reviewlink gekopieerd", description: url });
      } catch {
        toast.push({ status: "info", title: "Kopieer deze link", description: url });
      }
    },
  };
};
