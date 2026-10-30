import { useEffect, useRef } from "react";
import { useClient, useFormValue, type StringInputProps } from "sanity";
import { apiVersion } from "../../sanity/site.config";
import { recomputeBooked } from "../lib/booked";

/** Default status radio; when the status changes here, `booked` on the retreat is recomputed. */
export function StatusInput(props: StringInputProps) {
  const client = useClient({ apiVersion });
  const retreat = useFormValue(["retreat", "_ref"]) as string | undefined;
  const prev = useRef(props.value);
  useEffect(() => {
    if (prev.current === props.value) return;
    prev.current = props.value;
    // liveEdit: the patch is saved within a moment; recount after it landed
    const t = setTimeout(() => recomputeBooked(client, retreat).catch(console.error), 1500);
    return () => clearTimeout(t);
  }, [props.value, client, retreat]);
  return props.renderDefault(props);
}
