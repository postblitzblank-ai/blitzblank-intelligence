import { db } from "@/db";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { zielKeywordEntfernen, zielKeywordHinzufuegen } from "@/app/actions/seo";
import { ZielKeywordsAktualisieren } from "@/components/ziel-keywords-aktualisieren";

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function PositionBadge({ position }: { position: number | null }) {
  if (position == null) {
    return <Badge variant="outline">Kein Ranking</Badge>;
  }
  if (position <= 10) {
    return (
      <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
        Platz {position.toFixed(1)} · Seite 1
      </Badge>
    );
  }
  if (position <= 20) {
    return (
      <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700">
        Platz {position.toFixed(1)}
      </Badge>
    );
  }
  return <Badge variant="secondary">Platz {position.toFixed(0)}</Badge>;
}

export async function ZielKeywords() {
  const keywords = await db.query.seoZielKeyword.findMany({
    orderBy: (k, { asc }) => asc(k.erstelltAm),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <CardDescription>
          Für diese Suchbegriffe soll die Firma aktiv aufgebaut werden. Die
          Position wird täglich automatisch aus der echten Google Search
          Console geprüft.
        </CardDescription>
        <ZielKeywordsAktualisieren />
      </CardHeader>
      <CardContent className="space-y-4">
        {keywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Ziel-Keywords festgelegt.
          </p>
        ) : (
          <ul className="space-y-2">
            {keywords.map((k) => (
              <li
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium">{k.keyword}</p>
                  <p className="text-xs text-muted-foreground">
                    {k.zuletztGeprueftAm
                      ? `Geprüft am ${datumFormat.format(k.zuletztGeprueftAm)}${
                          k.impressionen != null
                            ? ` · ${k.impressionen} Impr. · ${k.klicks} Klicks (28 Tage)`
                            : ""
                        }`
                      : "Noch nicht geprüft"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PositionBadge position={k.aktuellePosition} />
                  <form action={zielKeywordEntfernen}>
                    <input type="hidden" name="id" value={k.id} />
                    <button
                      type="submit"
                      aria-label={`${k.keyword} entfernen`}
                      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form action={zielKeywordHinzufuegen} className="flex gap-2">
          <Input
            name="keyword"
            placeholder='z. B. "Gebäudereinigung Berlin"'
            className="flex-1"
            required
          />
          <Button type="submit" variant="secondary">
            Hinzufügen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
