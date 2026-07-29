"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { firma, aktivitaet, followup, analyseErkenntnis } from "@/db/schema";
import { sql } from "drizzle-orm";
import { mitFreundlicherFehlerbehandlung } from "@/lib/fehler";
import { brancheKategorie, KATEGORIE_LABEL } from "@/lib/branche-kategorie";

const anthropic = new Anthropic();

const MINDEST_FIRMEN = 5;

/**
 * Unternehmensanalyse (Modul 11): reine Auswertungsschicht, keine eigene
 * Dateneingabe. Erkennt Muster und liefert Empfehlungen als Satz, nicht
 * als Rohdaten-Tabelle. Läuft erst ab einer Mindestdatenmenge sinnvoll.
 */
export async function analyseErstellen() {
  await mitFreundlicherFehlerbehandlung(
    "Unternehmensanalyse",
    analyseDurchfuehren,
    "Die Analyse konnte gerade nicht erstellt werden. Bitte in ein paar Minuten erneut versuchen."
  );
}

async function analyseDurchfuehren() {
  const [firmenAnzahl] = await db.select({ n: sql<number>`count(*)` }).from(firma);
  if (Number(firmenAnzahl.n) < MINDEST_FIRMEN) {
    throw new Error(
      `Noch zu wenig Daten für eine verlässliche Analyse (${firmenAnzahl.n} von mindestens ${MINDEST_FIRMEN} Firmen).`
    );
  }

  const nachBranche = await db
    .select({
      branche: firma.branche,
      anzahl: sql<number>`count(*)`,
      kontaktiert: sql<number>`count(*) filter (where ${firma.status} != 'neu' and ${firma.status} != 'vorschlag')`,
      gewonnen: sql<number>`count(*) filter (where ${firma.status} = 'gewonnen')`,
    })
    .from(firma)
    .where(sql`${firma.branche} is not null`)
    .groupBy(firma.branche);

  const alleFirmen = await db
    .select({ name: firma.name, branche: firma.branche, status: firma.status })
    .from(firma);

  const nachKategorie = new Map<string, { anzahl: number; kontaktiert: number; gewonnen: number }>();
  for (const f of alleFirmen) {
    const kategorie = KATEGORIE_LABEL[brancheKategorie(f.branche, f.name)].label;
    const eintrag = nachKategorie.get(kategorie) ?? { anzahl: 0, kontaktiert: 0, gewonnen: 0 };
    eintrag.anzahl++;
    if (f.status !== "neu" && f.status !== "vorschlag") eintrag.kontaktiert++;
    if (f.status === "gewonnen") eintrag.gewonnen++;
    nachKategorie.set(kategorie, eintrag);
  }
  // Nur Kategorien mit genug Datenpunkten fließen in den Vergleich ein --
  // sonst verzerrt eine einzelne Firma die Aussage ("100% Antwortquote").
  const kategorieText = [...nachKategorie.entries()]
    .filter(([, v]) => v.anzahl >= 3)
    .map(
      ([kategorie, v]) =>
        `- ${kategorie}: ${v.anzahl} Firmen, ${v.kontaktiert} kontaktiert (${Math.round((v.kontaktiert / v.anzahl) * 100)}% Kontaktquote), ${v.gewonnen} gewonnen`
    )
    .join("\n");

  const nachRegion = await db
    .select({
      region: firma.region,
      anzahl: sql<number>`count(*)`,
      gewonnen: sql<number>`count(*) filter (where ${firma.status} = 'gewonnen')`,
    })
    .from(firma)
    .where(sql`${firma.region} is not null`)
    .groupBy(firma.region);

  const followupErgebnisse = await db
    .select({
      status: followup.status,
      anzahl: sql<number>`count(*)`,
    })
    .from(followup)
    .groupBy(followup.status);

  const aktivitaetenNachTyp = await db
    .select({ typ: aktivitaet.typ, anzahl: sql<number>`count(*)` })
    .from(aktivitaet)
    .groupBy(aktivitaet.typ);

  const datenText = `Firmen nach Branchen-Kategorie (nur Kategorien mit mindestens 3 Firmen, Kontaktquote = Anteil, der bereits kontaktiert/weiter ist):\n${kategorieText || "Noch keine Kategorie mit ausreichend Datenpunkten."}

Firmen nach roher Branchenbezeichnung:\n${nachBranche
    .map((b) => `- ${b.branche}: ${b.anzahl} Firmen, ${b.kontaktiert} kontaktiert, ${b.gewonnen} gewonnen`)
    .join("\n")}

Firmen nach Region:\n${nachRegion
    .map((r) => `- ${r.region}: ${r.anzahl} Firmen, ${r.gewonnen} gewonnen`)
    .join("\n")}

Follow-up-Ergebnisse:\n${followupErgebnisse.map((f) => `- ${f.status}: ${f.anzahl}`).join("\n")}

Aktivitäten:\n${aktivitaetenNachTyp.map((a) => `- ${a.typ}: ${a.anzahl}`).join("\n")}`;

  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1536,
    messages: [
      {
        role: "user",
        content: `Du analysierst die Akquise-Daten einer Gebäudereinigungsfirma. Hier die aktuellen Zahlen:\n\n${datenText}\n\nFormuliere 3-5 knappe, konkrete Erkenntnisse als einzelne Sätze (keine Tabelle, kein Fließtext-Absatz) — im Stil von: "Hotels reagieren aktuell besser als der Durchschnitt." oder "Brandenburg bringt aktuell mehr Antworten als Berlin." Nutze bevorzugt die Branchen-Kategorie-Vergleichsdaten (sauber gruppiert, mit Kontaktquote), da rohe Brancheneinträge zu uneinheitlich für einen fairen Vergleich sind. Nur Aussagen, die durch die Zahlen oben tatsächlich gedeckt sind — bei zu wenig Datenpunkten für eine Kategorie/Region das lieber weglassen als spekulieren. Eine Erkenntnis pro Zeile, keine Nummerierung, keine Einleitung.`,
      },
    ],
  });

  const text = antwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Analyse lieferte kein Ergebnis. Bitte erneut versuchen.");
  }

  const saetze = text
    .split("\n")
    .map((s) => s.replace(/^[-•\d.]+\s*/, "").trim())
    .filter(Boolean);

  await db.delete(analyseErkenntnis);
  for (const satz of saetze) {
    await db.insert(analyseErkenntnis).values({ text: satz });
  }

  revalidatePath("/analyse");
}
