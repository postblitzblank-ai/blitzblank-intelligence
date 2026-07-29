"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { chance, firma } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { mitFreundlicherFehlerbehandlung } from "@/lib/fehler";
import { firmaAutomatischVervollstaendigen } from "@/app/actions/recherche";

const anthropic = new Anthropic();

const chancenVorschlagenTool: Anthropic.Tool = {
  name: "chancen_melden",
  description:
    "Meldet konkrete Marktchancen (Bauprojekte, Expansionen, Wettbewerbsschwächen, Marktlücken) für eine Gebäudereinigungsfirma.",
  input_schema: {
    type: "object",
    properties: {
      chancen: {
        type: "array",
        items: {
          type: "object",
          properties: {
            titel: { type: "string", description: "Kurzer Titel, max. 10 Wörter" },
            signaltyp: {
              type: "string",
              enum: ["bauprojekt", "wettbewerb", "expansion", "ausschreibung"],
              description:
                '"ausschreibung" für neu vergebene/gewonnene Reinigungs- oder FM-Aufträge (z. B. "Firma X gewinnt Ausschreibung für Objekt Y") oder laufende, öffentlich bekannte Ausschreibungen.',
            },
            beschreibung: {
              type: "string",
              description:
                "Konkrete Beobachtung in 2-4 Sätzen, mit Bezug zur Quelle. Bei Wettbewerbsschwäche/Insolvenz: wenn bekannt, welche Kunden/Aufträge/Standorte betroffen waren; sonst plausibel einordnen (z. B. übliche Kundengruppen dieser Firmengröße/Region).",
            },
            tiefenanalyse: {
              type: "string",
              description:
                'NUR bei signaltyp "wettbewerb" (Insolvenz/Geschäftsaufgabe/Schwäche eines Mitbewerbers): eine strukturierte Analyse in 3-5 Sätzen, die konkret durchgeht: (1) Welche Objekte/Standorte/Kundentypen hatte diese Firma vermutlich oder nachweislich betreut? (2) Wo liegen diese geografisch? (3) Wer übernimmt diese Objekte wahrscheinlich (andere Facility-Management-Firmen, die in der Region aktiv sind und wachsen)? (4) Welche konkrete Chance ergibt sich daraus für Blitzblank, und wie zeitkritisch ist sie? Wenn Details unbekannt sind, das offen so benennen und stattdessen plausibel aus Firmengröße/Region/Branche ableiten statt zu erfinden. Bei bauprojekt/expansion leer lassen.',
            },
            handlungsempfehlung: {
              type: "string",
              description:
                'Ein konkreter, umsetzbarer nächster Schritt für den Nutzer in 1-3 Sätzen. Z.B. bei Insolvenz/Auftragsverlust: "Diese Firma hat vermutlich Aufträge bei [Kundentyp] in [Region] verloren — sprich gezielt Hausverwaltungen/Objekte in diesem Umkreis an, die kürzlich den Reinigungsdienstleister gewechselt haben könnten." Bei Bauprojekt: konkret nennen, wen man ansprechen sollte (Bauträger, Projektentwickler, Hausverwaltung) und wann (z.B. "jetzt vor Fertigstellung kontaktieren, bevor ein Wettbewerber den Zuschlag bekommt"). Wenn kein konkreter Ansprechpartner bekannt ist, das transparent so sagen und stattdessen einen Rechercheweg vorschlagen (z.B. "Bauleiter über die Baustellentafel oder den Bauträger direkt ermitteln").',
            },
            quelleUrl: { type: "string" },
          },
          required: ["titel", "signaltyp", "beschreibung", "handlungsempfehlung"],
        },
      },
    },
    required: ["chancen"],
  },
};

/**
 * Chancen-Radar (Modul 10): sucht aktiv nach Signalen, bevor ein Kontakt
 * bekannt ist. Reift hier, bis die KI eine konkrete Firma daraus macht.
 */
export async function chanceRadarStarten() {
  await mitFreundlicherFehlerbehandlung(
    "Chancen-Radar",
    chanceRadarDurchfuehren,
    "Das Chancen-Radar konnte gerade nicht laufen. Bitte in ein paar Minuten erneut versuchen."
  );
}

