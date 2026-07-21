"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { seoBefund, seoZielKeyword } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import {
  letzte28Tage,
  positionFuerKeyword,
  searchAnalyticsAbfragen,
  verifizierteSiteFinden,
} from "@/lib/search-console";
import { hintergrundAccessTokenHolen } from "@/lib/google-token";

const anthropic = new Anthropic();

const WEBSITE_URL = "https://www.blitzblank-dienstleistung.com";

type BefundVorschlag = {
  kategorie: string;
  titel: string;
  beschreibung: string;
  freigabeNoetig: boolean;
  quelleUrl?: string;
};

/** Nutzt die Browser-Session, falls vorhanden (manueller Klick), sonst den
 * dauerhaft gespeicherten Refresh-Token (Cron / Hintergrund-Jobs). */
async function googleAccessTokenHolen() {
  const session = await auth();
  if (session?.accessToken) return session.accessToken;
  return hintergrundAccessTokenHolen();
}

async function befundeSpeichern(befunde: BefundVorschlag[], standardQuelle: string) {
  const zielKeywords = await db.query.seoZielKeyword.findMany();
  // Bereits gemeldete Befunde je Kategorie, um Formulierungs-Varianten
  // desselben Themas nicht bei jedem Lauf erneut anzulegen (z. B. "Neue
  // Landingpage: X" vs. "Neue Landingpage für 'X' anlegen").
  const bestehende = await db.query.seoBefund.findMany({
    columns: { kategorie: true, titel: true, beschreibung: true },
  });

  for (const b of befunde) {
    if (!b.titel?.trim() || !b.beschreibung?.trim() || !b.kategorie) continue;

    const exakterTreffer = bestehende.some(
      (e) => e.kategorie === b.kategorie && e.titel.toLowerCase() === b.titel.toLowerCase()
    );
    if (exakterTreffer) continue;

    const betroffenesKeyword = zielKeywords.find((z) =>
      `${b.titel} ${b.beschreibung}`.toLowerCase().includes(z.keyword.toLowerCase())
    );
    if (betroffenesKeyword) {
      const bereitsGemeldet = bestehende.some(
        (e) =>
          e.kategorie === b.kategorie &&
          `${e.titel} ${e.beschreibung}`.toLowerCase().includes(betroffenesKeyword.keyword.toLowerCase())
      );
      if (bereitsGemeldet) continue;
    }

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
    bestehende.push({ kategorie: b.kategorie as (typeof bestehende)[number]["kategorie"], titel: b.titel, beschreibung: b.beschreibung });
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
    max_tokens: 4096,
    tool_choice: { type: "tool", name: "seo_befunde_melden" },
    tools: [befundVorschlagenTool],
    messages: [
      {
        role: "user",
        content: `Extrahiere aus folgender Website-Analyse konkrete, einzelne SEO-Befunde:\n\n${analyseText}`,
      },
    ],
  });

  if (extraktion.stop_reason === "max_tokens") {
    throw new Error(
      "Antwort wurde beim Erstellen abgeschnitten (zu lang). Bitte erneut versuchen."
    );
  }

  const toolUse = extraktion.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const befunde = (toolUse?.input as { befunde?: BefundVorschlag[] } | undefined)
    ?.befunde;

  if (!befunde?.length) {
    throw new Error("Keine Befunde erhalten. Bitte erneut versuchen.");
  }
  await befundeSpeichern(befunde, WEBSITE_URL);
}

export async function zielKeywordHinzufuegen(formData: FormData) {
  const keyword = (formData.get("keyword") as string)?.trim();
  if (!keyword) return;

  const existiert = await db.query.seoZielKeyword.findFirst({
    where: ilike(seoZielKeyword.keyword, keyword),
  });
  if (!existiert) {
    await db.insert(seoZielKeyword).values({ keyword });
  }
  revalidatePath("/seo");
}

export async function zielKeywordEntfernen(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await db.delete(seoZielKeyword).where(eq(seoZielKeyword.id, id));
  revalidatePath("/seo");
}

/**
 * Prüft für jedes Ziel-Keyword die echte aktuelle Google-Position und
 * speichert sie. Läuft sowohl manuell (Button) als auch automatisch
 * per Cron — deshalb kein direkter auth()-Zwang, sondern der Fallback
 * auf den dauerhaft gespeicherten Google-Zugang.
 */
export async function zielKeywordsAktualisieren() {
  const accessToken = await googleAccessTokenHolen();
  if (!accessToken) {
    throw new Error("Nicht mit Google verbunden.");
  }

  const site = await verifizierteSiteFinden(accessToken);
  if (!site) {
    throw new Error("Keine verifizierte Search-Console-Property gefunden.");
  }

  const keywords = await db.query.seoZielKeyword.findMany();

  for (const k of keywords) {
    const ergebnis = await positionFuerKeyword(accessToken, site.siteUrl, k.keyword);
    await db
      .update(seoZielKeyword)
      .set({
        aktuellePosition: ergebnis?.position ?? null,
        impressionen: ergebnis?.impressionen ?? null,
        klicks: ergebnis?.klicks ?? null,
        zuletztGeprueftAm: new Date(),
      })
      .where(eq(seoZielKeyword.id, k.id));
  }

  revalidatePath("/seo");
  revalidatePath("/");
}

