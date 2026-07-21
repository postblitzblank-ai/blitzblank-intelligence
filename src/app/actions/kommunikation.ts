"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { firma, aktivitaet, followup } from "@/db/schema";
import { eq } from "drizzle-orm";
import { emailSenden } from "@/lib/gmail";
import { hintergrundAccessTokenHolen } from "@/lib/google-token";

async function googleAccessTokenHolen() {
  const session = await auth();
  if (session?.accessToken) return session.accessToken;
  return hintergrundAccessTokenHolen();
}

const modulPfad = {
  direktkunde: "/direktkunden",
  nachunternehmer: "/nachunternehmer",
} as const;

function inTagen(tage: number) {
  const d = new Date();
  d.setDate(d.getDate() + tage);
  return d;
}

/**
 * Sammel-Freigabe-Versand (Modul 8): Eine E-Mail pro Firma mit status="neu",
 * Anrede individuell ersetzt, Fließtext identisch. Läuft über das echte
 * Gmail-Konto des Nutzers. Kein Rate für die Anrede: fehlt eine sicher
 * bekannte Anrede, wird die neutrale Form verwendet statt zu raten.
 */
export async function alleSenden(formData: FormData) {
  const typ = formData.get("typ") as "direktkunde" | "nachunternehmer";
  if (!modulPfad[typ]) throw new Error("Ungültiger Modultyp.");

  const accessToken = await googleAccessTokenHolen();
  if (!accessToken) {
    throw new Error("Nicht mit Google verbunden. Bitte zuerst in den Einstellungen verbinden.");
  }

  const vorlage = await db.query.vorlage.findFirst({
    where: (v, { and: und, eq: gleich }) => und(gleich(v.typ, typ), gleich(v.aktiv, true)),
  });
  if (!vorlage) {
    throw new Error("Keine aktive Vorlage für dieses Modul hinterlegt.");
  }

  const empfaenger = await db.query.firma.findMany({
    where: (f, { and: und, eq: gleich, inArray: inList }) =>
      und(gleich(f.typ, typ), inList(f.status, ["neu"])),
    with: { ansprechpartner: true },
  });

  let gesendet = 0;
  const uebersprungen: string[] = [];

  for (const f of empfaenger) {
    const kontakt = f.ansprechpartner.find((a) => a.email) ?? null;
    const empfaengerEmail = kontakt?.email ?? f.email;

    if (!empfaengerEmail) {
      uebersprungen.push(`${f.name} (keine E-Mail-Adresse bekannt)`);
      continue;
    }

    const anrede =
      kontakt?.anrede && kontakt?.nachname
        ? `Sehr geehrte${kontakt.anrede === "Frau" ? "" : "r"} ${kontakt.anrede} ${kontakt.nachname},`
        : "Sehr geehrte Damen und Herren,";

    const text = vorlage.textMitPlatzhaltern.replace("{{anrede}}", anrede);

    try {
      await emailSenden(accessToken, {
        an: empfaengerEmail,
        betreff: vorlage.betreff,
        text,
      });
    } catch (error) {
      uebersprungen.push(
        `${f.name} (Versand fehlgeschlagen: ${error instanceof Error ? error.message : "unbekannter Fehler"})`
      );
      continue;
    }

    await db.insert(aktivitaet).values({
      firmaId: f.id,
      typ: "email_gesendet",
      beschreibung: `Sammel-Freigabe: ${vorlage.betreff}`,
    });
    await db.insert(followup).values({
      firmaId: f.id,
      faelligAm: inTagen(typ === "nachunternehmer" ? 24 : 14),
    });
    await db
      .update(firma)
      .set({ status: "kontaktiert", aktualisiertAm: new Date() })
      .where(eq(firma.id, f.id));

    gesendet++;
  }

  revalidatePath("/");
  revalidatePath(modulPfad[typ]);
  revalidatePath(`${modulPfad[typ]}/freigabe`);

  return { gesendet, uebersprungen };
}