async function chanceRadarDurchfuehren() {
  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 6144,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
    messages: [
      {
        role: "user",
        content: `Du beobachtest den Markt für eine Gebäudereinigungsfirma (Blitzblank Dienstleistung UG) in Berlin, Brandenburg, Potsdam und Dresden. Suche nach aktuellen (möglichst den letzten 1-3 Monaten) Signalen in vier Kategorien:

1. Bauprojekte: neue Bürogebäude, Gewerbeparks, Kliniken, Hotels, Logistikzentren, Pflegeheime im Bau oder kurz vor Fertigstellung — die brauchen bald Reinigungsdienstleister. Wenn möglich: wer ist Bauträger/Projektentwickler/Hausverwaltung, gibt es einen namentlich genannten Ansprechpartner (Projektleiter, Geschäftsführer)?
2. Expansion: Unternehmen, die neue Standorte/Niederlassungen in der Region eröffnen, oder auffällig viele aktuelle Stellenanzeigen für Objektleiter/Reinigungspersonal schalten (oft ein Vorbote für neue Aufträge/Kapazitätsbedarf).
3. Wettbewerb: Hinweise auf Probleme bei Mitbewerbern (schlechte Bewertungen, Insolvenzen, Geschäftsaufgaben, Beschwerden über Reinigungsdienstleister) — mögliche Wechselbereitschaft. Wenn eine Reinigungsfirma insolvent ist oder aufgibt, gehe die Analyse vollständig durch, nicht nur die reine Meldung: (a) welche Kunden/Objekte/Standorte hat sie betreut (Referenzen auf der Website, Presseartikel, Handelsregister-Bekanntmachungen)? (b) wo liegen diese Objekte geografisch? (c) welche anderen Facility-Management-/Reinigungsfirmen sind in genau dieser Region aktiv und könnten die Objekte übernehmen (recherchiere nach wachsenden Wettbewerbern dort)? (d) welche konkrete, zeitkritische Chance ergibt sich daraus für Blitzblank?
4. Ausschreibungen/Auftragsgewinne: öffentlich bekannte, neu vergebene oder gewonnene Reinigungs-/FM-Ausschreibungen (z. B. Vergabeplattformen, Pressemitteilungen "Firma X übernimmt Reinigung für Objekt Y"), auch wenn ein Wettbewerber gewonnen hat — das zeigt, welche Objekte gerade neu vergeben werden und wer in der Region aktiv mitbietet.

Nenne 4-8 konkrete, aktuelle Signale mit Quelle. Für jedes Signal: recherchiere aktiv nach einem konkreten nächsten Schritt (wen kontaktieren, welche Kunden/Objekte betroffen sein könnten) statt nur die reine Beobachtung zu melden. Keine Erfindungen — nur was du in der Websuche tatsächlich findest; wenn ein Detail (z. B. Ansprechpartner) nicht auffindbar ist, sag das ehrlich statt zu raten, plausible Einordnungen (z. B. wahrscheinliche Nachfolger) aber klar als Einschätzung kennzeichnen.`,
      },
    ],
  });

  const analyseText = antwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  if (!analyseText.trim()) {
    throw new Error("Chancen-Radar lieferte kein Ergebnis. Bitte erneut versuchen.");
  }

  const extraktion = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    tool_choice: { type: "tool", name: "chancen_melden" },
    tools: [chancenVorschlagenTool],
    messages: [
      {
        role: "user",
        content: `Extrahiere aus folgender Marktbeobachtung konkrete, einzelne Chancen:\n\n${analyseText}`,
      },
    ],
  });

  if (extraktion.stop_reason === "max_tokens") {
    throw new Error("Antwort wurde abgeschnitten (zu lang). Bitte erneut versuchen.");
  }

  const toolUse = extraktion.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const chancenListe = (
    toolUse?.input as
      | {
          chancen?: {
            titel: string;
            signaltyp: "bauprojekt" | "wettbewerb" | "expansion" | "ausschreibung";
            beschreibung: string;
            tiefenanalyse?: string;
            handlungsempfehlung?: string;
            quelleUrl?: string;
          }[];
        }
      | undefined
  )?.chancen;

  if (!chancenListe?.length) {
    throw new Error("Keine konkreten Chancen gefunden. Bitte erneut versuchen.");
  }

  for (const c of chancenListe) {
    if (!c.titel?.trim() || !c.signaltyp || !c.beschreibung?.trim()) continue;

    const existiert = await db.query.chance.findFirst({
      where: ilike(chance.titel, c.titel),
    });
    if (existiert) continue;

    await db.insert(chance).values({
      titel: c.titel,
      signaltyp: c.signaltyp,
      beschreibung: c.beschreibung,
      tiefenanalyse: c.tiefenanalyse?.trim() || null,
      handlungsempfehlung: c.handlungsempfehlung?.trim() || null,
      quelleUrl: c.quelleUrl || null,
    });
  }

  revalidatePath("/marketing");
  revalidatePath("/");
}

/**
 * Sobald ein Kontakt gefunden ist, wandert das Signal in den
 * Direktkunden-Agenten (Konzept Modul 10) — als Vorschlag, damit der
 * bestehende Übernehmen/Verwerfen-Workflow greift. Danach läuft sofort die
 * automatische Kette weiter (Grundregel 3: Signal -> Recherche -> Kontakt ->
 * E-Mail-Entwurf), damit der Nutzer keinen Zwischenschritt selbst anstoßen
 * muss -- ein Fehler dabei darf die eigentliche Firmen-Anlage nicht
 * verhindern, deshalb separat abgefangen.
 */
export async function chanceZuFirma(formData: FormData) {
  const chanceId = formData.get("chanceId") as string;
  const firmenname = (formData.get("firmenname") as string)?.trim();
  if (!chanceId || !firmenname) return;

  const c = await db.query.chance.findFirst({ where: eq(chance.id, chanceId) });
  if (!c) return;

  const [neueFirma] = await db
    .insert(firma)
    .values({
      typ: "direktkunde",
      name: firmenname,
      herkunftKanal: "ausgehend",
      status: "vorschlag",
      begruendung: c.beschreibung,
    })
    .returning({ id: firma.id });

  await db
    .update(chance)
    .set({ status: "zu_firma_gereift", firmaId: neueFirma.id })
    .where(eq(chance.id, chanceId));

  revalidatePath("/marketing");
  revalidatePath("/direktkunden");

  try {
    await firmaAutomatischVervollstaendigen(neueFirma.id);
  } catch (error) {
    console.error("Automatische Vervollständigung nach Chance-Reifung fehlgeschlagen:", error);
  }

  revalidatePath("/direktkunden");
  revalidatePath(`/direktkunden/${neueFirma.id}`);
}

export async function chanceVerwerfen(formData: FormData) {
  const chanceId = formData.get("chanceId") as string;
  if (!chanceId) return;
  await db.update(chance).set({ status: "verworfen" }).where(eq(chance.id, chanceId));
  revalidatePath("/marketing");
}
