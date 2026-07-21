CREATE TABLE "analyse_erkenntnis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"erstellt_am" timestamp DEFAULT now() NOT NULL
);
