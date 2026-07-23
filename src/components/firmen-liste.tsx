import Link from "next/link";
import { db } from "@/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FirmaErfassen } from "@/components/firma-erfassen";
import { KiRecherche } from "@/components/ki-recherche";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Phone, User } from "lucide-react";
import { vorschlagUebernehmen, vorschlagVerwerfen } from "@/app/actions/recherche";

const kanalLabel: Record<string, string> = {
  ausgehend: "Ausgehend",
  eingehend_telefon: "Eingehend · Telefon",
  eingehend_email: "Eingehend · E-Mail",
  eingehend_formular: "Eingehend · Formular",
};

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
});

function naechsteAufgabe(f: {
  status: string;
  followups: { faelligAm: Date }[];
}): string {
  if (f.followups[0]) {
    return `Follow-up am ${datumFormat.format(f.followups[0].faelligAm)}`;
  }
  if (f.status === "neu") return "Erstkontakt senden";
  if (f.status === "kontaktiert") return "Follow-up planen";
  if (f.status === "gewonnen") return "Auftrag abschließen";
  return "Kein Follow-up geplant";
}

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
  const alle = await db.query.firma.findMany({
    where: (f, { eq: gleich }) => gleich(f.typ, typ),
    orderBy: (f, { desc: absteigend }) => absteigend(f.aktualisiertAm),
    with: {
      ansprechpartner: { limit: 1 },
      aktivitaeten: { orderBy: (a, { desc: absteigend }) => absteigend(a.datum), limit: 1 },
      followups: {
        where: (f, { eq: gleich }) => gleich(f.status, "offen"),
        orderBy: (f, { asc }) => asc(f.faelligAm),
        limit: 1,
      },
    },
  });

  const vorschlaege = alle.filter((f) => f.status === "vorschlag");
  const firmen = alle.filter((f) => f.status !== "vorschlag");

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
          <KiRecherche typ={typ} />
          <FirmaErfassen typ={typ} />
        </div>
      </div>

      {vorschlaege.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-4" /> KI-Vorschläge ({vorschlaege.length})
          </h2>
          <div className="space-y-2.5">
            {vorschlaege.map((f) => (
              <Card key={f.id} className="border-dashed py-4">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{f.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[f.branche, f.region].filter(Boolean).join(" · ")}
                      {f.begruendung ? ` — ${f.begruendung}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={vorschlagVerwerfen}>
                      <input type="hidden" name="firmaId" value={f.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Verwerfen
                      </Button>
                    </form>
                    <form action={vorschlagUebernehmen}>
                      <input type="hidden" name="firmaId" value={f.id} />
                      <Button type="submit" size="sm">
                        Übernehmen
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {firmen.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>
              Noch keine Firmen. Erfasse die erste über „Firma erfassen“ oder
              starte eine KI-Recherche.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {firmen.map((f) => {
            const kontakt = f.ansprechpartner[0];
            const letzterKontakt = f.aktivitaeten[0];
            return (
              <Link key={f.id} href={`${basisPfad}/${f.id}`} className="block">
                <Card className="py-4 transition-colors hover:bg-accent/50">
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base font-medium">
                        {f.name}
                      </CardTitle>
                      <CardDescription className="mt-0.5 truncate">
                        {[f.branche, f.region].filter(Boolean).join(" · ") ||
                          "Keine Details"}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {kontakt && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {[kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ")}
                            {kontakt.rolle ? ` · ${kontakt.rolle}` : ""}
                          </span>
                        )}
                        {kontakt?.telefon && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" /> {kontakt.telefon}
                          </span>
                        )}
                        {(kontakt?.email || f.email) && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" /> {kontakt?.email || f.email}
                          </span>
                        )}
                        {letzterKontakt && (
                          <span>
                            Letzter Kontakt: {datumFormat.format(letzterKontakt.datum)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-foreground">
                        {naechsteAufgabe(f)}
                      </p>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
