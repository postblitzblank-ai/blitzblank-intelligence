"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keywordStrategieErstellen } from "@/app/actions/seo";

export function KeywordStrategie() {
  const [laeuft, setLaeuft] = React.useState(false);
  const [fehler, setFehler] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={laeuft}
        onClick={async () => {
          setLaeuft(true);
          setFehler(null);
          try {
            await keywordStrategieErstellen();
          } catch (e) {
            setFehler(
              e instanceof Error ? e.message : "Keyword-Strategie fehlgeschlagen."
            );
          } finally {
            setLaeuft(false);
          }
        }}
      >
        <TrendingUp className="size-4" />
        {laeuft ? "Strategie wird erstellt …" : "Keyword-Strategie erstellen"}
      </Button>
      {fehler && <p className="text-xs text-destructive">{fehler}</p>}
    </div>
  );
}
