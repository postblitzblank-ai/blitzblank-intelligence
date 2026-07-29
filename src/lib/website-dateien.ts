/**
 * Feste Liste der Website-Dateien, die die automatische SEO-Korrektur
 * anfassen darf. Bewusst eine Positivliste statt "irgendeine Datei
 * finden" -- die KI schlägt sonst zu leicht die falsche Datei oder eine
 * Komponente statt einer Route vor. Jede Datei ist mit der öffentlichen
 * Route beschriftet, damit ein SEO-Befund mit einer bekannten quelleUrl
 * eindeutig zugeordnet werden kann.
 */
export const WEBSITE_META_DATEIEN: { pfad: string; route: string; beschreibung: string }[] = [
  { pfad: "src/routes/index.tsx", route: "/", beschreibung: "Startseite" },
  { pfad: "src/routes/leistungen.index.tsx", route: "/leistungen", beschreibung: "Leistungen-Übersicht" },
  { pfad: "src/routes/branchen.index.tsx", route: "/branchen", beschreibung: "Branchen-Übersicht" },
  { pfad: "src/routes/standorte.index.tsx", route: "/standorte", beschreibung: "Standorte-Übersicht" },
  { pfad: "src/routes/ueber-uns.tsx", route: "/ueber-uns", beschreibung: "Über uns" },
  { pfad: "src/routes/karriere.tsx", route: "/karriere", beschreibung: "Karriere" },
  { pfad: "src/routes/kontakt.tsx", route: "/kontakt", beschreibung: "Kontakt" },
  { pfad: "src/routes/impressum.tsx", route: "/impressum", beschreibung: "Impressum" },
  { pfad: "src/routes/__root.tsx", route: "(global)", beschreibung: "Globale Defaults (Root-Layout)" },
];
