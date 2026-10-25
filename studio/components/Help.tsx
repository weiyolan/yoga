import { Box, Card, Stack, Text } from "@sanity/ui";

/** Studio → “Zo werkt het”: the edit → publish flow in a few lines (client feedback: drafts were confusing). */
export function Help() {
  return (
    <Box padding={4} style={{ maxWidth: 640 }}>
      <Stack gap={4}>
        <Text size={2} weight="semibold">
          Wijzigen → Publiceren
        </Text>
        <Card padding={4} radius={2} tone="primary" border>
          <Stack gap={3}>
            <Text size={1}>1. Open een document en pas aan: dat wordt automatisch bewaard als concept.</Text>
            <Text size={1}>2. Bekijk het resultaat via Live preview (bovenaan), met je wijzigingen erin.</Text>
            <Text size={1}>3. Klik rechtsonder op Publiceren: pas dan staat het op de website.</Text>
          </Stack>
        </Card>
        <Text size={1} muted>
          Kan je niets wijzigen? Kijk of je een concept bewerkt (niet een oudere versie uit de geschiedenis) en herlaad de pagina.
        </Text>
        <Text size={1} muted>
          Inschrijvingen, berichten en reviews komen binnen via de website. Hun status wijzig je op het tabblad Overzicht. Teksten in het Engels zijn optioneel: leeg = de Nederlandse tekst (of gebruik ✨ Vertaal).
        </Text>
        <Text size={1} muted>
          Bij elke nieuwe inschrijving krijgen jullie een mail. De deelnemer bevestigen: open de inschrijving → Bevestigingsmail. Die opent de tekst uit Bevestigingsmails, al ingevuld, in je eigen mailprogramma.
        </Text>
      </Stack>
    </Box>
  );
}
