import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { firma, followup, chance } from "@/db/schema";
import { and, count, eq, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [neueDirektkunden, neueNachunternehmer, followupsFaellig, chancen] =
    await Promise.all([
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
    { label: "SEO-Vorschläge", wert: 0, href: "/seo" },
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
        <Card>
          <CardHeader>
            <CardDescription>
              Noch keine Aufgaben — die KI-Agenten sind noch nicht angebunden.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">SEO heute</h2>
        <Card>
          <CardHeader>
            <CardDescription>
              Der tägliche SEO-Kurzüberblick erscheint hier, sobald die
              Search-Console-Anbindung eingerichtet ist.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
