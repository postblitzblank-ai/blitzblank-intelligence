"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { firma, ansprechpartner } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { mitFreundlicherFehlerbehandlung } from "@/lib/fehler";

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
            website: {
              type: "string",
              description: "Offizielle Website-URL der Firma, NUR wenn tatsächlich gefunden.",
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

  await mitFreundlicherFehlerbehandlung(
    "KI-Recherche",
    () => firmenRechercheDurchfuehren(typ, hinweis),
    "Die KI-Recherche konnte gerade nicht abgeschlossen werden. Bitte in ein paar Minuten erneut versuchen."
  );
}

async function firmenRechercheDurchfuehren(
  typ: "direktkunde" | "nachunternehmer",
  hinweis: string
) {
  const rechercheAntwort = await anthropic.messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 8192,
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: 6 },
        { type: "web_fetch_20250910", name: "web_fetch", max_uses: 6 },
      ],
      messages: [
        {
          role: "user",
          content: `Recherchiere im Web nach: ${rechercheAuftrag[typ]}${
            hinweis ? `\n\nZusätzlicher Hinweis vom Nutzer: ${hinweis}` : ""
          }\n\nNenne 3-6 konkrete, real existierende Firmen mit Name, Ort und einem kurzen Grund, warum sie ein passender Kontakt sind (z. B. Stellenanzeige, Expansion, öffentlich bekannter Bedarf). Nutze für jede Angabe eine Quelle aus deiner Websuche.\n\nRufe anschließend für jede gefundene Firma kurz die eigene Website auf (Kontakt-/Impressum-Seite) und notiere, falls vorhanden: die allgemeine E-Mail-Adresse (z. B. info@...) und einen namentlich genannten Ansprechpartner samt eindeutiger Anrede (nur wenn "Herr"/"Frau" oder ein eindeutiger Titel wörtlich dabeisteht — sonst nichts dazu schreiben, nicht raten).\n\nWICHTIG zu web_fetch: rufe NIEMALS eine geratene URL auf (z. B. "firma.de/kontakt" nur weil das üblich klingt). Suche zuerst gezielt per web_search nach "[Firmenname] Kontakt Impressum" o. Ä. und rufe per web_fetch ausschließlich eine URL auf, die als tatsächliches Suchergebnis zurückkam. Fetche höchstens so viele Firmen-Websites, wie du an web_fetch-Aufrufen zur Verfügung hast — lieber weniger Firmen gründlich prüfen als bei vielen ins Leere laufen.`,
        },
      ],
    },
    { headers: { "anthropic-beta": "web-fetch-2025-09-10" } }
  );

  if (rechercheAntwort.stop_reason === "max_tokens") {
    throw new Error("Recherche-Antwort wurde abgeschnitten (zu lang). Bitte erneut versuchen.");
  }

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
        website?: string;
        ansprechpartnerNachname?: string;
        ansprechpartnerAnrede?: "Herr" | "Frau";
      }[]
    | undefined;

  if (!firmenListe?.length) {
    throw new Error("Keine konkreten Firmen gefunden. Bitte erneut versuchen.");
  }

  const neueFirmen: { id: string; name: string; begruendung: string }[] = [];

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
        website: kandidat.website || null,
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

    neueFirmen.push({ id: neu.id, name: kandidat.name, begruendung: kandidat.begruendung });
  }

  if (neueFirmen.length > 0) {
    await emailEntwuerfeErstellen(typ, neueFirmen);
  }

  revalidatePath(modulPfad[typ]);
}

const emailEntwuerfeTool: Anthropic.Tool = {
  name: "entwuerfe_melden",
  description: "Meldet personalisierte E-Mail-Entwürfe für eine Liste von Firmen.",
  input_schema: {
    type: "object",
    properties: {
      entwuerfe: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Firmenname, muss exakt zur Eingabeliste passen." },
            betreff: { type: "string" },
            text: {
              type: "string",
              description:
                'Personalisierter E-Mail-Text auf Deutsch, beginnend mit "{{anrede}}" als Platzhalter für die Anrede (wird später ersetzt). Muss im ersten Absatz konkret auf den genannten Grund/Signal für diese Firma eingehen, danach im Ton/Stil der Referenzvorlage weiterschreiben (Kurzvorstellung Blitzblank, Leistungsspektrum, Abschluss). Nicht zu lang, professionell, keine Übertreibung.',
            },
          },
          required: ["name", "betreff", "text"],
        },
      },
    },
    required: ["entwuerfe"],
  },
};

