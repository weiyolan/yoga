import { AddIcon } from "@sanity/icons/Add";
import { Box, Button, Stack, Text } from "@sanity/ui";
import { useEffect } from "react";
import { useRouter } from "sanity/router";

/**
 * The “+ Nieuwe …” row on top of a list (structure/index.ts liveList): opening it starts a new document
 * right away, the same as the + button top right. The button stays as a fallback.
 */
export function createNew(type: string, title: string, template?: string) {
  const params = template ? { type, template } : { type };
  function CreateNew() {
    const { navigateIntent } = useRouter();
    useEffect(() => navigateIntent("create", params, { replace: true }), [navigateIntent]);
    return (
      <Box padding={4}>
        <Stack gap={3}>
          <Text size={1} muted>
            Een nieuw document wordt geopend…
          </Text>
          <Box>
            <Button icon={AddIcon} text={title} tone="primary" onClick={() => navigateIntent("create", params)} />
          </Box>
        </Stack>
      </Box>
    );
  }
  return CreateNew;
}
