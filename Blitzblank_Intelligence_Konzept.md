# Blitzblank Intelligence — Konzeptdokument V1

Stand: gemeinsam erarbeitetes Konzept, vor Beginn der technischen Umsetzung.

---

## 1. Vision

Blitzblank Intelligence ist kein CRM, kein ERP und keine klassische Reinigungssoftware. Es ist der digitale Geschäftsführungs-Assistent der Blitzblank Dienstleistung UG. Version 1 konzentriert sich ausschließlich auf **Wachstum** — Akquise, Kommunikation, SEO und Marktbeobachtung. Verwaltung, Personal, Rechnungen und Einsatzplanung folgen erst in späteren Versionen.

## 2. Goldene Regel für jede Funktion

Jede Funktion muss mindestens eines dieser Ziele erfüllen:

1. **Zeit sparen**
2. **Mehr Aufträge gewinnen**

Erfüllt eine Idee keines der beiden Ziele, wird sie nicht gebaut.

## 3. Rollenverteilung KI ↔ Mensch (gilt für das gesamte System)

| Die KI macht | Der Nutzer macht |
|---|---|
| Firmen und Chancen finden, recherchieren | Senden-Klick beim Erstkontakt |
| Kontakt-E-Mails vorbereiten (Vorlage + Personalisierung) | Telefonate führen |
| An Follow-ups erinnern, Fund melden | **Jedes Angebot selbst schreiben und senden** |
| Muster/Auffälligkeiten melden | Abschluss verhandeln und abschließen |

Die KI öffnet die Tür, der Nutzer geht durch. Keine automatischen Angebote, keine automatischen Antworten auf Kundenreaktionen.

**Kernregel:** Niemand im Unternehmen soll dieselbe Arbeit zweimal machen. Ist eine E-Mail-Vorlage einmal hinterlegt, nutzt und personalisiert die KI sie ab sofort automatisch — kein erneutes Formulieren. Die KI merkt sich Entscheidungen und bereitet wiederkehrende Aufgaben von selbst vor. Der Mensch trifft Entscheidungen, nicht Routinearbeit.

## 4. Design-Philosophie

- Stil: Apple / Linear / Notion — minimalistisch, modern, ruhig
- Keine Excel-Ansicht, keine überladenen Menüs, keine Untermenü-Kaskaden
- Eine Aufgabe pro Bildschirm, wo möglich
- Wenig Farbe, viel Weißraum, große klare Karten
- Wiederkehrendes Muster für KI-Funde: **Karte → kurze Begründung ("warum") → ein Hauptbutton → Verwerfen-Option**

---

## 5. Modul: Dashboard

Startseite beantwortet ausschließlich:
- Was ist heute wichtig?
- Welche Chancen gibt es?
- Was hat die KI vorbereitet?

**Aufbau:**
- Kartenraster mit Zahlen: Neue Direktkunden, Neue Nachunternehmer, Follow-ups fällig, Antworten warten, SEO-Vorschläge, Marktchance erkannt
- Liste „Heute wichtig": **eine Zeile = eine Aktion**, Status als kleiner Punkt/Icon statt Text in der Zeile, ein Button pro Zeile
- SEO-Kurzüberblick: **täglich**, nicht wöchentlich

**Dashboard wird aktiv, nicht nur informativ:** Jede Karte ist direkt anklickbar und führt ohne Umweg zur passenden Freigabe — Direktkunden freigeben, Nachunternehmer freigeben, Follow-ups prüfen, SEO-Aufgaben prüfen, Marketing-Chancen prüfen. Ziel: minimale Klickzahl von der Startseite bis zur Entscheidung.

**Feste Navigation (immer sichtbar):** Dashboard · Direktkunden · Nachunternehmer · SEO · Marketing · Analyse · Einstellungen
„Kommunikation" ist bewusst kein eigener Navigationspunkt mehr — Vorlagen und Versand leben direkt in der jeweiligen Firmenakte, nicht als separater Menüpunkt. Das hält die Navigation auf sieben klare Punkte.

---

## 5a. KI-Assistent (Command-Bar, kein eigenes Modul)

Kein permanent sichtbares Chat-Fenster — das würde der Minimalismus-Regel widersprechen. Stattdessen ein diskretes Symbol/Tastenkürzel (Prinzip wie Spotlight/Cmd+K), das den Assistenten nur bei Bedarf einblendet.

**Funktion:** Freie Befehle zur Steuerung des gesamten Systems, z. B.:
- „Priorisiere Hotels."
- „Suche nur Krankenhäuser."
- „Zeige nur Brandenburg."
- „Warum wurde diese Firma ausgewählt?"
- „Erstelle heute nur Nachunternehmer-Vorschläge."
- „Ändere meine Prioritäten."

