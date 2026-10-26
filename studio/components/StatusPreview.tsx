import { Badge } from "@sanity/ui";
import type { PreviewProps } from "sanity";

export type Tone = "primary" | "positive" | "caution" | "critical" | "default";
export type StatusDef = { title: string; value: string; tone: Tone };

/**
 * A list row with a coloured status badge on the right (Nieuw = blue, Bevestigd / Beantwoord = green, …).
 * The schema's preview `prepare` passes the status value as `description` (shown nowhere else in a list row).
 */
export function statusPreview(statuses: StatusDef[]) {
  function StatusPreview(props: PreviewProps) {
    const value =
      typeof props.description === "string" ? props.description : undefined;
    const s = statuses.find((x) => x.value === value) ?? statuses[0];
    return props.renderDefault({
      ...props,
      description: undefined,
      status: (
        <Badge
          tone={s.tone}
          fontSize={1}
          padding={2}
          radius={2}
          style={{ whiteSpace: "nowrap" }}
        >
          {s.title}
        </Badge>
      ),
    });
  }
  return StatusPreview;
}
