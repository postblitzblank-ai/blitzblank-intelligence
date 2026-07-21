import { NextRequest, NextResponse } from "next/server";
import { keywordStrategieErstellen, zielKeywordsAktualisieren } from "@/app/actions/seo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Täglicher Hintergrund-Job (Vercel Cron, siehe vercel.json): aktualisiert
 * die Google-Position jedes Ziel-Keywords automatisch, ganz ohne dass der
 * Nutzer etwas klicken muss. Einmal pro Woche (Montag) erstellt die KI
 * zusätzlich neue Strategie-Vorschläge auf Basis der aktuellen Daten.
 */
export async function GET(request: NextRequest) {
  const autorisierung = request.headers.get("authorization");
  if (autorisierung !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ergebnisse: Record<string, string> = {};

  try {
    await zielKeywordsAktualisieren();
    ergebnisse.rankings = "ok";
  } catch (error) {
    ergebnisse.rankings = "fehler: " + (error instanceof Error ? error.message : String(error));
  }

  const istMontag = new Date().getUTCDay() === 1;
  if (istMontag) {
    try {
      await keywordStrategieErstellen();
      ergebnisse.strategie = "ok";
    } catch (error) {
      ergebnisse.strategie =
        "fehler: " + (error instanceof Error ? error.message : String(error));
    }
  }

  return NextResponse.json({
    status: "abgeschlossen",
    zeit: new Date().toISOString(),
    ergebnisse,
  });
}
