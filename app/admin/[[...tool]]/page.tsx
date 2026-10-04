import { AdminStudio } from "./Studio";

/** Sanity Studio at /admin. The shell is static; the Studio itself runs in the browser. */
export const dynamic = "force-static";

export default function AdminPage() {
  return <AdminStudio />;
}
