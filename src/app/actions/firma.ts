"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { firma, ansprechpartner, aktivitaet, followup } from "@/db/schema";
import { eq } from "drizzle-orm";

const modulPfad = {
  direktkunde: "/direktkunden",
  nachunternehmer: "/nachunternehmer",
} as const;

export async function firmaErfassen(formData: FormData) {
  const typ = formData.get("typ") as "direktkunde" | "nachunternehmer";
  const name = (formData.get("name") as string)?.trim();
  if (!name || !modulPfad[typ]) return;

  const [neu] = await db
    .insert(firma)
    .values({
      typ,
      name,
      branche: (formData.get("branche") as string)?.trim() || null,
      region: (formData.get("region") as string)?.trim() || null,
      herkunftKanal:
        (formData.get("herkunftKanal") as
          | "ausgehend"
          | "eingehend_telefon"
          | "eingehend_email"
          | "eingehend_formular") ?? "ausgehend",
    })
    .returning({ id: firma.id });

  revalidatePath(modulPfad[typ]);
  redirect(`${modulPfad[typ]}/${neu.id}`);
}

export async function ansprechpartnerHinzufuegen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  const nachname = (formData.get("nachname") as string)?.trim();
  if (!firmaId || !nachname) return;

  await db.insert(ansprechpartner).values({
    firmaId,
    vorname: (formData.get("vorname") as string)?.trim() || null,
    nachname,
    rolle: (formData.get("rolle") as string)?.trim() || null,
    email: (formData.get("email") as string)?.trim() || null,
    telefon: (formData.get("telefon") as string)?.trim() || null,
  });

  revalidatePath(`/direktkunden/${firmaId}`);
  revalidatePath(`/nachunternehmer/${firmaId}`);
}

export async function notizenSpeichern(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  if (!firmaId) return;

  await db
    .update(firma)
    .set({ notizen: (formData.get("notizen") as string) || null, aktualisiertAm: new Date() })
    .where(eq(firma.id, firmaId));

  revalidatePath(`/direktkunden/${firmaId}`);
  revalidatePath(`/nachunternehmer/${firmaId}`);
}

export async function aktivitaetErfassen(formData: FormData) {
  const firmaId = formData.get("firmaId") as string;
  const typ = formData.get("typ") as
    | "email_gesendet"
    | "anruf"
    | "angebot_gesendet"
    | "auftrag_gewonnen";
  if (!firmaId || !typ) return;

  const akte = await db.query.firma.findFirst({
    where: (f, { eq: gleich }) => gleich(f.id, firmaId),
  });
  if (!akte) return;

  await db.insert(aktivitaet).values({
    firmaId,
    typ,
    beschreibung: (formData.get("beschreibung") as string)?.trim() || null,
  });

  // Konzept-Logik: Folgeaktionen je nach Aktivitätstyp
  const inTagen = (tage: number) => {
    const d = new Date();
    d.setDate(d.getDate() + tage);
    return d;
  };

  if (typ === "angebot_gesendet" && akte.typ === "direktkunde") {
    // Zählung von max. 3 Versuchen beginnt erst mit Angebotsversand
    await db.insert(followup).values({
      firmaId,
      faelligAm: inTagen(7),
      versuchNr: 1,
    });
  } else if (typ === "email_gesendet") {
    await db.insert(followup).values({
      firmaId,
      faelligAm: inTagen(akte.typ === "nachunternehmer" ? 24 : 14),
    });
  }

  if (typ === "auftrag_gewonnen") {
    await db
      .update(firma)
      .set({ status: "gewonnen", aktualisiertAm: new Date() })
      .where(eq(firma.id, firmaId));
  } else if (akte.status === "neu") {
    await db
      .update(firma)
      .set({ status: "kontaktiert", aktualisiertAm: new Date() })
      .where(eq(firma.id, firmaId));
  }

  revalidatePath("/");
  revalidatePath(`/direktkunden/${firmaId}`);
  revalidatePath(`/nachunternehmer/${firmaId}`);
}
