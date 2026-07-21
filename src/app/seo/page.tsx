import { db } from "@/db";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WebsiteCheck } from "@/components/website-check";
import { Rankings } from "@/components/rankings";
import {
  seoBefundErledigt,
  seoBefundFreigeben,
  seoBefundVerwerfen,
} from "@/app/actions/seo";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

function externeUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

const kategorieLabel: Record<string, string> = {
  technisch: "Technisch",
  meta: "Meta-Angaben",
  content: "Content",
  backlink: "Backlinks",
  wettbewerb: "Wettbewerb",
  struktur: "Struktur",
};

export default async function SeoPage() {
  const alle = await db.query.seoBefund.findMany({
    orderBy: (b, { desc }) => desc(b.erstelltAm),
  });

  const wartetAufFreigabe = alle.filter(
    (b) => b.freigabeNoetig && b.status === "offen"
  );
  const autonom = alle.filter((b) => !b.freigabeNoetig && b.status === "offen");
  const erledigt = alle.filter((b) => b.status === "erledigt" || b.status === "freigegeben");

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SEO-Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Website Health, Rankings, Search Console, technische Fehler — Tiefe
            in der Engine, nicht auf dem Bildschirm.
          </p>
        </div>
        <WebsiteCheck />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Rankings (letzte 28 Tage)
        </h2>
        <Rankings />
      </section>

      {wartetAufFreigabe.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Wartet auf Freigabe ({wartetAufFreigabe.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Strukturelle Änderungen an bestehenden wichtigen Seiten — nur nach
            deiner Zustimmung.
          </p>
          <div className="space-y-2.5">
            {wartetAufFreigabe.map((b) => (
              <Card key={b.id} className="border-amber-500/30 py-4">
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{kategorieLabel[b.kategorie]}</Badge>
                      <p className="font-medium">{b.titel}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{b.beschreibung}</p>
                    {b.quelleUrl && (
                      <a
                        href={externeUrl(b.quelleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                      >
                        Quelle <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={seoBefundVerwerfen}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Verwerfen
                      </Button>
                    </form>
                    <form action={seoBefundFreigeben}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm">
                        Freigeben
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Automatisch erledigt — Meldung ({autonom.length})
        </h2>
        <p className="text-xs text-muted-foreground">
          Neue Backlinks, Landingpages, Content, Alt-Texte/Meta-Beschreibungen:
          keine Freigabe nötig, nur zur Kenntnis.
        </p>
        {autonom.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Noch keine Befunde. Starte oben einen Website-Check.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {autonom.map((b) => (
              <Card key={b.id} className="py-4">
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{kategorieLabel[b.kategorie]}</Badge>
                      <p className="font-medium">{b.titel}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{b.beschreibung}</p>
                    {b.quelleUrl && (
                      <a
                        href={externeUrl(b.quelleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                      >
                        Quelle <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <form action={seoBefundErledigt}>
                    <input type="hidden" name="id" value={b.id} />
                    <Button type="submit" size="sm" variant="secondary">
                      Erledigt
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {erledigt.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Erledigt ({erledigt.length})
          </h2>
          <div className="space-y-2">
            {erledigt.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                {b.titel}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
