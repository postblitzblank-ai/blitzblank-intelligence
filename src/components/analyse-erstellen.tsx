"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyseErstellen } from "@/app/actions/analyse";

export function AnalyseErstellen() {
  const [laeuft, setLaeuft] = React.useState(false);
  const [fehler, setFehler] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        size="sm"
        disabled={laeuft}
        onClick={async () => {
          setLaeuft(true);
          setFehler(null);
          try {
            await analyseErstellen();
          } catch (e) {
            setFehler(e instanceof Error ? e.message : "Analyse fehlgeschlagen.");
          } finally {
            setLaeuft(false);
          }
        }}
      >
        <Sparkles className="size-4" />
        {laeuft ? "Analysiert …" : "Analyse aktualisieren"}
      </Button>
      {fehler && <p className="max-w-xs text-right text-xs text-destructive">{fehler}</p>}
    </div>
  );
}
