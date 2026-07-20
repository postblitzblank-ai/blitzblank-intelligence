"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { firmenRecherche } from "@/app/actions/recherche";

export function KiRecherche({
  typ,
}: {
  typ: "direktkunde" | "nachunternehmer";
}) {
  const [open, setOpen] = React.useState(false);
  const [laeuft, setLaeuft] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !laeuft && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sparkles className="size-4" /> KI-Recherche starten
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>KI-Recherche starten</DialogTitle>
          <DialogDescription>
            Die KI durchsucht das Web nach passenden Firmen und liefert für
            jede eine kurze Begründung. Dauert etwa 20–30 Sekunden.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            setLaeuft(true);
            await firmenRecherche(formData);
            setLaeuft(false);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="typ" value={typ} />
          <Input
            name="hinweis"
            placeholder='Zusätzlicher Hinweis, z. B. "nur Hotels" (optional)'
            disabled={laeuft}
          />
          <Button type="submit" className="w-full" disabled={laeuft}>
            {laeuft ? "Recherche läuft …" : "Recherche starten"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
