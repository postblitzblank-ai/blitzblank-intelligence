import { db } from "../src/db";
import { seoBefund } from "../src/db/schema";
import { eq, ilike } from "drizzle-orm";

type Korrektur = {
  titelMuster: string;
  status?: "erledigt" | "verworfen";
  beschreibungAnhang?: string;
};

const korrekturen: Korrektur[] = [
  {
    titelMuster: "%Fensterreinigung als eigene Leistungsseite%",
    status: "verworfen",
    beschreibungAnhang:
      " -- Geprüft: Existiert bereits als eigene Leistungsseite ('Glas- & Fensterreinigung', Slug glas-und-fensterreinigung) inkl. automatischer Stadt-Kombiseiten. Befund war veraltet.",
  },
  {
    titelMuster: "%Interne Verlinkung & Navigation für neue Leistungsseiten%",
    status: "verworfen",
    beschreibungAnhang:
      " -- Geprüft: Hauptnavigation verlinkt auf /leistungen, die Übersichtsseite und der Footer listen automatisch ALLE Leistungen (inkl. der 3 neuen Seiten) aus derselben Datenquelle. Befund war veraltet.",
  },
  {
    titelMuster: "%Spezial-Leistungsseiten (Fensterreinigung, Fahrzeugaufbereitung%",
    beschreibungAnhang:
      " -- Teilweise überholt: Fensterreinigung existiert bereits. Fahrzeugaufbereitung und Hausmeisterservice fehlen als eigene Leistungsseite weiterhin -- bräuchte echten Leistungstext (Umfang, Ablauf), den ich nicht ohne Rücksprache erfinden möchte.",
  },
  {
    titelMuster: "%Landingpage für Reinigungsservice-Varianten bündeln%",
    status: "erledigt",
    beschreibungAnhang:
      " -- Umgesetzt: /leistungen-Übersichtsseite um Meta-Titel/-Beschreibung und echten Einleitungstext mit 'Reinigungsservice'/'Reinigungsfirma' Berlin/Potsdam/Dresden erweitert, statt einer zusätzlichen dünnen Einzelseite (Commit d28c887).",
  },
  {
    titelMuster: "%Landingpage für 'blitzblank reinigung' & Varianten bündeln%",
    status: "erledigt",
    beschreibungAnhang: " -- Umgesetzt zusammen mit der Reinigungsservice-Bündelung (Commit d28c887).",
  },
  {
    titelMuster: "%Neue Landingpage für 'blitzblank reinigung' / 'blitzblank reinigungsservice'%",
    status: "erledigt",
    beschreibungAnhang: " -- Umgesetzt zusammen mit der Reinigungsservice-Bündelung (Commit d28c887).",
  },
  {
    titelMuster: "%Landingpage für 'blitz blank reinigung' (Pos. 64.8) erstellen%",
    status: "erledigt",
    beschreibungAnhang: " -- Umgesetzt zusammen mit der Reinigungsservice-Bündelung (Commit d28c887).",
  },
  {
    titelMuster: "%Content-Hub für generischen Begriff 'blitzblank' ausbauen%",
    status: "erledigt",
    beschreibungAnhang: " -- Umgesetzt zusammen mit der Reinigungsservice-Bündelung (Commit d28c887).",
  },
  {
    titelMuster: "%Karriere-/Jobseite für 'blitzblank jobs'%",
    status: "erledigt",
    beschreibungAnhang:
      " -- Teilweise umgesetzt: Karriere-Seite existiert bereits mit echtem Bewerbungsformular; Titel/Beschreibung um 'Stellenangebote'/'Jobs' ergänzt (Commit d28c887). Einzelne Stellenanzeigen kann ich nicht automatisch erstellen, ohne echte offene Positionen zu erfinden -- dafür bräuchte ich die tatsächlich offenen Stellen von dir.",
  },
  {
    titelMuster: "%Themenlücke: Karriere-/Jobseite fehlt für Suchintention%",
    status: "erledigt",
    beschreibungAnhang: " -- Siehe Korrektur zur Karriere-/Jobseite oben (Commit d28c887).",
  },
  {
    titelMuster: "%Themenlücke: Karriere-/Jobseite fehlt für Suchintention 'Stellenangebote'%",
    status: "erledigt",
    beschreibungAnhang: " -- Siehe Korrektur zur Karriere-/Jobseite oben (Commit d28c887).",
  },
  {
    titelMuster: "%Impressum nennt Steuernummer statt USt-IdNr%",
    beschreibungAnhang:
      " -- Kann ich nicht automatisch ergänzen: Eine USt-IdNr ist eine behördlich vom Bundeszentralamt für Steuern vergebene Nummer -- die darf ich nicht erraten oder erfinden. Bitte die echte USt-IdNr mitteilen (falls vorhanden), dann trage ich sie sofort ins Impressum ein.",
  },
  {
    titelMuster: "%Ranking-Ursache für Markenbegriff 'blitzblank' (Pos. 18.8) klären%",
    status: "erledigt",
    beschreibungAnhang:
      " -- Ursache identifiziert: Namensverwechslung mit gleichnamigen, fachfremden Reinigungsfirmen in anderen Städten (Cloppenburg, Gevelsberg) verwässert vermutlich die Marken-Position. Technische Unterscheidungssignale bereits verstärkt (LocalBusiness-Schema, Städtebezug in Title/H1). Weitere Verbesserung braucht zusätzliche Markenbekanntheit/Backlinks mit vollem Firmennamen -- das bleibt laut deiner Vorgabe dein eigener Bereich.",
  },
];

async function main() {
  for (const k of korrekturen) {
    const treffer = await db.query.seoBefund.findMany({
      where: ilike(seoBefund.titel, k.titelMuster),
    });
    for (const b of treffer) {
      await db
        .update(seoBefund)
        .set({
          status: k.status ?? b.status,
          beschreibung: b.beschreibung + (k.beschreibungAnhang ?? ""),
        })
        .where(eq(seoBefund.id, b.id));
      console.log(`Aktualisiert: ${b.titel}`);
    }
    if (treffer.length === 0) console.log(`Kein Treffer für Muster: ${k.titelMuster}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
