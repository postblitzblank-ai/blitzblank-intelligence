CREATE TABLE "google_verbindung" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refresh_token" text NOT NULL,
	"aktualisiert_am" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seo_ziel_keyword" ADD COLUMN "aktuelle_position" real;--> statement-breakpoint
ALTER TABLE "seo_ziel_keyword" ADD COLUMN "impressionen" integer;--> statement-breakpoint
ALTER TABLE "seo_ziel_keyword" ADD COLUMN "klicks" integer;--> statement-breakpoint
ALTER TABLE "seo_ziel_keyword" ADD COLUMN "zuletzt_geprueft_am" timestamp;