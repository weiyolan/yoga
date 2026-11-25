import { LinkIcon } from "@sanity/icons/Link";
import { useToast } from "@sanity/ui/toast";
import type { DocumentActionComponent } from "sanity";
import { reviewHref } from "../../lib/routes";
import { siteOrigin } from "../lib/site";

type Retreat = { slug?: { current?: string } };

/**
 * Retreat → ⋯ → “Kopieer reviewlink”: its review / feedback page on the live site (not linked on the site,
 * not indexed), to send to every participant. Always there (also before the end date, to test the form);
 * the same link, with “Openen” and “Bedankbrief maken”, is in the tab Achteraf (components/ReviewLink.tsx).
 */
export const reviewLinkAction: DocumentActionComponent = ({ draft, published }) => {
  const doc = (published ?? draft) as Retreat | null;
  const toast = useToast();
  const slug = doc?.slug?.current;
  const url = `${siteOrigin()}${reviewHref("nl", slug)}`;
  return {
    label: "Kopieer reviewlink",
    icon: LinkIcon,
    disabled: !slug || !published,
    title: !slug ? "Vul eerst de slug in" : published ? `Link naar het feedbackformulier: ${url}` : "Publiceer de retreat eerst",
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