/**
 * Schreibt fuer jede neu gefundene Firma automatisch einen personalisierten
 * E-Mail-Entwurf (ein Claude-Aufruf fuer alle Firmen zusammen, damit die
 * Gesamtlaufzeit der Recherche nicht mit der Anzahl gefundener Firmen
 * waechst). Der Nutzer muss den Entwurf nur noch pruefen und senden.
 */
async function emailEntwuerfeErstellen(
  typ: "direktkunde" | "nachunternehmer",
  neueFirmen: { id: string; name: string; begruendung: string }[]
) {
  const vorlage = await db.query.vorlage.findFirst({
    where: (v, { and: und, eq: gleich }) => und(gleich(v.typ, typ), gleich(v.aktiv, true)),
  });
  if (!vorlage) return;

  const firmenListe = neueFirmen
    .map((f, i) => `${i + 1}. ${f.name} — Grund: ${f.begruendung}`)
    .join("\n");

  try {
    const antwort = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tool_choice: { type: "tool", name: "entwuerfe_melden" },
      tools: [emailEntwuerfeTool],
      messages: [
        {
          role: "user",
          content: `Referenzvorlage (Ton/Stil/Leistungsspektrum, so weiterschreiben):\n\nBetreff: ${vorlage.betreff}\n\n${vorlage.textMitPlatzhaltern}\n\n---\n\nSchreibe für jede der folgenden neu gefundenen Firmen einen individuellen, personalisierten E-Mail-Entwurf, der im ersten Satz/Absatz konkret auf den genannten Grund eingeht (nicht die Referenzvorlage wortgleich kopieren):\n\n${firmenListe}`,
        },
      ],
    });

    if (antwort.stop_reason === "max_tokens") return;

    const toolUse = antwort.content.find(
      (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
    );
    const entwuerfe = (
      toolUse?.input as
        | { entwuerfe?: { name: string; betreff: string; text: string }[] }
        | undefined
    )?.entwuerfe;
    if (!entwuerfe?.length) return;

    for (const e of entwuerfe) {
      const firmaEintrag = neueFirmen.find(
        (f) => f.name.toLowerCase() === e.name?.toLowerCase()
      );
      if (!firmaEintrag || !e.betreff?.trim() || !e.text?.trim()) continue;

      await db
        .update(firma)
        .set({ emailEntwurfBetreff: e.betreff, emailEntwurfText: e.text })
        .where(eq(firma.id, firmaEintrag.id));
    }
  } catch (error) {
    // Entwuerfe sind ein Zusatznutzen -- ein Fehler hier darf die
    // eigentliche Firmenrecherche nicht scheitern lassen.
    console.error("E-Mail-Entwürfe konnten nicht erstellt werden:", error);
  }
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

const kontaktFindenTool: Anthropic.Tool = {
  name: "kontakt_melden",
  description: "Meldet die gefundenen Kontaktmöglichkeiten einer Firma.",
  input_schema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Allgemeine E-Mail-Adresse (z. B. info@firma.de), NUR wenn tatsächlich gefunden.",
      },
      telefon: { type: "string", description: "Allgemeine Telefonnummer, NUR wenn tatsächlich gefunden." },
      website: { type: "string", description: "Offizielle Website-URL der Firma, NUR wenn tatsächlich gefunden." },
      ansprechpartnerNachname: {
        type: "string",
        description: "Nachname eines konkret genannten Ansprechpartners, NUR wenn explizit auf einer Quelle genannt.",
      },
      ansprechpartnerAnrede: { type: "string", enum: ["Herr", "Frau"] },
      hatKontaktformular: { type: "boolean", description: "Ob die Website ein Kontaktformular hat." },
      linkedinUrl: { type: "string", description: "URL des LinkedIn-Unternehmensprofils, falls gefunden." },
      xingUrl: { type: "string", description: "URL des Xing-Unternehmensprofils, falls gefunden." },
      niederlassungshinweis: {
        type: "string",
        description: "Kurzer Hinweis, falls eine lokale Niederlassung/Adresse in der Region gefunden wurde.",
      },
      protokoll: {
        type: "string",
        description:
          "2-4 Sätze Klartext-Zusammenfassung: welche Quellen wurden geprüft (Website, Impressum, LinkedIn, Xing, Google Maps) und was wurde jeweils gefunden oder nicht gefunden. Für den Nutzer nachvollziehbar, auch wenn nichts gefunden wurde.",
      },
    },
    required: ["protokoll"],
  },
};

/**
 * Für Firmen, die schon in der Liste stehen, aber (noch) keinen
 * verwendbaren Kontakt haben — z. B. weil ein früherer Recherche-Lauf
 * nichts gefunden hat. Sucht gezielt nach genau dieser einen Firma nach
 * (Website, Impressum, Karriere/Team, Google Maps, LinkedIn, Xing) statt
 * neue Firmen zu suchen, und protokolliert das Ergebnis nachvollziehbar —
 * auch ein "nichts gefunden" ist ein dokumentiertes Ergebnis, kein Abbruch.
 */
