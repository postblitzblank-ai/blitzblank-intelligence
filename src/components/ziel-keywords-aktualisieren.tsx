"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zielKeywordsAktualisieren } from "@/app/actions/seo";

export function ZielKeywordsAktualisieren() {
  const [laeuft, setLaeuft] = React.useState(false);
  const [fehler, setFehler] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        disabled={laeuft}
        onClick={async () => {
          setLaeuft(true);
          setFehler(null);
          try {
            await zielKeywordsAktualisieren();
          } catch (e) {
            setFehler(e instanceof Error ? e.message : "Aktualisierung fehlgeschlagen.");
          } finally {
            setLaeuft(false);
          }
        }}
      >
        <RefreshCw className={`size-3.5 ${laeuft ? "animate-spin" : ""}`} />
        {laeuft ? "Prüft Positionen …" : "Jetzt aktualisieren"}
      </Button>
      {fehler && <p className="text-xs text-destructive">{fehler}</p>}
    </div>
  );
}
