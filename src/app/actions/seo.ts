"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { seoBefund } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import {
  letzte28Tage,
  searchAnalyticsAbfragen,
  verifizierteSiteFinden,
} from "@/lib/search-console";

const anthropic = new Anthropic();

const WEBSITE_URL = "https://www.blitzblank-dienstleistung.com";

type BefundVorschlag = {
  kategorie: string;
  titel: string;
  beschreibung: string;
  freigabeNoetig: boolean;
  quelleUrl?: string;
};

async function befundeSpeichern(befunde: BefundVorschlag[], standardQuelle: string) {
  for (const b of befunde) {
    const existiert = await db.query.seoBefund.findFirst({
      where: ilike(seoBefund.titel, b.titel),
    });
    if (existiert) continue;

    await db.insert(seoBefund).values({
      kategorie: b.kategorie as
        | "technisch"
        | "meta"
        | "content"
        | "backlink"
        | "wettbewerb"
        | "struktur",
      titel: b.titel,
      beschreibung: b.beschreibung,
      freigabeNoetig: b.freigabeNoetig,
      quelleUrl: b.quelleUrl || standardQuelle,
    });
  }
  revalidatePath("/seo");
  revalidatePath("/");
}

const befundVorschlagenTool: Anthropic.Tool = {
  name: "seo_befunde_melden",
  description:
    "Meldet konkrete SEO-Befunde/Empfehlungen zu einer geprüften Website.",
  input_schema: {
    type: "object",
    properties: {
      befunde: {
        type: "array",
        items: {
          type: "object",
          properties: {
            kategorie: {
              type: "string",
              enum: [
                "technisch",
                "meta",
                "content",
                "backlink",
                "wettbewerb",
                "struktur",
              ],
            },
            titel: { type: "string", description: "Kurzer Titel, max. 8 Wörter" },
            beschreibung: {
              type: "string",
              description: "Konkrete Beobachtung + Empfehlung, 1-2 Sätze",
            },
            freigabeNoetig: {
              type: "boolean",
              description:
                "true nur bei strukturellen Änderungen an bestehenden wichtigen Seiten. false für neue Backlinks, neue Landingpages, Content ergänzen, Alt-Texte/Meta-Beschreibungen — das ist autonom erlaubt.",
            },
            quelleUrl: { type: "string" },
          },
          required: ["kategorie", "titel", "beschreibung", "freigabeNoetig"],
        },
      },
    },
    required: ["befunde"],
  },
};

/**
 * Website-Check gemäß Modul 9: prüft die echte Live-Website und meldet
 * konkrete Befunde. Ersetzt noch keine Search-Console-Daten (Rechte-
 * übertragung läuft laut Konzept separat) — das ist reine Website-Analyse.
 */
export async function websiteCheckStarten() {
  try {
    await websiteCheckDurchfuehren();
  } catch (error) {
    console.error("Website-Check fehlgeschlagen:", error);
    throw error;
  }
}

async function websiteCheckDurchfuehren() {
  const antwort = await anthropic.messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 8192,
      tools: [{ type: "web_fetch_20250910", name: "web_fetch", max_uses: 3 }],
      messages: [
        {
          role: "user",
          content: `Prüfe die Website ${WEBSITE_URL} einer Gebäudereinigungsfirma (Blitzblank Dienstleistung UG) aus SEO-Sicht. Rufe die Startseite und maximal 2 Unterseiten ab (z. B. eine Leistungs- und eine Kontaktseite, falls verlinkt).

Prüfe konkret:
- Meta-Titel und Meta-Beschreibungen: vorhanden, sinnvoll formuliert, Keyword-Bezug?
- Überschriftenstruktur (H1/H2)
- Interne Verlinkung zwischen Leistungsseiten
- Hinweise auf Schema.org / strukturierte Daten
- Vorhandensein eines Content-/Blog-Bereichs (bekannte Lücke)
- Sonstige auffällige technische oder inhaltliche SEO-Schwächen

Beschreibe für jeden Befund konkret, was du auf der Seite gesehen hast — keine allgemeinen SEO-Tipps ohne Bezug zur echten Seite. Fasse dich kurz: max. 6 stichpunktartige Befunde, je 1-2 Sätze.`,
        },
      ],
    },
    { headers: { "anthropic-beta": "web-fetch-2025-09-10" } }
  );

  const analyseText = antwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  if (!analyseText.trim()) return;

  const extraktion = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tool_choice: { type: "tool", name: "seo_befunde_melden" },
    tools: [befundVorschlagenTool],
    messages: [
      {
        role: "user",
        content: `Extrahiere aus folgender Website-Analyse konkrete, einzelne SEO-Befunde:\n\n${analyseText}`,
      },
    ],
  });

  const toolUse = extraktion.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const befunde = (toolUse?.input as { befunde?: BefundVorschlag[] } | undefined)
    ?.befunde;

  if (!befunde?.length) return;
  await befundeSpeichern(befunde, WEBSITE_URL);
}

