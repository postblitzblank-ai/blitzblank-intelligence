import { db } from "@/db";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { zielKeywordEntfernen, zielKeywordHinzufuegen } from "@/app/actions/seo";

export async function ZielKeywords() {
  const keywords = await db.query.seoZielKeyword.findMany({
    orderBy: (k, { asc }) => asc(k.erstelltAm),
  });

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Für diese Suchbegriffe soll die Firma aktiv aufgebaut werden — auch
          wenn dafür aktuell noch kein Ranking existiert.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {keywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Ziel-Keywords festgelegt.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <li key={k.id}>
                <form action={zielKeywordEntfernen} className="inline-flex">
                  <input type="hidden" name="id" value={k.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full border bg-secondary px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    {k.keyword}
                    <X className="size-3" />
                  </button>
                </form>
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
