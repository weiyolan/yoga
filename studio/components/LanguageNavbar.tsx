import { Box, Button, Card, Flex } from "@sanity/ui";
import type { NavbarProps } from "sanity";
import { languages } from "../../sanity/site.config";
import { toggleLanguage, useShownLanguages } from "./languageStore";

/** Studio navbar + a global language toggle (top right): which languages localized fields show. */
export function LanguageNavbar(props: NavbarProps) {
  const shown = useShownLanguages();
  return (
    <Card borderBottom>
      <Flex align="center">
        <Box flex={1}>{props.renderDefault(props)}</Box>
        <Flex gap={1} paddingX={3}>
          {languages.map((l) => (
            <Button
              key={l.id}
              text={l.id.toUpperCase()}
              title={`${l.title} ${shown.includes(l.id) ? "verbergen" : "tonen"}`}
              mode={shown.includes(l.id) ? "default" : "ghost"}
              tone={shown.includes(l.id) ? "primary" : "default"}
              fontSize={1}
              padding={2}
              onClick={() => toggleLanguage(l.id)}
            />
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}
