CREATE TABLE "seo_ziel_keyword" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"erstellt_am" timestamp DEFAULT now() NOT NULL
);