Der Assistent kennt den Kontext aller Module (Firmenakten, Follow-ups, SEO-Status) und wirkt wie eine zweite, freie Eingabe neben den festen Karten — für alles, was keine eigene Schaltfläche verdient.

---

## 6. Modul: Nachunternehmer

**Zweck:** Firmen finden, die Reinigungsleistungen an Subunternehmer vergeben (Facility-Management, große Gebäudedienstleister). Beziehungsaufbau über Jahre, nicht über Wochen.

**Die KI erklärt immer, warum eine Firma ausgewählt wurde** — z. B. „sucht Reinigungskräfte", „neue Niederlassung", „Expansion", „Facility Management", „Reinraum", „Industriereinigung". Diese Begründung steht direkt auf der Fund-Karte, nicht versteckt in der Akte — das war der Kern des „Wow"-Momentes, den wir bereits entworfen haben (Logistikpark-Marzahn-Beispiel).

**Firmenakte enthält:**
- Firmeninformationen, allgemeine Kontaktadresse
- Mehrere Ansprechpartner (Objektleiter, Niederlassungsleiter, Bereichsleiter), jeweils mit eigenem Kontaktstatus
- Historie, letzte Kontaktaufnahme, nächster Follow-up-Termin, Notizen

**Prozess:** Finden → Ansprechpartner recherchieren → Vorlage personalisieren → Kontaktsperre pro Person (verhindert doppelte/zu frühe Anschreiben) → Follow-up

**Follow-up-Logik:**
- Alle 3–4 Wochen ein Follow-up
- **Läuft dauerhaft weiter, keine automatische Kontaktsperre, kein „Kein Interesse"-Status** — nur manuell durch den Nutzer beendbar

---

## 7. Modul: Direktkunden

**Zweck:** Neue Auftraggeber gewinnen. Aktuell primär **ausgehend** (KI sucht aktiv), da eingehende Anfragen erst mit funktionierendem SEO in nennenswertem Umfang entstehen.

**Zwei Wege in dieselbe Firmenakte:**
- **Eingehend:** Anfrage per Telefon/E-Mail/Formular, Erfassung in unter 15 Sekunden, Kanal/Herkunft wird automatisch mitgespeichert (bisher nicht erfasst — wichtige Lücke, die geschlossen wird)
- **Ausgehend:** KI recherchiert passende Firmen (Bürogebäude, Kliniken, Hotels, Neubauten etc.), findet Ansprechpartner, bereitet E-Mail vor

**Follow-up-Logik (unterscheidet sich bewusst von Nachunternehmer):**
- Zählung von max. 3 Kontaktversuchen beginnt **erst nach Angebotsversand**, nicht beim reinen Erstkontakt
- Nach 3 erfolglosen Versuchen automatisch in den **„Kein Interesse"-Ordner**
- Ordner öffnet sich automatisch **alle 5 Monate** erneut für einen neuen, frischen Versuch

**Bewusst kein Scoring:** Keine Sternebewertung, keine künstlichen Punktzahlen pro Firma. Die KI liefert stattdessen immer eine kurze, konkrete Begründung im Klartext ("warum diese Firma"), keine abstrakte Zahl.

**Klarstellung E-Mail-Automatisierung (wichtig, da leicht zu verwechseln):** Kontakt- und Follow-up-E-Mails nutzt die KI vollautomatisch aus der hinterlegten Vorlage, personalisiert sie und versendet sie nach Sammel-Freigabe über Gmail. **Angebote mit Preisen sind davon ausdrücklich ausgenommen — die schreibt und versendet ausschließlich der Nutzer selbst.** Kein Widerspruch zur "KI erstellt alles"-Regel, sondern zwei unterschiedliche Textarten mit unterschiedlichem Freigabe-Grad.

---

## 8. Modul: Kommunikation

- Der Nutzer liefert eigene E-Mail-Vorlagen — getrennt für Direktkunden und Nachunternehmer
- Die KI ersetzt ausschließlich Anrede/Name individuell:
  - Bekannter Ansprechpartner → „Sehr geehrte(r) Herr/Frau [Nachname]"
  - Allgemeine Adresse (info@, poststelle@) → „Sehr geehrte Damen und Herren"
- Der Fließtext bleibt für alle Empfänger identisch, kein individuelles Umschreiben

