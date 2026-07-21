import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
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
  herkunftKanal: herkunftKanalEnum("herkunft_kanal").notNull(),
  status: text("status").notNull().default("neu"),
  begruendung: text("begruendung"),
  notizen: text("notizen"),
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
  rolle: text("rolle"),
  email: text("email"),
  telefon: text("telefon"),
  letzterKontaktAm: timestamp("letzter_kontakt_am"),
  // nur bei Direktkunden relevant (Kontaktsperre nach Angebotsversand)
  gesperrtBis: timestamp("gesperrt_bis"),
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
