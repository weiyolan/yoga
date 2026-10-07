import { useEffect, useState, type ComponentType } from "react";
import { useClient } from "sanity";
import { apiVersion } from "../../sanity/site.config";

/**
 * A menu icon with a live count bubble of documents of `type` that are still "new"
 * (sign-ups, messages, reviews). Listens to changes, so the badge updates as soon as
 * a form is submitted on the site or a status is changed.
 */
export function countBadgeIcon(Icon: ComponentType, type: string): ComponentType {
  const query = `count(*[_type == $type && status == "new"])`;
  function CountBadge() {
    const client = useClient({ apiVersion });
    const [count, setCount] = useState(0);
    useEffect(() => {
      let alive = true;
      const load = () => client.fetch<number>(query, { type }, { perspective: "raw" }).then((n) => alive && setCount(n), () => {});
      load();
      const sub = client.listen(`*[_type == $type]`, { type }, { events: ["mutation"], includeResult: false, visibility: "query" }).subscribe(() => load());
      return () => {
        alive = false;
        sub.unsubscribe();
      };
    }, [client]);
    return (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <Icon />
        {count > 0 ? (
          <span
            aria-label={`${count} nieuw`}
            style={{
              position: "absolute",
              top: "-0.55em",
              right: "-0.75em",
              minWidth: "1.45em",
              height: "1.45em",
              padding: "0 0.35em",
              borderRadius: "999px",
              background: "#e5484d",
              color: "#fff",
              font: "600 9px/1.45em system-ui, sans-serif",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </span>
    );
  }
  CountBadge.displayName = `CountBadge(${type})`;
  return CountBadge;
}
