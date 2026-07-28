"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function EmailStatusBadge({
  hatEmail,
  protokoll,
}: {
  hatEmail: boolean;
  protokoll: string | null;
}) {
  const [offen, setOffen] = React.useState(false);

  const zustand = hatEmail
    ? { emoji: "🟢", text: "Versandbereit", farbe: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : protokoll
      ? { emoji: "🔴", text: "Kein Kontakt gefunden", farbe: "bg-red-50 text-red-700 border-red-200" }
      : { emoji: "🟡", text: "Noch nicht geprüft", farbe: "bg-amber-50 text-amber-700 border-amber-200" };

  const anklickbar = Boolean(protokoll);

  return (
    <>
      <Badge
        variant="outline"
        onClick={anklickbar ? () => setOffen(true) : undefined}
        className={`text-xs ${zustand.farbe} ${anklickbar ? "cursor-pointer hover:opacity-80" : ""}`}
      >
        {zustand.emoji} {zustand.text}
      </Badge>
      {anklickbar && (
        <Dialog open={offen} onOpenChange={setOffen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kontakt-Recherche</DialogTitle>
              <DialogDescription>
                Was die KI geprüft und gefunden hat.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-relaxed text-muted-foreground">{protokoll}</p>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
