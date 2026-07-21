import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  aktivitaetErfassen,
  ansprechpartnerHinzufuegen,
  notizenSpeichern,
} from "@/app/actions/firma";
import { followupAbschliessen, followupPlanen } from "@/app/actions/followup";

const kanalLabel: Record<string, string> = {
  ausgehend: "Ausgehend",
  eingehend_telefon: "Eingehend · Telefon",
  eingehend_email: "Eingehend · E-Mail",
  eingehend_formular: "Eingehend · Formular",
};

const aktivitaetLabel: Record<string, string> = {
  email_gesendet: "E-Mail gesendet",
  anruf: "Anruf",
  angebot_gesendet: "Angebot gesendet",
  auftrag_gewonnen: "Auftrag gewonnen",
};

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export async function Firmenakte({
  firmaId,
  basisPfad,
}: {
  firmaId: string;
  basisPfad: string;
}) {
  const akte = await db.query.firma.findFirst({
    where: (f, { eq }) => eq(f.id, firmaId),
    with: {
      ansprechpartner: true,
      aktivitaeten: { orderBy: (a, { desc }) => desc(a.datum) },
      followups: { orderBy: (f, { asc }) => asc(f.faelligAm) },
    },
  });

  if (!akte) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={basisPfad}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Zurück zur Liste
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{akte.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{kanalLabel[akte.herkunftKanal]}</Badge>
            <Badge variant="outline">{akte.status}</Badge>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[akte.branche, akte.region].filter(Boolean).join(" · ") ||
            "Branche und Region noch nicht erfasst"}
        </p>
      </div>

      {akte.begruendung && (
        <Card className="border-dashed">
          <CardHeader className="flex-row items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <CardDescription>Warum diese Firma: {akte.begruendung}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Ansprechpartner
        </h2>
        <Card>
          <CardContent className="space-y-4">
            {akte.ansprechpartner.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Ansprechpartner — E-Mails gehen an die allgemeine
                Adresse („Sehr geehrte Damen und Herren“).
              </p>
            ) : (
              <ul className="space-y-3">
                {akte.ansprechpartner.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-4">
                    <div>
                      <span className="text-sm font-medium">
                        {[p.vorname, p.nachname].filter(Boolean).join(" ")}
                      </span>
                      {p.rolle && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {p.rolle}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {[p.email, p.telefon].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Separator />
            <form
              action={ansprechpartnerHinzufuegen}
              className="grid grid-cols-2 gap-3 lg:grid-cols-6"
            >
              <input type="hidden" name="firmaId" value={akte.id} />
              <Input name="vorname" placeholder="Vorname" />
              <Input name="nachname" placeholder="Nachname *" required />
              <Input name="rolle" placeholder="Rolle" />
              <Input name="email" placeholder="E-Mail" type="email" />
              <Input name="telefon" placeholder="Telefon" />
              <Button type="submit" variant="secondary">
                Hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Follow-ups</h2>
        <Card>
          <CardContent className="space-y-4">
            {akte.followups.filter((f) => f.status === "offen").length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Kein Follow-up geplant.
              </p>
            ) : (
              <ul className="space-y-3">
                {akte.followups
                  .filter((f) => f.status === "offen")
                  .map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="text-sm">
                        <span className="font-medium tabular-nums">
                          Fällig am {datumFormat.format(f.faelligAm)}
                        </span>
                        {f.versuchNr != null && (
                          <Badge variant="outline" className="ml-2">
                            Versuch {f.versuchNr} von 3
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <form action={followupAbschliessen}>
                          <input type="hidden" name="followupId" value={f.id} />
                          <input type="hidden" name="ergebnis" value="antwort" />
                          <Button type="submit" size="sm" variant="secondary">
                            Antwort erhalten
                          </Button>
                        </form>
                        <form action={followupAbschliessen}>
                          <input type="hidden" name="followupId" value={f.id} />
                          <input
                            type="hidden"
                            name="ergebnis"
                            value="keine_antwort"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Keine Antwort
                          </Button>
                        </form>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
            <Separator />
            <form action={followupPlanen} className="flex items-center gap-3">
              <input type="hidden" name="firmaId" value={akte.id} />
              <select
                name="tage"
                defaultValue={akte.typ === "nachunternehmer" ? "24" : "14"}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="7">In 1 Woche</option>
                <option value="14">In 2 Wochen</option>
                <option value="24">In 3–4 Wochen</option>
              </select>
              <Button type="submit" variant="secondary" size="sm">
                Follow-up planen
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Historie</h2>
        <Card>
          <CardContent className="space-y-4">
            {akte.aktivitaeten.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Aktivitäten.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {akte.aktivitaeten.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-3 text-sm">
                    <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
                      {datumFormat.format(a.datum)}
                    </span>
                    <span className="font-medium">{aktivitaetLabel[a.typ]}</span>
                    {a.beschreibung && (
                      <span className="text-muted-foreground">{a.beschreibung}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Separator />
            <form
              action={aktivitaetErfassen}
              className="flex flex-col gap-3 lg:flex-row"
            >
              <input type="hidden" name="firmaId" value={akte.id} />
              <select
                name="typ"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="anruf">Anruf</option>
                <option value="email_gesendet">E-Mail gesendet</option>
                <option value="angebot_gesendet">Angebot gesendet</option>
                <option value="auftrag_gewonnen">Auftrag gewonnen</option>
              </select>
              <Input
                name="beschreibung"
                placeholder="Kurze Beschreibung (optional)"
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Eintragen
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Notizen</h2>
        <Card>
          <CardContent>
            <form action={notizenSpeichern} className="space-y-3">
              <input type="hidden" name="firmaId" value={akte.id} />
              <Textarea
                name="notizen"
                defaultValue={akte.notizen ?? ""}
                placeholder="Notizen zur Firma …"
                rows={4}
              />
              <Button type="submit" variant="secondary">
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
