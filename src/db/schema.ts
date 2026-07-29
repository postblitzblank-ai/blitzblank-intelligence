import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Konzept Abschnitt 13 — Datenmodell (V1, Single-User)

export const firmaTypEnum = pgEnum("firma_typ", ["nachunternehmer", "direktkunde"]);
export const herkunftKanalEnum = pgEnum("herkunft_kanal", [
  "ausgehend",
  "eingehend_telefon",
  "eingehend_email",
  "eingehend_formular",
]);
export const aktivitaetTypEnum = pgEnum("aktivitaet_typ", [
  "email_gesendet",
  "anruf",
  "angebot_gesendet",
  "auftrag_gewonnen",
]);
export const followupStatusEnum = pgEnum("followup_status", [
  "offen",
  "erledigt",
  "kein_interesse",
]);
export const signaltypEnum = pgEnum("signaltyp", [
  "bauprojekt",
  "wettbewerb",
  "expansion",
  "ausschreibung",
]);
export const chanceStatusEnum = pgEnum("chance_status", [
  "neu",
  "in_recherche",
  "zu_firma_gereift",
  "verworfen",
]);
export const auftragStatusEnum = pgEnum("auftrag_status", ["gewonnen", "abgeschlossen"]);
export const bewertungsanfrageStatusEnum = pgEnum("bewertungsanfrage_status", [
  "vorbereitet",
  "freigegeben",
  "gesendet",
]);
export const seoKategorieEnum = pgEnum("seo_kategorie", [
  "technisch",
  "meta",
  "content",
  "backlink",
  "wettbewerb",
  "struktur",
]);
export const seoBefundStatusEnum = pgEnum("seo_befund_status", [
  "offen",
  "freigegeben",
  "erledigt",
  "verworfen",
]);
export const naechsteAktionEnum = pgEnum("naechste_aktion", [
  "anrufen",
  "email",
  "warten",
]);

/**
 * FIRMA ist eine einzige Tabelle für Nachunternehmer und Direktkunden,
 * unterschieden nur durch das Feld `typ` — beide Module teilen dieselbe Firmenakte.
 */
export const firma = pgTable("firma", {
  id: uuid("id").primaryKey().defaultRandom(),
  typ: firmaTypEnum("typ").notNull(),
  name: text("name").notNull(),
  branche: text("branche"),
  region: text("region"),
  // Allgemeine Firmenadresse (info@...), falls kein Ansprechpartner bekannt ist
  email: text("email"),
  website: text("website"),
  herkunftKanal: herkunftKanalEnum("herkunft_kanal").notNull(),
  status: text("status").notNull().default("neu"),
  begruendung: text("begruendung"),
  notizen: text("notizen"),
  /** Kurzer Klartext-Protokoll der letzten Kontakt-Recherche: welche
   * Quellen geprüft wurden und was gefunden/nicht gefunden wurde. Für die
   * Ampel-Anzeige (Versandbereit/Recherche läuft/Kein Kontakt gefunden). */
  rechercheProtokoll: text("recherche_protokoll"),
  /** Von der KI automatisch personalisierter E-Mail-Entwurf, bereits bei
   * der Recherche erstellt (Bezug auf den konkreten Grund/Signal) -- der
   * Nutzer muss nur noch pruefen und senden, nicht mehr selbst schreiben. */
  emailEntwurfBetreff: text("email_entwurf_betreff"),
  emailEntwurfText: text("email_entwurf_text"),
  /** Wann der aktuelle Entwurf geschrieben wurde -- getrennt von
   * aktualisiertAm, damit das Dashboard "heute erstellte E-Mails" ehrlich
   * zählen kann, ohne mit anderen Feldänderungen zu vermischen. */
  emailEntwurfErstelltAm: timestamp("email_entwurf_erstellt_am"),
  /** Auf Klick von der KI erstellte, kurze Einschätzung ("warum interessant"
   * + konkrete Handlungsempfehlung). Wird zwischengespeichert, damit ein
   * erneuter Seitenaufruf keinen weiteren Anthropic-Aufruf braucht -- nur
   * "Neu generieren" löst einen neuen Aufruf aus. */
  kiZusammenfassungText: text("ki_zusammenfassung_text"),
  kiZusammenfassungEmpfehlung: text("ki_zusammenfassung_empfehlung"),
  kiZusammenfassungNaechsteAktion: naechsteAktionEnum("ki_zusammenfassung_naechste_aktion"),
  kiZusammenfassungAm: timestamp("ki_zusammenfassung_am"),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
  aktualisiertAm: timestamp("aktualisiert_am").notNull().defaultNow(),
});

