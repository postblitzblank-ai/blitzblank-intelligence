"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { websiteCheckStarten } from "@/app/actions/seo";

export function WebsiteCheck() {
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
            await websiteCheckStarten();
          } catch {
            setFehler("Website-Check fehlgeschlagen. Bitte erneut versuchen.");
          } finally {
            setLaeuft(false);
          }
        }}
      >
        <Search className="size-4" />
        {laeuft ? "Website wird geprüft …" : "Website-Check starten"}
      </Button>
      {fehler && <p className="text-xs text-destructive">{fehler}</p>}
    </div>
  );
}