**Sammel-Freigabe-Workflow:**
- Empfängerliste oben mit Status-Badge (Neu / Follow-up / Wiedervorlage)
- Eine gemeinsame Vorlagen-Vorschau darunter (nicht jede einzelne E-Mail wiederholt)
- Ein Klick „Alle senden" für die komplette Liste auf einmal

**Versand-Technik:**
- E-Mails laufen über das persönliche Gmail-Konto des Nutzers, damit automatisch Signatur, Branding und Website-Link enthalten sind
- **Wichtiger technischer Hinweis:** Im aktuellen Konzept-Chat kann nur ein Gmail-*Entwurf* erzeugt werden, kein direkter Versand. In der fertig gebauten Software wird eine eigene Gmail-Anbindung mit Versand-Berechtigung eingerichtet — dort funktioniert der beschriebene Ein-Klick-Massenversand wie gewünscht.

**Rechtlicher Hinweis:** Kaltakquise per E-Mail unterliegt in Deutschland § 7 UWG. Die Freigabe-Pflicht vor jedem Versand reduziert das Risiko; eine kurze anwaltliche Prüfung der finalen Vorlagen wird empfohlen, blockiert aber nicht die Konzeptarbeit.

---

## 9. Modul: SEO — das SEO-Center

**SEO hat höchste Priorität im gesamten System** — wichtiger eingestuft als jedes andere Wachstumsmodul. Deshalb wird daraus kein einfaches Modul, sondern ein vollständiges SEO-Center mit großer fachlicher Tiefe:

Website Health · Google Rankings · Google Business · Google Search Console · technische Fehler · Meta-Titel · Meta-Beschreibungen · ALT-Texte · interne Verlinkungen · Schema.org · Landingpages · Keyword-Optimierung · Backlink-Möglichkeiten · Wettbewerbsanalyse

**Wichtiges Architektur-Prinzip, um das nicht mit der Minimalismus-Regel zu kollidieren:** Diese Tiefe lebt **in der Engine, nicht auf dem Bildschirm.** Die Dashboard-Karte bleibt eine simple Tages-Übersicht ("3 Rankings verbessert, 2 Aktionen erledigt"). Wer tiefer will, klickt sich ins SEO-Center hinein — aber niemand wird mit allen 14 Teilbereichen auf einmal konfrontiert. Komplexität ist optional, nie Standard-Ansicht.

**Freigabe-Regel:**

| Art der Änderung | Freigabe nötig? |
|---|---|
| Neue Backlinks, neue Landingpages, Content ergänzen, Alt-Texte/Meta-Beschreibungen | Nein — autonom, mit nachträglicher Meldung |
| Bestehende wichtige Seiten strukturell verändern | Ja — vorherige Freigabe |

**Technischer Befund zur bestehenden Website (blitzblank-dienstleistung.com, Lovable-basiert):**
- Saubere, SEO-freundliche URL-Struktur (eigene Unterseiten pro Leistung und Branche) — gute Ausgangsbasis
- **Größte Lücke:** kein Content-/Blog-Bereich, dadurch keine Rankings für Suchanfragen abseits der Kernseiten
- Google hatte eine veraltete Version im Index (alte Adresse, fehlerhafte E-Mail) — Neuindexierung wurde beantragt, Sitemap bestätigt, Rechteübertragung der Search Console auf die korrekte E-Mail läuft (ca. 7 Tage Bearbeitungszeit bei Google)
- Namensverwechslungsrisiko mit ähnlich benannten Firmen festgestellt (z. B. „Blitz Blank Peterhoff GmbH", „blitzblank-bb.de") — vorgemerkt für Marketing Intelligence

**Laufender Betrieb:**
- Täglicher Kurzüberblick im Dashboard: „Automatisch erledigt" (mit Meldung) + „Wartet auf Freigabe"
- Bewertungsanfragen: automatisch vorbereitet nach „Auftrag abgeschlossen" (Auslöser aus der Direktkunden-Übergabeliste), Versand über denselben Sammel-Freigabe-Modus wie in Modul 8

---

## 10. Modul: Marketing Intelligence

Kein eigenständiges Modul mit eigener Firmenakte, sondern die **vorgelagerte Stufe** vor dem Direktkunden-Agenten — das „Chancen-Radar".

**Beobachtet:** neue Bauprojekte, Industriegebiete, Hotels, Pflegeheime, Bürogebäude, Logistikzentren, Expansionen und Marktveränderungen.

**Zusätzlich, explizit als eigener Signaltyp:** Wettbewerbsbeobachtung (z. B. Bewertungseinbrüche bei Mitbewerbern, Anzeichen für Dienstleisterwechsel) und aktives Erkennen von Marktlücken — beides mündet genau wie Bauprojekte in dieselbe Radar-Logik.

