"use client";

import * as React from "react";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chanceRadarStarten } from "@/app/actions/marketing";

export function ChanceRadar() {
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
            await chanceRadarStarten();
          } catch (e) {
            setFehler(e instanceof Error ? e.message : "Chancen-Radar fehlgeschlagen.");
          } finally {
            setLaeuft(false);
          }
        }}
      >
        <Radar className={`size-4 ${laeuft ? "animate-spin" : ""}`} />
        {laeuft ? "Radar sucht …" : "Radar starten"}
      </Button>
      {fehler && <p className="text-xs text-destructive">{fehler}</p>}
    </div>
  );
}
