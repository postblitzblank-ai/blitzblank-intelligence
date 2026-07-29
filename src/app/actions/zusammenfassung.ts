"use server";

import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { firma } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mitFreundlicherFehlerbehandlung } from "@/lib/fehler";

const anthropic = new Anthropic();

const modulPfad = {
  direktkunde: "/direktkunden",
  nachunternehmer: "/nachunternehmer",
} as const;

const zusammenfassungTool: Anthropic.Tool = {
  name: "zusammenfassung_melden",
  description: "Meldet eine kurze Einschätzung zu einer Firma.",
  input_schema: {
    type: "object",
    properties: {
      warum_interessant: {
        type: "string",
        description:
          "1-2 knappe Sätze auf Deutsch: warum diese Firma gerade jetzt für Blitzblank interessant ist, basierend auf den gegebenen Fakten.",
      },
      empfehlung: {
        type: "string",
        description:
          "Eine sehr kurze, direkte Handlungsempfehlung auf Deutsch, z. B. 'Heute anrufen. Nicht warten.' oder 'Erst Follow-up in 2 Wochen, noch zu früh.'",
      },
    },
    required: ["warum_interessant", "empfehlung"],
  },
};

/**
 * Auf-Klick-Einschätzung je Firma (Prozess: KI analysiert -> erklärt warum
 * interessant -> gibt eine klare Empfehlung). Wird in der Firma gespeichert,
 * damit ein erneuter Seitenaufruf keinen weiteren Anthropic-Aufruf braucht --
 * nur ein bewusstes "Neu generieren" löst einen neuen Aufruf aus.
 */
export async function zusammenfassungErstellen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  if (!firmaId) throw new Error("Keine Firma angegeben.");

  return mitFreundlicherFehlerbehandlung(
    "KI-Zusammenfassung",
    () => zusammenfassungErstellenDurchfuehren(firmaId),
    "Die KI-Zusammenfassung konnte gerade nicht erstellt werden. Bitte in ein paar Minuten erneut versuchen."
  );
}

async function zusammenfassungErstellenDurchfuehren(firmaId: string) {
  const f = await db.query.firma.findFirst({
    where: eq(firma.id, firmaId),
    with: {
      ansprechpartner: true,
      aktivitaeten: { orderBy: (a, { desc }) => desc(a.datum), limit: 5 },
      chancen: { orderBy: (c, { desc }) => desc(c.erstelltAm), limit: 5 },
      followups: {
        where: (fo, { eq: gleich }) => gleich(fo.status, "offen"),
        orderBy: (fo, { asc }) => asc(fo.faelligAm),
        limit: 3,
      },
    },
  });
  if (!f) throw new Error("Firma nicht gefunden.");

  const kontext = [
    `Firma: ${f.name}`,
    f.branche ? `Branche: ${f.branche}` : null,
    f.region ? `Region: ${f.region}` : null,
    `Status im CRM: ${f.status}`,
    f.begruendung ? `Ursprünglicher Recherche-Grund: ${f.begruendung}` : null,
    f.ansprechpartner.length > 0
      ? `Ansprechpartner bekannt: ${f.ansprechpartner
          .map((a) => [a.vorname, a.nachname, a.rolle].filter(Boolean).join(" "))
          .join(", ")}`
      : "Noch kein Ansprechpartner bekannt.",
    f.chancen.length
      ? `Verknüpfte Marktchancen:\n${f.chancen
          .map((c) => `- ${c.titel}${c.beschreibung ? `: ${c.beschreibung}` : ""}`)
          .join("\n")}`
      : null,
    f.aktivitaeten.length
      ? `Letzte Aktivitäten:\n${f.aktivitaeten
          .map((a) => `- ${a.typ} am ${a.datum.toLocaleDateString("de-DE")}${a.beschreibung ? `: ${a.beschreibung}` : ""}`)
          .join("\n")}`
      : "Noch keine Aktivitäten erfasst.",
    f.followups.length
      ? `Offenes Follow-up fällig am ${f.followups[0].faelligAm.toLocaleDateString("de-DE")}.`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const antwort = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    tool_choice: { type: "tool", name: "zusammenfassung_melden" },
    tools: [zusammenfassungTool],
    messages: [
      {
        role: "user",
        content: `Du bist der digitale Vertriebsleiter von Blitzblank Dienstleistung UG (gewerbliche Gebäudereinigung in Berlin). Analysiere die folgende Firma knapp und gib eine sehr konkrete, direkte Handlungsempfehlung -- kein Blabla, keine Allgemeinplätze.\n\n${kontext}`,
      },
    ],
  });

  if (antwort.stop_reason === "max_tokens") {
    throw new Error("Die Antwort der KI war zu lang und wurde abgeschnitten. Bitte erneut versuchen.");
  }

  const toolUse = antwort.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  const eingabe = toolUse?.input as
    | { warum_interessant?: string; empfehlung?: string }
    | undefined;
  if (!eingabe?.warum_interessant?.trim() || !eingabe?.empfehlung?.trim()) {
    throw new Error("Die KI konnte keine Einschätzung erstellen. Bitte erneut versuchen.");
  }

  const warumInteressant = eingabe.warum_interessant.trim();
  const empfehlung = eingabe.empfehlung.trim();
  const erstelltAm = new Date();

  await db
    .update(firma)
    .set({
      kiZusammenfassungText: warumInteressant,
      kiZusammenfassungEmpfehlung: empfehlung,
      kiZusammenfassungAm: erstelltAm,
    })
    .where(eq(firma.id, firmaId));

  revalidatePath(modulPfad[f.typ]);
  revalidatePath(`${modulPfad[f.typ]}/${f.id}`);

  return { warumInteressant, empfehlung, erstelltAm };
}
