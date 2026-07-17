import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { db } from "@/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Sammel-Freigabe gemäß Konzept Modul 8: Empfängerliste oben mit Status-Badge,
 * eine gemeinsame Vorlagen-Vorschau darunter, ein Klick "Alle senden".
 * Der echte Versand folgt mit der Gmail-Anbindung.
 */
export async function Freigabe({
  typ,
  basisPfad,
  titel,
}: {
  typ: "direktkunde" | "nachunternehmer";
  basisPfad: string;
  titel: string;
}) {
  const [empfaenger, vorlageAktiv] = await Promise.all([
    db.query.firma.findMany({
      where: (f, { and, eq, inArray }) =>
        and(eq(f.typ, typ), inArray(f.status, ["neu"])),
      with: { ansprechpartner: true },
      orderBy: (f, { desc }) => desc(f.erstelltAm),
    }),
    db.query.vorlage.findFirst({
      where: (v, { and, eq }) => and(eq(v.typ, typ), eq(v.aktiv, true)),
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={basisPfad}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Zurück zur Liste
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sammel-Freigabe · {titel}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle neuen Firmen erhalten dieselbe Vorlage — nur die Anrede wird
          individuell ersetzt.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Empfänger ({empfaenger.length})
        </h2>
        {empfaenger.length === 0 ? (
          <Card>
            <CardHeader>
              <CardDescription>
                Keine offenen Empfänger — alle neuen Firmen wurden bereits
                kontaktiert.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <ul className="space-y-3">
                {empfaenger.map((f) => {
                  const p = f.ansprechpartner.find((a) => a.email) ?? null;
                  return (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 text-sm">
                        <Link
                          href={`${basisPfad}/${f.id}`}
                          className="font-medium hover:underline"
                        >
                          {f.name}
                        </Link>
                        <span className="ml-2 text-muted-foreground">
                          {p
                            ? `Sehr geehrte(r) Herr/Frau ${p.nachname} · ${p.email}`
                            : "Sehr geehrte Damen und Herren · allgemeine Adresse"}
                        </span>
                      </div>
                      <Badge variant="secondary">Neu</Badge>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Vorlagen-Vorschau
        </h2>
        {vorlageAktiv ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{vorlageAktiv.betreff}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {vorlageAktiv.textMitPlatzhaltern}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardDescription>Keine aktive Vorlage hinterlegt.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Der Versand über dein Gmail-Konto wird freigeschaltet, sobald die
          Google-Anbindung eingerichtet ist.
        </p>
        <Button disabled>
          <Mail className="size-4" /> Alle senden ({empfaenger.length})
        </Button>
      </div>
    </div>
  );
}
