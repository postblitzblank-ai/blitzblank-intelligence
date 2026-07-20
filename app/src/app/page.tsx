import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { firma, followup, chance, seoBefund } from "@/db/schema";
import { and, count, eq, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
});

export default async function Dashboard() {
  const [
    neueDirektkunden,
    neueNachunternehmer,
    followupsFaellig,
    chancen,
    faelligeListe,
    seoOffen,
    seoAutonomHeute,
  ] = await Promise.all([
      db
        .select({ n: count() })
        .from(firma)
        .where(and(eq(firma.typ, "direktkunde"), eq(firma.status, "neu"))),
      db
        .select({ n: count() })
        .from(firma)
        .where(and(eq(firma.typ, "nachunternehmer"), eq(firma.status, "neu"))),
      db
        .select({ n: count() })
        .from(followup)
        .where(
          and(eq(followup.status, "offen"), lte(followup.faelligAm, new Date()))
        ),
      db.select({ n: count() }).from(chance).where(eq(chance.status, "neu")),
      db.query.followup.findMany({
        where: (f, { and: und, eq: gleich, lte: bis }) =>
          und(gleich(f.status, "offen"), bis(f.faelligAm, new Date())),
        with: { firma: true },
        orderBy: (f, { asc }) => asc(f.faelligAm),
        limit: 10,
      }),
      db
        .select({ n: count() })
        .from(seoBefund)
        .where(and(eq(seoBefund.freigabeNoetig, true), eq(seoBefund.status, "offen"))),
      db.query.seoBefund.findMany({
        where: (b, { eq: gleich }) => gleich(b.status, "offen"),
        orderBy: (b, { desc }) => desc(b.erstelltAm),
        limit: 5,
      }),
    ]);

  const kennzahlen = [
    { label: "Neue Direktkunden", wert: neueDirektkunden[0].n, href: "/direktkunden" },
    {
      label: "Neue Nachunternehmer",
      wert: neueNachunternehmer[0].n,
      href: "/nachunternehmer",
    },
    { label: "Follow-ups fällig", wert: followupsFaellig[0].n, href: "/direktkunden" },
    { label: "Antworten warten", wert: 0, href: "/direktkunden" },
    { label: "SEO-Vorschläge", wert: seoOffen[0].n, href: "/seo" },
    { label: "Marktchance erkannt", wert: chancen[0].n, href: "/marketing" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Was ist heute wichtig? Welche Chancen gibt es? Was hat die KI vorbereitet?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {kennzahlen.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {k.wert}
                </CardTitle>
                <CardDescription>{k.label}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Heute wichtig</h2>
        {faelligeListe.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Nichts fällig — alle Follow-ups sind auf Kurs.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <ul className="space-y-2.5">
                {faelligeListe.map((f) => {
                  const pfad =
                    f.firma.typ === "direktkunde"
                      ? "/direktkunden"
                      : "/nachunternehmer";
                  return (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-2.5 text-sm">
                        <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                        <span className="truncate font-medium">
                          {f.firma.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          Follow-up fällig seit {datumFormat.format(f.faelligAm)}
                          {f.versuchNr != null && ` · Versuch ${f.versuchNr}/3`}
                        </span>
                      </div>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`${pfad}/${f.firmaId}`}>Akte öffnen</Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">SEO heute</h2>
        {seoAutonomHeute.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Noch keine Befunde — starte im SEO-Center einen Website-Check.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <ul className="space-y-2">
                {seoAutonomHeute.map((b) => (
                  <li key={b.id} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        b.freigabeNoetig ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    <span className="truncate">{b.titel}</span>
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
    </div>
  );
}
