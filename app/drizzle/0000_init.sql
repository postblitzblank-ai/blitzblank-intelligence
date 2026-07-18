CREATE TYPE "public"."aktivitaet_typ" AS ENUM('email_gesendet', 'anruf', 'angebot_gesendet', 'auftrag_gewonnen');--> statement-breakpoint
CREATE TYPE "public"."auftrag_status" AS ENUM('gewonnen', 'abgeschlossen');--> statement-breakpoint
CREATE TYPE "public"."bewertungsanfrage_status" AS ENUM('vorbereitet', 'freigegeben', 'gesendet');--> statement-breakpoint
CREATE TYPE "public"."chance_status" AS ENUM('neu', 'in_recherche', 'zu_firma_gereift', 'verworfen');--> statement-breakpoint
CREATE TYPE "public"."firma_typ" AS ENUM('nachunternehmer', 'direktkunde');--> statement-breakpoint
CREATE TYPE "public"."followup_status" AS ENUM('offen', 'erledigt', 'kein_interesse');--> statement-breakpoint
CREATE TYPE "public"."herkunft_kanal" AS ENUM('ausgehend', 'eingehend_telefon', 'eingehend_email', 'eingehend_formular');--> statement-breakpoint
CREATE TYPE "public"."signaltyp" AS ENUM('bauprojekt', 'wettbewerb', 'expansion');--> statement-breakpoint
CREATE TABLE "aktivitaet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firma_id" uuid NOT NULL,
	"typ" "aktivitaet_typ" NOT NULL,
	"datum" timestamp DEFAULT now() NOT NULL,
	"beschreibung" text
);
--> statement-breakpoint
CREATE TABLE "ansprechpartner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firma_id" uuid NOT NULL,
	"vorname" text,
	"nachname" text,
	"rolle" text,
	"email" text,
	"telefon" text,
	"letzter_kontakt_am" timestamp,
	"gesperrt_bis" timestamp
);
--> statement-breakpoint
CREATE TABLE "auftrag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firma_id" uuid NOT NULL,
	"status" "auftrag_status" DEFAULT 'gewonnen' NOT NULL,
	"erstellt_am" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bewertungsanfrage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auftrag_id" uuid NOT NULL,
	"status" "bewertungsanfrage_status" DEFAULT 'vorbereitet' NOT NULL,
	"gesendet_am" timestamp
);
--> statement-breakpoint
CREATE TABLE "chance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titel" text NOT NULL,
	"signaltyp" "signaltyp" NOT NULL,
	"status" "chance_status" DEFAULT 'neu' NOT NULL,
	"firma_id" uuid,
	"erstellt_am" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"typ" "firma_typ" NOT NULL,
	"name" text NOT NULL,
	"branche" text,
	"region" text,
	"herkunft_kanal" "herkunft_kanal" NOT NULL,
	"status" text DEFAULT 'neu' NOT NULL,
	"begruendung" text,
	"notizen" text,
	"erstellt_am" timestamp DEFAULT now() NOT NULL,
	"aktualisiert_am" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "followup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firma_id" uuid NOT NULL,
	"faellig_am" timestamp NOT NULL,
	"versuch_nr" integer,
	"status" "followup_status" DEFAULT 'offen' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vorlage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"typ" "firma_typ" NOT NULL,
	"betreff" text NOT NULL,
	"text_mit_platzhaltern" text NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aktivitaet" ADD CONSTRAINT "aktivitaet_firma_id_firma_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firma"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ansprechpartner" ADD CONSTRAINT "ansprechpartner_firma_id_firma_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firma"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auftrag" ADD CONSTRAINT "auftrag_firma_id_firma_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firma"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bewertungsanfrage" ADD CONSTRAINT "bewertungsanfrage_auftrag_id_auftrag_id_fk" FOREIGN KEY ("auftrag_id") REFERENCES "public"."auftrag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chance" ADD CONSTRAINT "chance_firma_id_firma_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firma"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followup" ADD CONSTRAINT "followup_firma_id_firma_id_fk" FOREIGN KEY ("firma_id") REFERENCES "public"."firma"("id") ON DELETE cascade ON UPDATE no action;