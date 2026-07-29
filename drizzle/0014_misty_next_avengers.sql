CREATE TYPE "public"."naechste_aktion" AS ENUM('anrufen', 'email', 'warten');--> statement-breakpoint
ALTER TABLE "ansprechpartner" ADD COLUMN "erstellt_am" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "firma" ADD COLUMN "email_entwurf_erstellt_am" timestamp;--> statement-breakpoint
ALTER TABLE "firma" ADD COLUMN "ki_zusammenfassung_naechste_aktion" "naechste_aktion";--> statement-breakpoint
ALTER TABLE "followup" ADD COLUMN "erstellt_am" timestamp DEFAULT now() NOT NULL;