import Link from "next/link";
import { db } from "@/db";
import { firma } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FirmaErfassen } from "@/components/firma-erfassen";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const kanalLabel: Record<string, string> = {
  ausgehend: "Ausgehend",
  eingehend_telefon: "Eingehend · Telefon",
  eingehend_email: "Eingehend · E-Mail",
  eingehend_formular: "Eingehend · Formular",
};

export async function FirmenListe({
  typ,
  titel,
  untertitel,
  basisPfad,
}: {
  typ: "direktkunde" | "nachunternehmer";
  titel: string;
  untertitel: string;
  basisPfad: string;
}) {
  const firmen = await db
    .select()
    .from(firma)
    .where(eq(firma.typ, typ))
    .orderBy(desc(firma.aktualisiertAm));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{titel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{untertitel}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`${basisPfad}/freigabe`}>
              <Mail className="size-4" /> Sammel-Freigabe
            </Link>
          </Button>
          <FirmaErfassen typ={typ} />
        </div>
      </div>

      {firmen.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>
              Noch keine Firmen. Erfasse die erste über „Firma erfassen“ — die
              KI-Recherche kommt in einem späteren Schritt dazu.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {firmen.map((f) => (
            <Link key={f.id} href={`${basisPfad}/${f.id}`} className="block">
              <Card className="py-4 transition-colors hover:bg-accent/50">
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base font-medium">
                      {f.name}
                    </CardTitle>
                    <CardDescription className="mt-0.5 truncate">
                      {[f.branche, f.region].filter(Boolean).join(" · ") ||
                        "Keine Details"}
                      {f.begruendung ? ` — ${f.begruendung}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">{kanalLabel[f.herkunftKanal]}</Badge>
                    <span
                      className="size-2 rounded-full bg-emerald-500"
                      title={f.status}
                    />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
