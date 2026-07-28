/**
 * Opportunity Score (0-100): eine deterministische, nachvollziehbare
 * Priorisierung — keine KI-Bewertung pro Firma (zu langsam/teuer für
 * Listen mit vielen Firmen), sondern ein transparenter Punkte-Score aus
 * echten, bereits vorhandenen Daten. Höher = lohnender, jetzt zu
 * kontaktieren.
 */

type Ansprechpartner = { email: string | null; telefon: string | null };
type Aktivitaet = { typ: string; datum: Date };
type Followup = { status: string; faelligAm: Date };

export type ScoreFirma = {
  status: string;
  email: string | null;
  begruendung: string | null;
  erstelltAm: Date;
  ansprechpartner: Ansprechpartner[];
  aktivitaeten: Aktivitaet[];
  followups: Followup[];
};

const SIGNAL_STARK = [
  "dringend",
  "sofort",
  "kurzfristig",
  "ausschreibung",
  "auftrag gewonnen",
  "neue niederlassung",
];
const SIGNAL_MITTEL = [
  "sucht",
  "subunternehmer",
  "nachunternehmer",
  "expandiert",
  "eröffnet",
  "wächst",
  "personalbedarf",
  "stellenanzeige",
];
const SIGNAL_SCHWACH = ["insolvenz", "geschäftsaufgabe", "wettbewerb"];

export function opportunityScore(f: ScoreFirma): number {
  // Bereits abgeschlossene Fälle sind keine offene Opportunity mehr.
  if (f.status === "gewonnen") return 0;
  if (f.status === "kein_interesse") return 5;

  let score = 20; // Basiswert für jede aktive Firma in der Liste

  const hatAnsprechpartnerEmail = f.ansprechpartner.some((a) => a.email);
  const hatTelefon = f.ansprechpartner.some((a) => a.telefon);
  if (hatAnsprechpartnerEmail) score += 20;
  else if (f.email) score += 12;
  if (hatTelefon) score += 8;

  const text = (f.begruendung ?? "").toLowerCase();
  if (SIGNAL_STARK.some((w) => text.includes(w))) score += 20;
  else if (SIGNAL_MITTEL.some((w) => text.includes(w))) score += 12;
  else if (SIGNAL_SCHWACH.some((w) => text.includes(w))) score += 6;

  const tageAlt = (Date.now() - f.erstelltAm.getTime()) / 86_400_000;
  if (tageAlt <= 7) score += 12;
  else if (tageAlt <= 30) score += 6;

  const ueberfaelligesFollowup = f.followups.some(
    (fu) => fu.status === "offen" && fu.faelligAm.getTime() <= Date.now()
  );
  if (ueberfaelligesFollowup) score += 15;

  if (f.status === "neu" && f.aktivitaeten.length === 0) score += 5; // frischer, unkontaktierter Lead

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreLabel(score: number): { label: string; farbe: string } {
  if (score >= 70) return { label: "Heiß", farbe: "text-red-600 bg-red-50 border-red-200" };
  if (score >= 45) return { label: "Warm", farbe: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "Kalt", farbe: "text-slate-500 bg-slate-50 border-slate-200" };
}
