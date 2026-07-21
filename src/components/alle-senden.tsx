"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alleSenden } from "@/app/actions/kommunikation";

export function AlleSenden({
  typ,
  anzahl,
}: {
  typ: "direktkunde" | "nachunternehmer";
  anzahl: number;
}) {
  const [laeuft, setLaeuft] = React.useState(false);
  const [ergebnis, setErgebnis] = React.useState<{
    gesendet: number;
    uebersprungen: string[];
  } | null>(null);
  const [fehler, setFehler] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        disabled={laeuft || anzahl === 0}
        onClick={async () => {
          if (
            !window.confirm(
              `${anzahl} E-Mail(s) jetzt wirklich über dein Gmail-Konto versenden?`
            )
          ) {
            return;
          }
          setLaeuft(true);
          setFehler(null);
          setErgebnis(null);
          const formData = new FormData();
          formData.set("typ", typ);
          try {
            const res = await alleSenden(formData);
            setErgebnis(res);
          } catch (e) {
            setFehler(e instanceof Error ? e.message : "Versand fehlgeschlagen.");
          } finally {
            setLaeuft(false);
          }
        }}
      >
        <Mail className="size-4" />
        {laeuft ? "Wird gesendet …" : `Alle senden (${anzahl})`}
      </Button>
      {fehler && <p className="max-w-sm text-right text-sm text-destructive">{fehler}</p>}
      {ergebnis && (
        <div className="max-w-sm text-right text-sm">
          <p className="text-emerald-600">{ergebnis.gesendet} E-Mail(s) gesendet.</p>
          {ergebnis.uebersprungen.length > 0 && (
            <p className="mt-1 text-muted-foreground">
              Übersprungen: {ergebnis.uebersprungen.join("; ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