**Ablauf:** Ein Signal ohne bekannten Ansprechpartner reift im Radar. Sobald die KI einen Kontakt findet, wandert es automatisch in den Direktkunden-Agenten und wird zur vollständigen Firmenakte.

---

## 11. Modul: Unternehmensanalyse

Reine Auswertungsschicht ohne eigene Dateneingabe — nutzt ausschließlich Daten, die in den anderen Modulen ohnehin entstehen (Kanal-Herkunft, Branche, Antwortverhalten, Follow-up-Ausgänge).

**Zeigt z. B.:**
- Antwortquote nach Branche
- Welche Vorlagen/Kanäle funktionieren
- Wo Zeit oder Aufträge verloren gehen

**Wichtig:** Liefert am Anfang kaum Erkenntnisse — wird erst mit wachsender Datenmenge (Wochen/Monate) wirklich nützlich. Erkennt Muster und gibt konkrete Handlungsempfehlungen als Satz, nicht als Rohdaten-Tabelle, zum Beispiel:

- „Hotels reagieren aktuell besser als der Durchschnitt."
- „Reinraumreinigung entwickelt sich positiv."
- „Brandenburg bringt aktuell mehr Antworten als Berlin."
- „Diese Betreffzeile funktioniert nachweislich besser."
- „Konzentriere dich nächste Woche auf Industrie."

Jede daraus folgende Änderung (z. B. Vorlage anpassen, Fokus verschieben) läuft wieder über die normale Freigabe-Regel — die Analyse empfiehlt, sie handelt nicht selbst.

---

## 12. Offene Punkte vor dem technischen Start

1. Nutzer liefert die echten E-Mail-Vorlagen (Direktkunden + Nachunternehmer)
2. Kurze anwaltliche Prüfung der Vorlagen empfohlen (§ 7 UWG)
3. Google Search Console: Rechteübertragung abwarten (läuft)
4. Danach: Datenmodell, technische Architektur und Beginn der eigentlichen Umsetzung (Coding)

---

## 13. Datenmodell (V1, Single-User)

Kernentscheidung: **Firma** ist eine einzige Tabelle für Nachunternehmer und Direktkunden, unterschieden nur durch das Feld `typ` — das ist die technische Grundlage dafür, dass beide Module dieselbe Firmenakte teilen.

**FIRMA**
`typ` (Nachunternehmer/Direktkunde) · `name` · `branche` · `region` · `herkunft` (ausgehend/eingehend + Kanal) · `status` · `begründung` (KI-Freitext „warum gefunden") · `notizen`

**ANSPRECHPARTNER** (gehört zu einer Firma)
`vorname` · `nachname` · `rolle` · `email` · `telefon` · `letzter_kontakt_am` · `gesperrt_bis` (nur bei Direktkunden relevant)

**AKTIVITAET** (Historie, gehört zu einer Firma)
`typ` (E-Mail gesendet/Anruf/Angebot gesendet/Auftrag gewonnen) · `datum` · `beschreibung`

**FOLLOWUP** (gehört zu einer Firma)
`fällig_am` · `versuch_nr` (nur Direktkunden zählen bis 3, Nachunternehmer zählen nie) · `status`

**VORLAGE**
`typ` (Nachunternehmer/Direktkunde) · `betreff` · `text_mit_platzhaltern` · `aktiv`

**CHANCE** (Marketing-Intelligence-Radar, reift zu Firma)
`titel` · `signaltyp` (Bauprojekt/Wettbewerb/Expansion) · `status`

**AUFTRAG** (einfacher Stub, da Einsatzplanung V2)
`firma_id` · `status` (gewonnen/abgeschlossen) · löst bei „abgeschlossen" automatisch eine `BEWERTUNGSANFRAGE` aus

**Entscheidung zu Mehrbenutzer-Fähigkeit:** V1 ist bewusst auf einen einzelnen Nutzer zugeschnitten, keine Rechte-/Rollen-Tabellen. Ein möglicher Zugang für Sebastian Meyer (Vertriebsleiter) bleibt für eine spätere Version vorgemerkt.

---

## Zusammenfassung: Modulstatus

| Modul | Status |
|---|---|
| Dashboard | ✅ Konzept fertig |
| Nachunternehmer | ✅ Konzept fertig |
| Direktkunden | ✅ Konzept fertig |
| Kommunikation | ✅ Konzept fertig |
| SEO | ✅ Konzept fertig |
| Marketing Intelligence | ✅ Konzept fertig |
| Unternehmensanalyse | ✅ Konzept fertig |
