import { db } from "@/db";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChanceRadar } from "@/components/chance-radar";
import { ChanceZuFirma } from "@/components/chance-zu-firma";
import { chanceVerwerfen } from "@/app/actions/marketing";
import { ExternalLink, Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";
// Chancen-Radar (web_search) dauert regelmässig 20-40s -- ohne dieses Limit
// killt Vercels Standard-Timeout die Server Action vorzeitig.
export const maxDuration = 120;

const signaltypLabel: Record<string, string> = {
  bauprojekt: "Bauprojekt",
  wettbewerb: "Wettbewerb",
  expansion: "Expansion",
  ausschreibung: "Ausschreibung",
};

function externeUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export default async function MarketingPage() {
  const alle = await db.query.chance.findMany({
    orderBy: (c, { desc }) => desc(c.erstelltAm),
  });

  const neu = alle.filter((c) => c.status === "neu");
  const gereift = alle.filter((c) => c.status === "zu_firma_gereift");

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Marketing Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Das Chancen-Radar — Bauprojekte, Expansionen, Wettbewerbsbeobachtung
            und Marktlücken.
          </p>
        </div>
        <ChanceRadar />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Offene Signale ({neu.length})
        </h2>
        {neu.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Noch keine Signale. Starte oben das Radar.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {neu.map((c) => (
              <Card key={c.id} className="py-4">
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{signaltypLabel[c.signaltyp]}</Badge>
                      <p className="font-medium">{c.titel}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.beschreibung}</p>
                    {c.tiefenanalyse && (
                      <div className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Analyse: Objekte, Standorte, wahrscheinliche Nachfolger
                        </p>
                        <p>{c.tiefenanalyse}</p>
                      </div>
                    )}
                    {c.handlungsempfehlung && (
                      <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                        <span>{c.handlungsempfehlung}</span>
                      </div>
                    )}
                    {c.quelleUrl && (
                      <a
                        href={externeUrl(c.quelleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                      >
                        Quelle <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={chanceVerwerfen}>
                      <input type="hidden" name="chanceId" value={c.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Verwerfen
                      </Button>
                    </form>
                    <ChanceZuFirma chanceId={c.id} vorschlagName={c.titel} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {gereift.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Zur Firma gereift ({gereift.length})
          </h2>
          <div className="space-y-2">
            {gereift.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {c.titel}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
