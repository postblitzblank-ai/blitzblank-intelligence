import { db } from "@/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const typLabel: Record<string, string> = {
  direktkunde: "Direktkunden",
  nachunternehmer: "Nachunternehmer",
};

export default async function EinstellungenPage() {
  const vorlagen = await db.query.vorlage.findMany({
    orderBy: (v, { asc }) => asc(v.typ),
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Google-Anbindung, E-Mail-Vorlagen und Prioritäten.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          E-Mail-Vorlagen
        </h2>
        {vorlagen.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base">{v.betreff}</CardTitle>
                <div className="flex shrink-0 gap-2">
                  <Badge variant="secondary">{typLabel[v.typ]}</Badge>
                  {v.aktiv && <Badge variant="outline">Aktiv</Badge>}
                </div>
              </div>
              <CardDescription>
                Die KI ersetzt beim Versand ausschließlich die Anrede
                ({"{{anrede}}"}) — der Fließtext bleibt für alle identisch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {v.textMitPlatzhaltern}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Verbindungen
        </h2>
        <Card>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Anthropic (KI): eingerichtet ✓</p>
            <p>Datenbank: lokale Entwicklungs-Datenbank (Cloud-Umzug folgt)</p>
            <p>Gmail-Versand: noch nicht verbunden</p>
            <p>Google Search Console: noch nicht verbunden</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