export const ansprechpartner = pgTable("ansprechpartner", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmaId: uuid("firma_id")
    .notNull()
    .references(() => firma.id, { onDelete: "cascade" }),
  vorname: text("vorname"),
  nachname: text("nachname"),
  // "Herr"/"Frau", nur gesetzt wenn sicher bekannt (nie automatisch geraten) —
  // sonst greift beim Versand die neutrale Anrede statt eines Rate-Risikos
  anrede: text("anrede"),
  rolle: text("rolle"),
  email: text("email"),
  telefon: text("telefon"),
  letzterKontaktAm: timestamp("letzter_kontakt_am"),
  // nur bei Direktkunden relevant (Kontaktsperre nach Angebotsversand)
  gesperrtBis: timestamp("gesperrt_bis"),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
});

export const aktivitaet = pgTable("aktivitaet", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmaId: uuid("firma_id")
    .notNull()
    .references(() => firma.id, { onDelete: "cascade" }),
  typ: aktivitaetTypEnum("typ").notNull(),
  datum: timestamp("datum").notNull().defaultNow(),
  beschreibung: text("beschreibung"),
});

export const followup = pgTable("followup", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmaId: uuid("firma_id")
    .notNull()
    .references(() => firma.id, { onDelete: "cascade" }),
  faelligAm: timestamp("faellig_am").notNull(),
  // nur Direktkunden zählen bis 3, Nachunternehmer zählen nie (bleibt null)
  versuchNr: integer("versuch_nr"),
  status: followupStatusEnum("status").notNull().default("offen"),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
});

export const vorlage = pgTable("vorlage", {
  id: uuid("id").primaryKey().defaultRandom(),
  typ: firmaTypEnum("typ").notNull(),
  betreff: text("betreff").notNull(),
  textMitPlatzhaltern: text("text_mit_platzhaltern").notNull(),
  aktiv: boolean("aktiv").notNull().default(true),
});

/**
 * CHANCE (Marketing-Intelligence-Radar). Reift zu einer FIRMA, sobald
 * die KI einen Ansprechpartner findet — firmaId ist bis dahin null.
 */
export const chance = pgTable("chance", {
  id: uuid("id").primaryKey().defaultRandom(),
  titel: text("titel").notNull(),
  signaltyp: signaltypEnum("signaltyp").notNull(),
  beschreibung: text("beschreibung"),
  quelleUrl: text("quelle_url"),
  /** Konkreter naechster Schritt fuer den Nutzer, z. B. wen ansprechen oder
   * welche verlorenen Auftraege/Kunden gezielt angegangen werden koennen. */
  handlungsempfehlung: text("handlungsempfehlung"),
  /** Bei Wettbewerbssignalen (Insolvenz etc.): betroffene Objekte/Standorte,
   * wahrscheinliche Nachfolger und die daraus folgende Chance fuer Blitzblank. */
  tiefenanalyse: text("tiefenanalyse"),
  status: chanceStatusEnum("status").notNull().default("neu"),
  firmaId: uuid("firma_id").references(() => firma.id, { onDelete: "set null" }),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
});

/** Einfacher Stub, da Einsatzplanung erst V2. */
export const auftrag = pgTable("auftrag", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmaId: uuid("firma_id")
    .notNull()
    .references(() => firma.id, { onDelete: "cascade" }),
  status: auftragStatusEnum("status").notNull().default("gewonnen"),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
});

/** Wird automatisch ausgelöst, wenn ein AUFTRAG auf "abgeschlossen" wechselt. */
export const bewertungsanfrage = pgTable("bewertungsanfrage", {
  id: uuid("id").primaryKey().defaultRandom(),
  auftragId: uuid("auftrag_id")
    .notNull()
    .references(() => auftrag.id, { onDelete: "cascade" }),
  status: bewertungsanfrageStatusEnum("status").notNull().default("vorbereitet"),
  gesendetAm: timestamp("gesendet_am"),
});

