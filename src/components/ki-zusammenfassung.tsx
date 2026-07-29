"use client";

import * as React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zusammenfassungErstellen } from "@/app/actions/zusammenfassung";

const datumFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function KiZusammenfassung({
  firmaId,
  text: initialText,
  empfehlung: initialEmpfehlung,
  erstelltAm: initialErstelltAm,
}: {
  firmaId: string;
  text: string | null;
  empfehlung: string | null;
  erstelltAm: Date | null;
}) {
  const [text, setText] = React.useState(initialText);
  const [empfehlung, setEmpfehlung] = React.useState(initialEmpfehlung);
  const [erstelltAm, setErstelltAm] = React.useState(initialErstelltAm);
  const [laeuft, setLaeuft] = React.useState(false);
  const [fehler, setFehler] = React.useState<string | null>(null);

  async function generieren() {
    setLaeuft(true);
    setFehler(null);
    const formData = new FormData();
    formData.set("firmaId", firmaId);
    try {
      const ergebnis = await zusammenfassungErstellen(formData);
      setText(ergebnis.warumInteressant);
      setEmpfehlung(ergebnis.empfehlung);
      setErstelltAm(ergebnis.erstelltAm);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Zusammenfassung fehlgeschlagen.");
    } finally {
      setLaeuft(false);
    }
  }

  if (!text) {
    return (
      <div className="space-y-2">
        <Button size="sm" variant="outline" onClick={generieren} disabled={laeuft}>
          <Sparkles className="size-3.5" />
          {laeuft ? "Wird erstellt …" : "KI-Zusammenfassung erstellen"}
        </Button>
        {fehler && <p className="text-sm text-destructive">{fehler}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm">{text}</p>
      {empfehlung && <p className="text-sm font-semibold text-primary">{empfehlung}</p>}
      <div className="flex items-center justify-between gap-2">
        {erstelltAm && (
          <p className="text-xs text-muted-foreground">
            Erstellt am {datumFormat.format(erstelltAm)}
          </p>
        )}
        <Button size="sm" variant="ghost" onClick={generieren} disabled={laeuft}>
          <RefreshCw className="size-3.5" />
          {laeuft ? "Wird aktualisiert …" : "Neu generieren"}
        </Button>
      </div>
      {fehler && <p className="text-sm text-destructive">{fehler}</p>}
    </div>
  );
}