export async function emailNachtraeglichSuchen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  if (!firmaId) return;

  await mitFreundlicherFehlerbehandlung(
    "Kontakt-Nachrecherche",
    () => kontaktNachtraeglichSuchenDurchfuehren(firmaId),
    "Die Kontakt-Recherche konnte gerade nicht abgeschlossen werden. Bitte in ein paar Minuten erneut versuchen."
  );
}

async function kontaktNachtraeglichSuchenDurchfuehren(firmaId: string) {
  const akte = await db.query.firma.findFirst({
    where: eq(firma.id, firmaId),
    with: { ansprechpartner: true },
  });
  if (!akte || akte.email || akte.ansprechpartner.some((a) => a.email)) return;

  const suchAntwort = await anthropic.messages.create(
    {
      model: "claude-sonnet-5",
      max_tokens: 3072,
      tools: [
        { type: "web_search_20250305", name: "web_search", max_uses: 4 },
        { type: "web_fetch_20250910", name: "web_fetch", max_uses: 3 },
      ],
      messages: [
        {
          role: "user",
          content: `Recherchiere gründlich Kontaktmöglichkeiten für "${akte.name}"${
            akte.region ? ` (${akte.region})` : ""
          }. Prüfe der Reihe nach: (1) offizielle Website mit Kontakt-/Impressum-/Karriere-Seite für E-Mail, Telefon, Adresse; (2) ob die Website ein Kontaktformular hat; (3) LinkedIn-Unternehmensprofil; (4) Xing-Unternehmensprofil; (5) Google-Maps-Eintrag für Adresse/Niederlassung in der Region.\n\nSuche zuerst per web_search, rufe dann per web_fetch AUSSCHLIESSLICH URLs auf, die tatsächlich als Suchergebnis zurückkamen — rate niemals eine URL. Fasse am Ende zusammen, was du bei jeder Quelle gefunden oder nicht gefunden hast, auch wenn insgesamt nichts Verwendbares dabei war — das ist ein ehrliches Ergebnis, kein Fehler.`,
        },
      ],
    },
    { headers: { "anthropic-beta": "web-fetch-2025-09-10" } }
  );

  const suchText = suchAntwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  if (!suchText.trim()) return;

  const extraktion = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    tool_choice: { type: "tool", name: "kontakt_melden" },
    tools: [kontaktFindenTool],
    messages: [
      { role: "user", content: `Extrahiere die gefundenen Kontaktmöglichkeiten aus:\n\n${suchText}` },
    ],
  });

  const toolUse = extraktion.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const ergebnis = toolUse?.input as
    | {
        email?: string;
        telefon?: string;
        website?: string;
        ansprechpartnerNachname?: string;
        ansprechpartnerAnrede?: "Herr" | "Frau";
        hatKontaktformular?: boolean;
        linkedinUrl?: string;
        xingUrl?: string;
        niederlassungshinweis?: string;
        protokoll?: string;
      }
    | undefined;

  if (!ergebnis) return;

  const protokollTeile = [ergebnis.protokoll?.trim()];
  if (ergebnis.hatKontaktformular) protokollTeile.push("Kontaktformular auf der Website vorhanden.");
  if (ergebnis.linkedinUrl) protokollTeile.push(`LinkedIn: ${ergebnis.linkedinUrl}`);
  if (ergebnis.xingUrl) protokollTeile.push(`Xing: ${ergebnis.xingUrl}`);
  if (ergebnis.niederlassungshinweis) protokollTeile.push(`Niederlassung: ${ergebnis.niederlassungshinweis}`);

  await db
    .update(firma)
    .set({
      email: ergebnis.email?.trim() || undefined,
      website: ergebnis.website?.trim() || undefined,
      rechercheProtokoll: protokollTeile.filter(Boolean).join(" "),
      aktualisiertAm: new Date(),
    })
    .where(eq(firma.id, firmaId));

  if (ergebnis.ansprechpartnerNachname || ergebnis.telefon) {
    await db.insert(ansprechpartner).values({
      firmaId,
      nachname: ergebnis.ansprechpartnerNachname || null,
      anrede: ergebnis.ansprechpartnerAnrede || null,
      telefon: ergebnis.telefon || null,
    });
  }

  revalidatePath("/direktkunden");
  revalidatePath("/nachunternehmer");
  revalidatePath(`/direktkunden/${firmaId}`);
  revalidatePath(`/nachunternehmer/${firmaId}`);
}
