CREATE TYPE "public"."seo_befund_status" AS ENUM('offen', 'freigegeben', 'erledigt', 'verworfen');--> statement-breakpoint
CREATE TYPE "public"."seo_kategorie" AS ENUM('technisch', 'meta', 'content', 'backlink', 'wettbewerb', 'struktur');--> statement-breakpoint
CREATE TABLE "seo_befund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kategorie" "seo_kategorie" NOT NULL,
	"titel" text NOT NULL,
	"beschreibung" text NOT NULL,
	"freigabe_noetig" boolean DEFAULT false NOT NULL,
	"status" "seo_befund_status" DEFAULT 'offen' NOT NULL,
	"quelle_url" text,
	"erstellt_am" timestamp DEFAULT now() NOT NULL
);
