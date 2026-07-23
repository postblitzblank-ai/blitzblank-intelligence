import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PositionBadge } from "@/components/ziel-keywords";
import { AlleSenden } from "@/components/alle-senden";
import { ChanceZuFirma } from "@/components/chance-zu-firma";
import { db } from "@/db";
import { firma, followup, chance, seoBefund } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";
import {
  vorschlagUebernehmen,
  vorschlagVerwerfen,
} from "@/app/actions/recherche";
import { followupAbschliessen } from "@/app/actions/followup";
import { chanceVerwerfen } from "@/app/actions/marketing";
import {
  seoBefundFreigeben,
  seoBefundVerwerfen,
  seoBefundErledigt,
} from "@/app/actions/seo";

export const dynamic = "force-dynamic";

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
});

const typLabel: Record<string, string> = {
  direktkunde: "Direktkunde",
  nachunternehmer: "Nachunternehmer",
};

const signaltypLabel: Record<string, string> = {
  bauprojekt: "Bauprojekt",
  wettbewerb: "Wettbewerb",
  expansion: "Expansion",
};

function externeUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export default async function Dashboard() {
  const [
    firmenVorschlaege,
    direktkundenBereit,
    nachunternehmerBereit,
    faelligeListe,
    chancenNeu,
    seoWartetAufFreigabe,
    seoAutonomOffen,
    zielKeywords,
  ] = await Promise.all([
    db.query.firma.findMany({
      where: (f, { eq: gleich }) => gleich(f.status, "vorschlag"),
      orderBy: (f, { desc }) => desc(f.erstelltAm),
      limit: 12,
    }),
    db.query.firma.findMany({
      where: (f, { and: und, eq: gleich }) =>
        und(gleich(f.typ, "direktkunde"), gleich(f.status, "neu")),
    }),
    db.query.firma.findMany({
      where: (f, { and: und, eq: gleich }) =>
        und(gleich(f.typ, "nachunternehmer"), gleich(f.status, "neu")),
    }),
    db.query.followup.findMany({
      where: (f, { and: und, eq: gleich, lte: bis }) =>
        und(gleich(f.status, "offen"), bis(f.faelligAm, new Date())),
      with: { firma: true },
      orderBy: (f, { asc }) => asc(f.faelligAm),
      limit: 10,
    }),
    db.query.chance.findMany({
      where: (c, { eq: gleich }) => gleich(c.status, "neu"),
      orderBy: (c, { desc }) => desc(c.erstelltAm),
      limit: 8,
    }),
    db.query.seoBefund.findMany({
      where: (b, { and: und, eq: gleich }) =>
        und(gleich(b.freigabeNoetig, true), gleich(b.status, "offen")),
      orderBy: (b, { desc }) => desc(b.erstelltAm),
    }),
    db.query.seoBefund.findMany({
      where: (b, { and: und, eq: gleich }) =>
        und(gleich(b.freigabeNoetig, false), gleich(b.status, "offen")),
      orderBy: (b, { desc }) => desc(b.erstelltAm),
      limit: 8,
    }),
    db.query.seoZielKeyword.findMany({
      orderBy: (k, { asc }) => asc(k.erstelltAm),
    }),
  ]);

  const alleOffen =
    firmenVorschlaege.length +
    faelligeListe.length +
    chancenNeu.length +
    seoWartetAufFreigabe.length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Heute</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {alleOffen === 0
            ? "Alles auf Kurs — nichts wartet auf deine Entscheidung."
            : `${alleOffen} Entscheidung${alleOffen === 1 ? "" : "en"} warten auf dich.`}
        </p>
      </div>

      {/* E-Mails bereit zum Versenden */}
      {(direktkundenBereit.length > 0 || nachunternehmerBereit.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            E-Mails vorbereitet
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {direktkundenBereit.length > 0 && (
              <Card className="py-4">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Direktkunden</p>
                    <p className="text-sm text-muted-foreground">
                      {direktkundenBereit.length} E-Mail(s) bereit
                    </p>
                  </div>
                  <AlleSenden typ="direktkunde" anzahl={direktkundenBereit.length} />
                </CardContent>
              </Card>
            )}
            {nachunternehmerBereit.length > 0 && (
              <Card className="py-4">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Nachunternehmer</p>
                    <p className="text-sm text-muted-foreground">
                      {nachunternehmerBereit.length} E-Mail(s) bereit
                    </p>
                  </div>
                  <AlleSenden typ="nachunternehmer" anzahl={nachunternehmerBereit.length} />
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Neue Firmen, von der KI automatisch gefunden */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Neue Firmen gefunden ({firmenVorschlaege.length})
        </h2>
        {firmenVorschlaege.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Gerade nichts Neues — die KI sucht automatisch weiter.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {firmenVorschlaege.map((f) => (
              <Card key={f.id} className="py-4">
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{typLabel[f.typ]}</Badge>
                      <p className="font-medium">{f.name}</p>
                      {f.region && (
                        <span className="text-sm text-muted-foreground">
                          {f.region}
                        </span>
                      )}
                    </div>
                    {f.begruendung && (
                      <p className="text-sm text-muted-foreground">{f.begruendung}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={vorschlagVerwerfen}>
                      <input type="hidden" name="firmaId" value={f.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Ablehnen
                      </Button>
                    </form>
                    <form action={vorschlagUebernehmen}>
                      <input type="hidden" name="firmaId" value={f.id} />
                      <Button type="submit" size="sm">
                        Freigeben
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Follow-ups, automatisch erinnert */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Follow-up fällig ({faelligeListe.length})
        </h2>
        {faelligeListe.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Nichts fällig — alle Follow-ups sind auf Kurs.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {faelligeListe.map((f) => {
              const pfad = f.firma.typ === "direktkunde" ? "/direktkunden" : "/nachunternehmer";
              return (
                <Card key={f.id} className="py-4">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                        <Link
                          href={`${pfad}/${f.firmaId}`}
                          className="truncate font-medium hover:underline"
                        >
                          {f.firma.name}
                        </Link>
                      </div>
                      <p className="ml-4 text-sm text-muted-foreground">
                        Fällig seit {datumFormat.format(f.faelligAm)}
                        {f.versuchNr != null && ` · Versuch ${f.versuchNr}/3`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <form action={followupAbschliessen}>
                        <input type="hidden" name="followupId" value={f.id} />
                        <input type="hidden" name="ergebnis" value="keine_antwort" />
                        <Button type="submit" size="sm" variant="ghost">
                          Keine Antwort
                        </Button>
                      </form>
                      <form action={followupAbschliessen}>
                        <input type="hidden" name="followupId" value={f.id} />
                        <input type="hidden" name="ergebnis" value="antwort" />
                        <Button type="submit" size="sm">
                          Antwort erhalten
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Marktchancen, automatisch analysiert */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Neue Marktchancen ({chancenNeu.length})
        </h2>
        {chancenNeu.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Noch keine neuen Signale — das Radar sucht automatisch weiter.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {chancenNeu.map((c) => (
              <Card key={c.id} className="py-4">
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{signaltypLabel[c.signaltyp]}</Badge>
                      <p className="font-medium">{c.titel}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.beschreibung}</p>
                    {c.handlungsempfehlung && (
                      <p className="mt-1.5 text-sm text-amber-700 dark:text-amber-400">
                        💡 {c.handlungsempfehlung}
                      </p>
                    )}
                    {c.quelleUrl && (
                      <a
                        href={externeUrl(c.quelleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-muted-foreground hover:underline"
                      >
                        Quelle
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={chanceVerwerfen}>
                      <input type="hidden" name="chanceId" value={c.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Ablehnen
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

      {/* SEO: strukturelle Änderungen, die eine Freigabe brauchen */}
      {seoWartetAufFreigabe.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            SEO wartet auf Freigabe ({seoWartetAufFreigabe.length})
          </h2>
          <div className="space-y-2.5">
            {seoWartetAufFreigabe.map((b) => (
              <Card key={b.id} className="border-amber-500/30 py-4">
                <CardContent className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{b.titel}</p>
                    <p className="text-sm text-muted-foreground">{b.beschreibung}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={seoBefundVerwerfen}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Ablehnen
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

      {/* SEO: automatisch erledigt, nur zur Kenntnis */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          SEO automatisch erledigt ({seoAutonomOffen.length})
        </h2>
        {seoAutonomOffen.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>Nichts Neues seit dem letzten Check.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <ul className="space-y-2">
                {seoAutonomOffen.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                      <span className="truncate">{b.titel}</span>
                    </span>
                    <form action={seoBefundErledigt}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Zur Kenntnis genommen
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" variant="secondary" className="mt-3">
                <Link href="/seo">Alle SEO-Befunde ansehen</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {zielKeywords.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Keyword-Rankings</h2>
          <Card>
            <CardContent>
              <ul className="space-y-2.5">
                {zielKeywords.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm font-medium">{k.keyword}</span>
                    <PositionBadge position={k.aktuellePosition} />
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" variant="secondary" className="mt-3">
                <Link href="/seo">Details im SEO-Center</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
