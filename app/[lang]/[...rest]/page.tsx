import { notFound } from "next/navigation";

/** Unknown paths inside a language render the localized 404 (with header and footer). */
export default function CatchAll() {
  notFound();
}
