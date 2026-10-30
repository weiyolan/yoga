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
          Iets toevoegen (een samenwerking, stijl, studio, formulier, mail of retreat): open het menu links, dan het + rechtsboven of de rij “+ Nieuwe …” bovenaan de lijst. Vul in en klik Publiceren.
        </Text>
        <Text size={1} muted>
          Iemand van Over ons halen: open de persoon, zet “Verbergen op Over ons” aan en publiceer (blijft bij oude retreats staan, later terug te zetten). Verwijderen (⋯ → Verwijderen) haalt de persoon overal weg; dat lukt pas als die nergens meer bij “Begeleiding” staat.
        </Text>
        <Text size={1} muted>
          Inschrijvingen, berichten en reviews komen binnen via de website. Hun status wijzig je op het tabblad Overzicht. Teksten in het Engels zijn optioneel: leeg = de Nederlandse tekst. Elk tweetalig veld heeft tabs NL | EN (een • = nog leeg) en een knop Vertaal; alles in één keer: Vertalen (AI) in het menu.
        </Text>
        <Text size={1} muted>
          Tekst tussen [haken], zoals [IBAN], moet nog ingevuld worden: dat veld krijgt een gele waarschuwing, en “Nog in te vullen [ ]” in het menu toont alle plaatsen.
        </Text>
        <Text size={1} muted>
          Bij elke nieuwe inschrijving krijgen jullie een mail. De deelnemer bevestigen: open de inschrijving → Bevestigingsmail. Die gebruikt de tekst uit Mails → Inschrijving bevestiging. Elke mail heeft rechts een voorbeeld (het oog bovenaan).
        </Text>
        <Text size={1} muted>
          Nieuwsbrief: Contact → Nieuwsbrieven → +. Schrijf, kijk het voorbeeld rechts na, stuur een testmail naar jezelf, publiceer, dan “Nieuwsbrief versturen…” onderaan. Het paneel rechts toont bij welke stap je bent. Wie hem krijgt zie je in Contact → Contactboek.
        </Text>
        <Text size={1} muted>
          Google: elke pagina en retreat heeft “SEO & delen” met bovenaan een voorbeeld van hoe Google ze toont (NL en EN). Geef elke pagina een eigen beschrijving van 120–155 tekens; leeg = de introtekst. Elke foto in de Fotobank een alt-tekst (Fotobank → Alt-teksten aanvullen).
        </Text>
      </Stack>
    </Box>
  );
}
