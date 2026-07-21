import { db } from "@/db";
import { firma } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { AnalyseErstellen } from "@/components/analyse-erstellen";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AnalysePage() {
  const [erkenntnisse, [firmenAnzahl]] = await Promise.all([
    db.query.analyseErkenntnis.findMany({
      orderBy: (e, { desc }) => desc(e.erstelltAm),
    }),
    db.select({ n: sql<number>`count(*)` }).from(firma),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Unternehmensanalyse
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reine Auswertungsschicht — Empfehlungen als Satz, nicht als
            Rohdaten-Tabelle.
          </p>
        </div>
        <AnalyseErstellen />
      </div>

      <section className="space-y-3">
        {erkenntnisse.length === 0 ? (
          <Card>
            <CardHeader className="flex-row items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <CardDescription>
                Liefert erst mit wachsender Datenmenge Erkenntnisse. Aktuell{" "}
                {firmenAnzahl.n} Firma(en) erfasst — ab 5 Firmen mit etwas
                Historie kann „Analyse aktualisieren" erste Muster erkennen
                (Antwortquote nach Branche, Region, Vorlagen-Wirkung).
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <ul className="space-y-3">
                {erkenntnisse.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                    {e.text}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Zuletzt aktualisiert:{" "}
                {datumFormat.format(erkenntnisse[0].erstelltAm)}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
