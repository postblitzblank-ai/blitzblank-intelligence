"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { firma, ansprechpartner } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";

const anthropic = new Anthropic();

const modulPfad = {
  direktkunde: "/direktkunden",
  nachunternehmer: "/nachunternehmer",
} as const;

const rechercheAuftrag = {
  direktkunde:
    "Direktkunden für eine Gebäudereinigungsfirma (Blitzblank Dienstleistung UG) in Berlin, Brandenburg, Potsdam oder Dresden. Gesucht sind Unternehmen mit erkennbarem Reinigungsbedarf: Bürogebäude, Kliniken, Hotels, Pflegeheime, Neubauten, Logistikzentren. Besonders wertvoll: Firmen, die gerade eine neue Niederlassung/einen neuen Standort in der Region eröffnen, oder ein neues Objekt/Gebäude übernehmen (erkennbar an Presseartikeln, Stellenanzeigen für den neuen Standort, Handelsregister-Neueintragungen).",
  nachunternehmer:
    "Firmen, die Reinigungsleistungen an Subunternehmer/Nachunternehmer vergeben (Facility-Management-Firmen, große Gebäudedienstleister) im Raum Berlin, Brandenburg, Potsdam oder Dresden. Suche gezielt nach diesen Signalen: (1) Firmen, die aktuell erkennbar Subunternehmer/Nachunternehmer für die Reinigung suchen (Ausschreibungen, Stellenanzeigen für 'Nachunternehmer gesucht'); (2) Firmen, die gerade eine neue Niederlassung eröffnen oder in die Region expandieren; (3) Firmen, die erkennbar neue Objekte/Gebäude/Verträge übernommen haben und dafür Kapazität brauchen; (4) Firmen mit auffällig vielen, aktuellen Stellenanzeigen für Reinigungskräfte (Hinweis auf Personalmangel/Wachstum, oft ein Vorbote für Subunternehmer-Bedarf); (5) Firmen mit erkennbarem kurzfristigem/dringendem Personalbedarf (Formulierungen wie 'sofort', 'ab sofort', 'dringend gesucht').",
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
            email: {
              type: "string",
              description:
                "Allgemeine Firmen-E-Mail (z. B. info@firma.de), NUR wenn tatsächlich auf der Website gefunden. Niemals raten oder erfinden.",
            },
            ansprechpartnerNachname: {
              type: "string",
              description:
                "Nachname eines konkreten Ansprechpartners, NUR wenn explizit namentlich auf der Website genannt (z. B. Impressum, Team-Seite). Sonst weglassen.",
            },
            ansprechpartnerAnrede: {
              type: "string",
              enum: ["Herr", "Frau"],
              description:
                "NUR setzen, wenn auf der Quelle explizit 'Herr'/'Frau' oder ein eindeutiger Titel (z. B. 'Ansprechpartnerin') beim Namen steht. Im Zweifel weglassen, niemals aus dem Vornamen raten.",
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

  const rechercheAntwort = await anthropic.messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: 4 },
        { type: "web_fetch_20250910", name: "web_fetch", max_uses: 4 },
      ],
      messages: [
        {
          role: "user",
          content: `Recherchiere im Web nach: ${rechercheAuftrag[typ]}${
            hinweis ? `\n\nZusätzlicher Hinweis vom Nutzer: ${hinweis}` : ""
          }\n\nNenne 3-6 konkrete, real existierende Firmen mit Name, Ort und einem kurzen Grund, warum sie ein passender Kontakt sind (z. B. Stellenanzeige, Expansion, öffentlich bekannter Bedarf). Nutze für jede Angabe eine Quelle aus deiner Websuche.\n\nRufe anschließend für jede gefundene Firma kurz die eigene Website auf (Kontakt-/Impressum-Seite) und notiere, falls vorhanden: die allgemeine E-Mail-Adresse (z. B. info@...) und einen namentlich genannten Ansprechpartner samt eindeutiger Anrede (nur wenn "Herr"/"Frau" oder ein eindeutiger Titel wörtlich dabeisteht — sonst nichts dazu schreiben, nicht raten).`,
        },
      ],
    },
    { headers: { "anthropic-beta": "web-fetch-2025-09-10" } }
  );

  const rechercheText = rechercheAntwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  if (!rechercheText.trim()) {
    throw new Error("Recherche lieferte kein Ergebnis. Bitte erneut versuchen.");
  }

  const extraktion = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tool_choice: { type: "tool", name: "firmen_vorschlagen" },
    tools: [firmenVorschlagenTool],
    messages: [
      {
        role: "user",
        content: `Extrahiere aus folgendem Rechercheergebnis konkrete, namentlich benannte Firmen als Vorschläge:\n\n${rechercheText}`,
      },
    ],
  });

  if (extraktion.stop_reason === "max_tokens") {
    throw new Error("Antwort wurde abgeschnitten (zu lang). Bitte erneut versuchen.");
  }

  const toolUse = extraktion.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const firmenListe = (toolUse?.input as { firmen?: unknown[] } | undefined)
    ?.firmen as
    | {
        name: string;
        branche?: string;
        region?: string;
        begruendung: string;
        email?: string;
        ansprechpartnerNachname?: string;
        ansprechpartnerAnrede?: "Herr" | "Frau";
      }[]
    | undefined;

  if (!firmenListe?.length) {
    throw new Error("Keine konkreten Firmen gefunden. Bitte erneut versuchen.");
  }

  for (const kandidat of firmenListe) {
    if (!kandidat.name?.trim() || !kandidat.begruendung?.trim()) continue;

    const existiert = await db.query.firma.findFirst({
      where: and(eq(firma.typ, typ), ilike(firma.name, kandidat.name)),
    });
    if (existiert) continue;

    const [neu] = await db
      .insert(firma)
      .values({
        typ,
        name: kandidat.name,
        branche: kandidat.branche || null,
        region: kandidat.region || null,
        email: kandidat.email || null,
        herkunftKanal: "ausgehend",
        status: "vorschlag",
        begruendung: kandidat.begruendung,
      })
      .returning({ id: firma.id });

    if (kandidat.ansprechpartnerNachname) {
      await db.insert(ansprechpartner).values({
        firmaId: neu.id,
        nachname: kandidat.ansprechpartnerNachname,
        anrede: kandidat.ansprechpartnerAnrede || null,
        email: kandidat.email || null,
      });
    }
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