/**
 * Baut aktiv auf die vom Nutzer festgelegten Ziel-Keywords hin auf (z. B.
 * "Gebäudereinigung Berlin") — nicht nur eine Analyse dessen, was bereits
 * rankt. Echte Search-Console-Daten dienen dabei als Kontext, wo vorhanden.
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
  const zielKeywords = await db.query.seoZielKeyword.findMany({
    orderBy: (k, { asc }) => asc(k.erstelltAm),
  });

  let rankingKontext =
    "Nicht mit Google Search Console verbunden — keine echten Rankingdaten verfügbar.";
  let quelle = WEBSITE_URL;

  const accessToken = await googleAccessTokenHolen();
  if (accessToken) {
    try {
      const site = await verifizierteSiteFinden(accessToken);
      if (site) {
        quelle = site.siteUrl;
        const zeilen = await searchAnalyticsAbfragen(accessToken, site.siteUrl, {
          ...letzte28Tage(),
          rowLimit: 50,
        });
        rankingKontext = zeilen.length
          ? zeilen
              .map(
                (z) =>
                  `"${z.keys[0]}" — Klicks: ${z.clicks}, Impressionen: ${z.impressions}, CTR: ${(z.ctr * 100).toFixed(1)}%, Ø Position: ${z.position.toFixed(1)}`
              )
              .join("\n")
          : "Verbunden, aber noch keine Suchdaten für die letzten 28 Tage.";
      }
    } catch (error) {
      console.error("Search-Console-Daten konnten nicht geladen werden:", error);
    }
  }

  if (zielKeywords.length === 0 && rankingKontext.startsWith("Nicht mit Google")) {
    throw new Error(
      "Weder Ziel-Keywords festgelegt noch Search-Console-Daten vorhanden. Trag zuerst mindestens ein Ziel-Keyword ein."
    );
  }

  const prompt =
    zielKeywords.length > 0
      ? `Du bist SEO-Stratege für die Blitzblank Dienstleistung UG, eine Gebäudereinigungsfirma in Berlin/Brandenburg/Potsdam/Dresden.

Der Nutzer hat diese Ziel-Keywords festgelegt — die Firma soll dafür bei Google auf Platz 1 stehen, unabhängig davon, ob dafür aktuell schon ein Ranking existiert:

${zielKeywords.map((k) => `- ${k.keyword}`).join("\n")}

Echte Google-Search-Console-Daten der letzten 28 Tage als Kontext (zeigt, wofür die Seite aktuell überhaupt gefunden wird):

${rankingKontext}

Bekannt: Die Website hat noch keinen Content-/Blog-Bereich und bislang kaum generische (nicht markengebundene) Rankings — fast alle bisherigen Suchanfragen enthalten "blitz"/"blank".

Erstelle für JEDES Ziel-Keyword mindestens einen konkreten Befund mit Umsetzungsplan: Soll eine neue, dedizierte Landingpage her? Nenne einen konkreten URL-Vorschlag (z. B. /leistungen/gebaeudereinigung-berlin), einen Title-Tag-Vorschlag, eine H1 und den inhaltlichen Fokus (z. B. welche Unterthemen, lokale Bezüge, FAQs). Prüfe auch, ob eine bereits vorhandene Seite stattdessen nur optimiert werden sollte. Sei konkret und umsetzbar, keine generischen SEO-Tipps. Max. 8 Befunde insgesamt.`
      : `Du bist SEO-Stratege für die Blitzblank Dienstleistung UG, eine Gebäudereinigungsfirma in Berlin/Brandenburg/Potsdam/Dresden. Ziel: Bei Suchanfragen rund um Gebäudereinigung in der Region soll die Firma sichtbarer werden und in den Rankings steigen.

Echte Google-Search-Console-Daten der letzten 28 Tage:

${rankingKontext}

Analysiere: Welche Suchanfragen haben hohe Impressionen aber schlechte Position (>10) oder niedrige CTR trotz guter Position — das sind die größten Chancen. Welche Themen/Keywords rund um Gebäudereinigung fehlen ganz (kein Ranking, obwohl naheliegend)?

Gib 3-6 konkrete, priorisierte Maßnahmen. Nenne bei jeder Maßnahme das konkrete Keyword und die aktuellen Zahlen.`;

  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    tool_choice: { type: "tool", name: "seo_befunde_melden" },
    tools: [befundVorschlagenTool],
    messages: [{ role: "user", content: prompt }],
  });

  if (antwort.stop_reason === "max_tokens") {
    throw new Error(
      "Antwort wurde beim Erstellen abgeschnitten (zu lang). Bitte erneut versuchen."
    );
  }

  const toolUse = antwort.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const befunde = (toolUse?.input as { befunde?: BefundVorschlag[] } | undefined)
    ?.befunde;

  if (!befunde?.length) {
    throw new Error("Keine Befunde erhalten. Bitte erneut versuchen.");
  }
  await befundeSpeichern(befunde, quelle);
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
