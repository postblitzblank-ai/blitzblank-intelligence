# Blitzblank Intelligence — Technologie-Stack (beschlossen)

Stand: 2026-07-17 · Grundlage: `Blitzblank_Intelligence_Konzept.md` (V1, Single-User)

## Leitgedanken

1. **Relationale Daten** (Firma → Ansprechpartner / Aktivität / Follow-up, Chance → Firma) → klassische relationale Datenbank.
2. **KI-Agent im Zentrum** (Recherche, Personalisierung, täglicher SEO-Scan, Command-Bar) → eigene Background-Job-Schicht, damit lange KI-Aufgaben nicht im Web-Request laufen.
3. **Single-User mit Google-Tiefenintegration** (Gmail-Versand, Search Console) → Login und Google-Anbindung sind dieselbe Schicht (Google OAuth), keine separate Auth-Lösung.

## Frontend

| Baustein | Wahl | Begründung |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Ein Codebase für UI und API, Vercel-nativ |
| Styling/UI | **Tailwind CSS + shadcn/ui** (Radix) | Der De-facto-Standard für den Apple/Linear/Notion-Look: ruhige Karten, klare Typografie |
| Command-Bar | **cmdk** | Die Bibliothek hinter Linears Cmd+K — deckt Modul 5a direkt ab |
| Animation | **Framer Motion** | Dezente Übergänge für den „Apple"-Eindruck |

## Backend

- **Next.js Route Handlers / Server Actions** für alles Interaktive (Firmenakte, Freigaben, Sammel-Versand).
- **Inngest** als Background-Job-Schicht: Firmenrecherche, täglicher SEO-Scan, Follow-up-Fälligkeiten, Marketing-Radar. Ereignisgesteuert, TypeScript-nativ, eingebaute Retries, großzügiger Free-Tier.
- **Anthropic Claude API** als KI-Schicht: Recherche-Agent, E-Mail-Personalisierung, SEO-Analyse, Command-Bar. Tool-Use bindet interne Funktionen an („Priorisiere Hotels" → interner Filteraufruf statt Raten).

## Datenbank

- **PostgreSQL** bei **Supabase** oder **Neon** (Free-Tier reicht für V1).
- **Drizzle ORM** — typsicher, leichtgewichtig, serverless-tauglich.
- Datenmodell aus Konzept Abschnitt 13 überträgt sich 1:1: `firma`, `ansprechpartner`, `aktivitaet`, `followup`, `vorlage`, `chance`, `auftrag`.

## Google-Integrationen

- **Auth.js (NextAuth) mit Google-Provider** als einziger Login-Weg (Single-User).
- **Gmail API** (`googleapis`), Scopes `gmail.send` / `gmail.compose` → Sammel-Freigabe-Versand aus Modul 8.
- **Google Search Console API** (Rankings, Indexierung, Fehler) + **PageSpeed Insights API** (Website-Health) für das SEO-Center.
- Später optional: Google Business Profile API.

## Firmenrecherche — kostenlose Variante (Entscheidung)

Kein kostenpflichtiger B2B-Datenanbieter in V1. Stattdessen:

- **Websuche über die integrierte Web-Search-Funktion der Claude API** (keine separate Anbieter-Anbindung nötig; Kosten laufen im normalen API-Verbrauch mit, kein Abo).
- **Ansprechpartner aus öffentlichen Quellen:** Firmen-Websites (Team-/Kontaktseiten, Impressum), Stellenanzeigen („sucht Reinigungskräfte" als Signal), öffentliche Register-Bekanntmachungen.
- Konsequenz: Trefferqualität bei direkten Durchwahlen/E-Mails einzelner Objektleiter ist begrenzter als mit Bezahldaten — die KI legt dann die allgemeine Firmenadresse an („Sehr geehrte Damen und Herren"-Pfad aus Modul 8), Upgrade auf einen Datenanbieter bleibt jederzeit nachrüstbar.

## Hosting

- **Vercel** (Frontend + API) · **Supabase/Neon** (Postgres) · **Inngest Cloud** (Jobs) — alle mit Free-Tier startbar, kein eigenes Server-Ops.

## Was vor dem Coding-Start noch gebraucht wird

1. Echte E-Mail-Vorlagen (Direktkunden + Nachunternehmer) — liefert der Nutzer
2. Google-Cloud-Projekt mit OAuth-Zugangsdaten (Gmail + Search Console Scopes)
3. Anthropic API-Key
4. Search-Console-Rechteübertragung abgeschlossen (läuft, ~7 Tage)
