"use server";

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { mitFreundlicherFehlerbehandlung } from "@/lib/fehler";

const anthropic = new Anthropic();

/**
 * Command-Bar KI (Modul 5a): freie Textbefehle wie "Priorisiere Hotels"
 * oder "Warum wurde diese Firma ausgewählt?" werden gegen den echten
 * Datenbestand beantwortet — keine Erfindungen, nur was tatsächlich
 * erfasst ist.
 */
export async function befehlAusfuehren(formData: FormData) {
  const text = (formData.get("text") as string)?.trim();
  if (!text) throw new Error("Bitte einen Befehl eingeben.");

  return mitFreundlicherFehlerbehandlung(
    "Command-Bar",
    () => befehlAusfuehrenDurchfuehren(text),
    "Der Befehl konnte gerade nicht ausgeführt werden. Bitte in ein paar Minuten erneut versuchen."
  );
}

async function befehlAusfuehrenDurchfuehren(text: string) {
  const firmen = await db.query.firma.findMany({
    columns: {
      name: true,
      typ: true,
      branche: true,
      region: true,
      status: true,
      begruendung: true,
    },
    limit: 300,
  });

  const kontext = firmen
    .map(
      (f) =>
        `- ${f.name} (${f.typ}, Status: ${f.status}${f.branche ? `, Branche: ${f.branche}` : ""}${
          f.region ? `, Region: ${f.region}` : ""
        })${f.begruendung ? ` — ${f.begruendung}` : ""}`
    )
    .join("\n");

  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `Du bist der KI-Assistent im Dashboard von Blitzblank Dienstleistung UG (Gebäudereinigung). Der Nutzer gibt einen freien Befehl oder eine Frage ein. Antworte kurz und konkret auf Deutsch, ausschließlich auf Basis der folgenden echten Firmendaten — erfinde nichts. Wenn der Befehl eine Sortierung/Priorisierung verlangt (z. B. "Priorisiere Hotels"), nenne die passenden Firmen aus der Liste in empfohlener Reihenfolge mit kurzer Begründung. Wenn es eine Frage zu einer bestimmten Firma ist, beantworte sie anhand der Begründung/Daten. Wenn nichts Passendes in den Daten ist, sag das ehrlich.

Firmen-Datenbestand (${firmen.length} Einträge, max. 300):
${kontext || "(noch keine Firmen erfasst)"}

Befehl: ${text}`,
      },
    ],
  });

  const antwortText = antwort.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  if (!antwortText) {
    throw new Error("Keine Antwort erhalten. Bitte erneut versuchen.");
  }

  return antwortText;
}