/**
 * Nutzt echte Search-Console-Rankingdaten, um konkrete, priorisierte
 * Maßnahmen zu empfehlen, damit die Firma bei Gebäudereinigungs-Suchanfragen
 * in der Region weiter nach oben kommt.
 */
export async function keywordStrategieErstellen() {
  try {
    await keywordStrategieDurchfuehren();
  } catch (error) {
    console.error("Keyword-Strategie fehlgeschlagen:", error);
    throw error;
  }
}

async function keywordStrategieDurchfuehren() {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Nicht mit Google verbunden.");
  }

  const site = await verifizierteSiteFinden(session.accessToken);
  if (!site) {
    throw new Error(
      "Keine verifizierte Search-Console-Property gefunden. Rechteübertragung eventuell noch nicht abgeschlossen."
    );
  }

  const zeilen = await searchAnalyticsAbfragen(session.accessToken, site.siteUrl, {
    ...letzte28Tage(),
    rowLimit: 50,
  });

  if (!zeilen.length) {
    throw new Error(
      "Search Console liefert noch keine Daten für die letzten 28 Tage."
    );
  }

  const rankingText = zeilen
    .map(
      (z) =>
        `"${z.keys[0]}" — Klicks: ${z.clicks}, Impressionen: ${z.impressions}, CTR: ${(z.ctr * 100).toFixed(1)}%, Ø Position: ${z.position.toFixed(1)}`
    )
    .join("\n");

  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    tool_choice: { type: "tool", name: "seo_befunde_melden" },
    tools: [befundVorschlagenTool],
    messages: [
      {
        role: "user",
        content: `Du bist SEO-Stratege für die Blitzblank Dienstleistung UG, eine Gebäudereinigungsfirma in Berlin/Brandenburg/Potsdam/Dresden. Ziel: Bei Suchanfragen rund um Gebäudereinigung in der Region soll die Firma sichtbarer werden und in den Rankings steigen.

Hier sind die echten Google-Search-Console-Daten der letzten 28 Tage (Suchanfrage, Klicks, Impressionen, CTR, durchschnittliche Position):

${rankingText}

Analysiere: Welche Suchanfragen haben hohe Impressionen aber schlechte Position (>10) oder niedrige CTR trotz guter Position — das sind die größten Chancen. Welche Themen/Keywords rund um Gebäudereinigung fehlen ganz (kein Ranking, obwohl naheliegend)?

Gib 3-6 konkrete, priorisierte Maßnahmen (z. B. "Neue Landingpage für Keyword X", "Meta-Beschreibung für Y optimieren, CTR ist niedrig trotz Position Z", "Content-Idee für Themenlücke W"). Nenne bei jeder Maßnahme das konkrete Keyword und die aktuellen Zahlen.`,
      },
    ],
  });

  const toolUse = antwort.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const befunde = (toolUse?.input as { befunde?: BefundVorschlag[] } | undefined)
    ?.befunde;

  if (!befunde?.length) return;
  await befundeSpeichern(befunde, site.siteUrl);
}

export async function seoBefundFreigeben(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.update(seoBefund).set({ status: "freigegeben" }).where(eq(seoBefund.id, id));
  revalidatePath("/seo");
  revalidatePath("/");
}

export async function seoBefundErledigt(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.update(seoBefund).set({ status: "erledigt" }).where(eq(seoBefund.id, id));
  revalidatePath("/seo");
  revalidatePath("/");
}

export async function seoBefundVerwerfen(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.update(seoBefund).set({ status: "verworfen" }).where(eq(seoBefund.id, id));
  revalidatePath("/seo");
  revalidatePath("/");
}
