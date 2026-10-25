import { Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { useClient, useFormValue, type StringInputProps } from "sanity";
import { IntentLink } from "sanity/router";
import { apiVersion } from "../../sanity/site.config";

type Used = { _id: string; title?: string; startDate?: string };

/** Sign-up form / confirmation mail → which retreats use it (the default one: also every retreat that picked none). Read-only. */
export const usedByInput = (field: string) => (props: StringInputProps) => <UsedBy {...props} field={field} />;

function UsedBy({ field }: StringInputProps & { field: string }) {
  const client = useClient({ apiVersion });
  const id = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "");
  const isDefault = useFormValue(["isDefault"]) === true;
  const [used, setUsed] = useState<Used[] | null>(null);
  useEffect(() => {
    if (!id) return;
    client
      .fetch<Used[]>(
        `*[_type == "retreat" && !(_id in path("drafts.**")) && (@[$field]._ref == $id || ($isDefault && !defined(@[$field])))] | order(startDate desc){ _id, "title": coalesce(title[language == "nl"][0].value, title[0].value), startDate }`,
        { id, isDefault, field },
      )
      .then(setUsed, () => setUsed([]));
  }, [client, id, isDefault, field]);
  if (used === null) return <Text size={1} muted>Laden…</Text>;
  if (!used.length) return <Text size={1} muted>Nog door geen enkele retreat.</Text>;
  return (
    <Stack gap={2}>
      {used.map((r) => (
        <Text key={r._id} size={1}>
          <IntentLink intent="edit" params={{ id: r._id, type: "retreat" }}>
            {r.title ?? "Retreat"}
          </IntentLink>
          {r.startDate ? ` · ${r.startDate.slice(0, 4)}` : ""}
        </Text>
      ))}
      <Text size={1} muted>
        Een wijziging geldt voor nieuwe inschrijvingen van al deze retreats.{field === "signupForm" ? " Bestaande inschrijvingen houden hun vragen en antwoorden." : ""}
      </Text>
    </Stack>
  );
}
