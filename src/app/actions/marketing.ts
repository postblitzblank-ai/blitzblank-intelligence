"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { chance, firma } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

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
              enum: ["bauprojekt", "wettbewerb", "expansion"],
            },
            beschreibung: {
              type: "string",
              description: "Konkrete Beobachtung in 1-2 Sätzen, mit Bezug zur Quelle",
            },
            quelleUrl: { type: "string" },
          },
          required: ["titel", "signaltyp", "beschreibung"],
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
  try {
    await chanceRadarDurchfuehren();
  } catch (error) {
    console.error("Chancen-Radar fehlgeschlagen:", error);
    throw error;
  }
}

async function chanceRadarDurchfuehren() {
  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    messages: [
      {
        role: "user",
        content: `Du beobachtest den Markt für eine Gebäudereinigungsfirma (Blitzblank Dienstleistung UG) in Berlin, Brandenburg, Potsdam und Dresden. Suche nach aktuellen (möglichst den letzten 1-3 Monaten) Signalen in drei Kategorien:

1. Bauprojekte: neue Bürogebäude, Gewerbeparks, Kliniken, Hotels, Logistikzentren, Pflegeheime im Bau oder kurz vor Fertigstellung — die brauchen bald Reinigungsdienstleister.
2. Expansion: Unternehmen, die neue Standorte/Niederlassungen in der Region eröffnen.
3. Wettbewerb: Hinweise auf Probleme bei Mitbewerbern (schlechte Bewertungen, Insolvenzen, Beschwerden über Reinigungsdienstleister) — mögliche Wechselbereitschaft.

Nenne 4-8 konkrete, aktuelle Signale mit Quelle. Keine Erfindungen — nur was du in der Websuche tatsächlich findest.`,
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
    max_tokens: 3072,
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
            signaltyp: "bauprojekt" | "wettbewerb" | "expansion";
            beschreibung: string;
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
      quelleUrl: c.quelleUrl || null,
    });
  }

  revalidatePath("/marketing");
  revalidatePath("/");
}

/**
 * Sobald ein Kontakt gefunden ist, wandert das Signal in den
 * Direktkunden-Agenten (Konzept Modul 10) — als Vorschlag, damit der
 * bestehende Übernehmen/Verwerfen-Workflow greift.
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
}

export async function chanceVerwerfen(formData: FormData) {
  const chanceId = formData.get("chanceId") as string;
  if (!chanceId) return;
  await db.update(chance).set({ status: "verworfen" }).where(eq(chance.id, chanceId));
  revalidatePath("/marketing");
}
