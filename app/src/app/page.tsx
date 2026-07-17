import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const kennzahlen = [
  { label: "Neue Direktkunden", wert: 0, href: "/direktkunden" },
  { label: "Neue Nachunternehmer", wert: 0, href: "/nachunternehmer" },
  { label: "Follow-ups fällig", wert: 0, href: "/direktkunden" },
  { label: "Antworten warten", wert: 0, href: "/direktkunden" },
  { label: "SEO-Vorschläge", wert: 0, href: "/seo" },
  { label: "Marktchance erkannt", wert: 0, href: "/marketing" },
];

export default function Dashboard() {
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
