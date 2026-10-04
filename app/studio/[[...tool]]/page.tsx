import { StudioShell } from "./Studio";

/** Sanity Studio at /studio. The shell is static; the Studio itself runs in the browser. */
export const dynamic = "force-static";

export default function StudioPage() {
  return <StudioShell />;
}
