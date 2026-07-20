"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { firma } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";

const anthropic = new Anthropic();

const modulPfad = {
  direktkunde: "/direktkunden",
  nachunternehmer: "/nachunternehmer",
} as const;

const rechercheAuftrag = {
  direktkunde:
    "Direktkunden für eine Gebäudereinigungsfirma (Blitzblank Dienstleistung UG) in Berlin, Brandenburg, Potsdam oder Dresden. Gesucht sind Unternehmen mit erkennbarem Reinigungsbedarf: Bürogebäude, Kliniken, Hotels, Pflegeheime, Neubauten, Logistikzentren.",
  nachunternehmer:
    "Firmen, die Reinigungsleistungen an Subunternehmer/Nachunternehmer vergeben (Facility-Management-Firmen, große Gebäudedienstleister) im Raum Berlin, Brandenburg, Potsdam oder Dresden — insbesondere solche, die aktuell erkennbar Subunternehmer suchen.",
} as const;

const firmenVorschlagenTool: Anthropic.Tool = {
  name: "firmen_vorschlagen",
  description:
    "Extrahiert konkrete, namentlich benannte Firmen als Akquise-Vorschläge aus einem Rechercheergebnis. Nur echte, im Text genannte Firmen aufnehmen, keine Erfindungen.",
  input_schema: {
    type: "object",
    properties: {
      firmen: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            branche: { type: "string" },
            region: { type: "string" },
            begruendung: {
              type: "string",
              description:
                'Kurzer Klartext-Grund in einem Satz, z. B. "sucht Subunternehmer für Gebäudereinigung" oder "neue Niederlassung im Aufbau".',
            },
          },
          required: ["name", "begruendung"],
        },
      },
    },
    required: ["firmen"],
  },
};

export async function firmenRecherche(formData: FormData) {
  const typ = formData.get("typ") as "direktkunde" | "nachunternehmer";
  const hinweis = (formData.get("hinweis") as string)?.trim();
  if (!modulPfad[typ]) return;

  const rechercheAntwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1536,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
    messages: [
      {
        role: "user",
        content: `Recherchiere im Web nach: ${rechercheAuftrag[typ]}${
          hinweis ? `\n\nZusätzlicher Hinweis vom Nutzer: ${hinweis}` : ""
        }\n\nNenne 3-6 konkrete, real existierende Firmen mit Name, Ort und einem kurzen Grund, warum sie ein passender Kontakt sind (z. B. Stellenanzeige, Expansion, öffentlich bekannter Bedarf). Nutze für jede Angabe eine Quelle aus deiner Websuche.`,
      },
    ],
  });

  const rechercheText = rechercheAntwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  if (!rechercheText.trim()) return;

  const extraktion = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    tool_choice: { type: "tool", name: "firmen_vorschlagen" },
    tools: [firmenVorschlagenTool],
    messages: [
      {
        role: "user",
        content: `Extrahiere aus folgendem Rechercheergebnis konkrete, namentlich benannte Firmen als Vorschläge:\n\n${rechercheText}`,
      },
    ],
  });

  const toolUse = extraktion.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const firmenListe = (toolUse?.input as { firmen?: unknown[] } | undefined)
    ?.firmen as
    | { name: string; branche?: string; region?: string; begruendung: string }[]
    | undefined;

  if (!firmenListe?.length) return;

  for (const kandidat of firmenListe) {
    const existiert = await db.query.firma.findFirst({
      where: and(eq(firma.typ, typ), ilike(firma.name, kandidat.name)),
    });
    if (existiert) continue;

    await db.insert(firma).values({
      typ,
      name: kandidat.name,
      branche: kandidat.branche || null,
      region: kandidat.region || null,
      herkunftKanal: "ausgehend",
      status: "vorschlag",
      begruendung: kandidat.begruendung,
    });
  }

  revalidatePath(modulPfad[typ]);
}

export async function vorschlagUebernehmen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  if (!firmaId) return;

  await db
    .update(firma)
    .set({ status: "neu", aktualisiertAm: new Date() })
    .where(eq(firma.id, firmaId));

  revalidatePath("/direktkunden");
  revalidatePath("/nachunternehmer");
}

export async function vorschlagVerwerfen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  if (!firmaId) return;

  await db.delete(firma).where(eq(firma.id, firmaId));

  revalidatePath("/direktkunden");
  revalidatePath("/nachunternehmer");
}
