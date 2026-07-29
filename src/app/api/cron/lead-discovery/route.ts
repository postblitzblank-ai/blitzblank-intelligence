import { NextRequest, NextResponse } from "next/server";
import { firmenRecherche } from "@/app/actions/recherche";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * Automatische Lead-Suche (Vercel Cron, siehe vercel.json): läuft mehrmals
 * täglich für Nachunternehmer und Direktkunden, ganz ohne dass der Nutzer
 * "KI-Recherche starten" klicken muss. Ergebnisse landen als "vorschlag" in
 * der Firmenliste, wo sie nur noch freigegeben oder verworfen werden müssen.
 */
export async function GET(request: NextRequest) {
  const autorisierung = request.headers.get("authorization");
  if (autorisierung !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const typ = request.nextUrl.searchParams.get("typ");
  if (typ !== "nachunternehmer" && typ !== "direktkunde") {
    return NextResponse.json({ error: "Ungültiger oder fehlender 'typ'-Parameter" }, { status: 400 });
  }

  const formData = new FormData();
  formData.set("typ", typ);

  try {
    await firmenRecherche(formData);
    return NextResponse.json({ status: "abgeschlossen", typ, zeit: new Date().toISOString() });
  } catch (error) {
    const nachricht = error instanceof Error ? error.message : String(error);
    console.error(`Automatische Lead-Suche (${typ}) fehlgeschlagen:`, error);
    return NextResponse.json({ status: "fehler", typ, fehler: nachricht }, { status: 500 });
  }
}
