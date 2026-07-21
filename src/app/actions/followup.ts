"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { firma, followup } from "@/db/schema";
import { eq } from "drizzle-orm";

function inTagen(tage: number) {
  const d = new Date();
  d.setDate(d.getDate() + tage);
  return d;
}

function inMonaten(monate: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monate);
  return d;
}

function revalidieren(firmaId: string) {
  revalidatePath("/");
  revalidatePath(`/direktkunden/${firmaId}`);
  revalidatePath(`/nachunternehmer/${firmaId}`);
}

export async function followupPlanen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  const tage = Number(formData.get("tage")) || 14;
  if (!firmaId) return;

  await db.insert(followup).values({ firmaId, faelligAm: inTagen(tage) });
  revalidieren(firmaId);
}

/**
 * Follow-up abschließen. Konzept-Logik:
 * - "antwort": nur erledigt markieren, der Nutzer entscheidet das Weitere.
 * - "keine_antwort" Nachunternehmer: nächstes Follow-up in 3–4 Wochen,
 *   läuft dauerhaft, nie "kein Interesse".
 * - "keine_antwort" Direktkunde mit laufender Zählung (nach Angebot):
 *   bis Versuch 3, danach Status "kein_interesse" und Wiedervorlage in 5 Monaten.
 * - "keine_antwort" Direktkunde ohne Zählung (vor Angebot): nächstes
 *   Follow-up in 2 Wochen, Zählung startet erst mit Angebotsversand.
 */
export async function followupAbschliessen(formData: FormData) {
  const followupId = formData.get("followupId") as string;
  const ergebnis = formData.get("ergebnis") as "antwort" | "keine_antwort";
  if (!followupId || !ergebnis) return;

  const fu = await db.query.followup.findFirst({
    where: (f, { eq }) => eq(f.id, followupId),
    with: { firma: true },
  });
  if (!fu || fu.status !== "offen") return;

  await db
    .update(followup)
    .set({ status: "erledigt" })
    .where(eq(followup.id, followupId));

  if (ergebnis === "keine_antwort") {
    if (fu.firma.typ === "nachunternehmer") {
      await db.insert(followup).values({
        firmaId: fu.firmaId,
        faelligAm: inTagen(24),
      });
    } else if (fu.versuchNr != null) {
      if (fu.versuchNr >= 3) {
        await db
          .update(firma)
          .set({ status: "kein_interesse", aktualisiertAm: new Date() })
          .where(eq(firma.id, fu.firmaId));
        // Ordner öffnet sich nach 5 Monaten für einen frischen Versuch
        await db.insert(followup).values({
          firmaId: fu.firmaId,
          faelligAm: inMonaten(5),
        });
      } else {
        await db.insert(followup).values({
          firmaId: fu.firmaId,
          faelligAm: inTagen(14),
          versuchNr: fu.versuchNr + 1,
        });
      }
    } else {
      await db.insert(followup).values({
        firmaId: fu.firmaId,
        faelligAm: inTagen(14),
      });
    }
  }

  revalidieren(fu.firmaId);
}