/**
 * SEO-Center (Modul 9). Freigabe-Regel aus dem Konzept: neue Backlinks,
 * Landingpages, Content, Alt-Texte/Meta-Beschreibungen sind autonom
 * (freigabeNoetig=false, nur Meldung), strukturelle Änderungen an
 * bestehenden wichtigen Seiten brauchen vorherige Freigabe.
 */
export const seoBefund = pgTable("seo_befund", {
  id: uuid("id").primaryKey().defaultRandom(),
  kategorie: seoKategorieEnum("kategorie").notNull(),
  titel: text("titel").notNull(),
  beschreibung: text("beschreibung").notNull(),
  freigabeNoetig: boolean("freigabe_noetig").notNull().default(false),
  status: seoBefundStatusEnum("status").notNull().default("offen"),
  quelleUrl: text("quelle_url"),
  /** Link zum echten Commit, falls diese Änderung tatsächlich automatisch
   * im Website-Repository umgesetzt wurde (nicht nur eine Empfehlung). */
  commitUrl: text("commit_url"),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
});

/**
 * Vom Nutzer festgelegte Ziel-Keywords (z. B. "Gebäudereinigung Berlin"),
 * für die die Firma aktiv aufgebaut werden soll — unabhängig davon, ob
 * dafür aktuell schon irgendein Ranking existiert.
 */
export const seoZielKeyword = pgTable("seo_ziel_keyword", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyword: text("keyword").notNull(),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
  // Zwischengespeicherte Google-Search-Console-Daten, täglich per Cron aktualisiert
  aktuellePosition: real("aktuelle_position"),
  impressionen: integer("impressionen"),
  klicks: integer("klicks"),
  zuletztGeprueftAm: timestamp("zuletzt_geprueft_am"),
});

/**
 * Unternehmensanalyse (Modul 11): Erkenntnisse als fertige Sätze, keine
 * Rohdaten-Tabelle. Wird komplett neu erzeugt bei jeder Aktualisierung.
 */
export const analyseErkenntnis = pgTable("analyse_erkenntnis", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  erstelltAm: timestamp("erstellt_am").notNull().defaultNow(),
});

/**
 * Speichert den Google-Refresh-Token dauerhaft (nicht nur in der Browser-
 * Session), damit tägliche Hintergrund-Jobs (Cron) ohne aktiven Login
 * auf Gmail/Search Console zugreifen können. Single-Row-Tabelle (V1).
 */
export const googleVerbindung = pgTable("google_verbindung", {
  id: uuid("id").primaryKey().defaultRandom(),
  refreshToken: text("refresh_token").notNull(),
  aktualisiertAm: timestamp("aktualisiert_am").notNull().defaultNow(),
});

export const firmaRelations = relations(firma, ({ many }) => ({
  ansprechpartner: many(ansprechpartner),
  aktivitaeten: many(aktivitaet),
  followups: many(followup),
  auftraege: many(auftrag),
  chancen: many(chance),
}));

export const ansprechpartnerRelations = relations(ansprechpartner, ({ one }) => ({
  firma: one(firma, { fields: [ansprechpartner.firmaId], references: [firma.id] }),
}));

export const aktivitaetRelations = relations(aktivitaet, ({ one }) => ({
  firma: one(firma, { fields: [aktivitaet.firmaId], references: [firma.id] }),
}));

export const followupRelations = relations(followup, ({ one }) => ({
  firma: one(firma, { fields: [followup.firmaId], references: [firma.id] }),
}));

export const chanceRelations = relations(chance, ({ one }) => ({
  firma: one(firma, { fields: [chance.firmaId], references: [firma.id] }),
}));

export const auftragRelations = relations(auftrag, ({ one, many }) => ({
  firma: one(firma, { fields: [auftrag.firmaId], references: [firma.id] }),
  bewertungsanfragen: many(bewertungsanfrage),
}));

export const bewertungsanfrageRelations = relations(bewertungsanfrage, ({ one }) => ({
  auftrag: one(auftrag, { fields: [bewertungsanfrage.auftragId], references: [auftrag.id] }),
}));
