import { defineField } from "sanity";
import { apiVersion } from "../../../sanity/site.config";
import { usedByInput } from "../../components/UsedByInput";

/**
 * Reusable documents a retreat picks (sign-up form, confirmation mail): “Standaard” = the one for
 * every retreat that didn't pick one (only one may be standard) + which retreats use it.
 * `field` is the retreat's reference field to this type; `group`: show them in every group.
 */
export const defaultFields = (type: string, field: string, what: string, group?: string[]) => [
  defineField({
    name: "isDefault",
    title: "Standaard",
    type: "boolean",
    group,
    initialValue: false,
    description: `Voor elke retreat zonder eigen ${what}. Zet dit op één document.`,
    validation: (rule) =>
      rule.custom(async (value, ctx) => {
        if (!value) return true;
        const id = ctx.document?._id.replace(/^drafts\./, "");
        const others = await ctx.getClient({ apiVersion }).fetch<number>(`count(*[_type == $type && isDefault == true && !(_id in [$id, "drafts." + $id])])`, { type, id });
        return others ? `Er is al een andere standaard ${what}` : true;
      }),
  }),
  defineField({ name: "usedBy", title: "Gebruikt door", type: "string", group, readOnly: true, components: { input: usedByInput(field) } }),
];
