"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Old links to `#<hash>` (e.g. the sign-up form that used to sit at the bottom of a retreat page) → `to`. */
export function HashRedirect({ hash, to }: { hash: string; to: string }) {
  const router = useRouter();
  useEffect(() => {
    if (location.hash === `#${hash}`) router.replace(to);
  }, [hash, to, router]);
  return null;
}
