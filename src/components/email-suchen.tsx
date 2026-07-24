"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emailNachtraeglichSuchen } from "@/app/actions/recherche";

export function EmailSuchen({ firmaId }: { firmaId: string }) {
  const [laeuft, setLaeuft] = React.useState(false);
  const [fertig, setFertig] = React.useState(false);

  if (fertig) {
    return <span className="text-xs text-muted-foreground">Gesucht — Seite neu laden für Ergebnis.</span>;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={laeuft}
      onClick={async () => {
        setLaeuft(true);
        const formData = new FormData();
        formData.set("firmaId", firmaId);
        try {
          await emailNachtraeglichSuchen(formData);
        } finally {
          setLaeuft(false);
          setFertig(true);
        }
      }}
    >
      <Search className="size-3.5" />
      {laeuft ? "Suche läuft …" : "E-Mail suchen"}
    </Button>
  );
}
