import { eq } from "drizzle-orm";
import { db } from "@/db";
import { googleVerbindung } from "@/db/schema";

/**
 * Der Google-Refresh-Token wird zusätzlich zur Browser-Session dauerhaft
 * in der Datenbank gespeichert, damit tägliche Hintergrund-Jobs (Cron)
 * ohne aktiven Login auf Gmail/Search Console zugreifen können.
 */
export async function refreshTokenSpeichern(refreshToken: string) {
  const vorhanden = await db.query.googleVerbindung.findFirst();
  if (vorhanden) {
    await db
      .update(googleVerbindung)
      .set({ refreshToken, aktualisiertAm: new Date() })
      .where(eq(googleVerbindung.id, vorhanden.id));
  } else {
    await db.insert(googleVerbindung).values({ refreshToken });
  }
}

export async function accessTokenErneuern(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const daten = await response.json();
  if (!response.ok) {
    throw new Error("Token-Erneuerung fehlgeschlagen: " + JSON.stringify(daten));
  }
  return {
    accessToken: daten.access_token as string,
    expiresAt: Math.floor(Date.now() / 1000) + (daten.expires_in as number),
    refreshToken: (daten.refresh_token as string | undefined) ?? refreshToken,
  };
}

/**
 * Für Hintergrund-Jobs ohne Browser-Session (z. B. Cron): lädt den
 * gespeicherten Refresh-Token aus der DB und tauscht ihn gegen einen
 * frischen Access-Token. Gibt null zurück, wenn noch nie verbunden wurde.
 */
export async function hintergrundAccessTokenHolen() {
  const verbindung = await db.query.googleVerbindung.findFirst();
  if (!verbindung) return null;

  const erneuert = await accessTokenErneuern(verbindung.refreshToken);
  if (erneuert.refreshToken !== verbindung.refreshToken) {
    await refreshTokenSpeichern(erneuert.refreshToken);
  }
  return erneuert.accessToken;
}
