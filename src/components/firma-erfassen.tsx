"use client";

import * as React from "react";
import { Plus } from "lucide-react";
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
import { firmaErfassen } from "@/app/actions/firma";

/**
 * Schnellerfassung gemäß Konzept: eingehende Anfrage in unter 15 Sekunden,
 * Kanal/Herkunft wird immer mitgespeichert.
 */
export function FirmaErfassen({
  typ,
}: {
  typ: "direktkunde" | "nachunternehmer";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Firma erfassen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Firma erfassen</DialogTitle>
          <DialogDescription>
            Nur der Name ist Pflicht — alles Weitere kann später ergänzt werden.
          </DialogDescription>
        </DialogHeader>
        <form action={firmaErfassen} className="space-y-3">
          <input type="hidden" name="typ" value={typ} />
          <Input name="name" placeholder="Firmenname *" required autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input name="branche" placeholder="Branche" />
            <Input name="region" placeholder="Region" />
          </div>
          <select
            name="herkunftKanal"
            defaultValue={typ === "direktkunde" ? "eingehend_telefon" : "ausgehend"}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="eingehend_telefon">Eingehend — Telefon</option>
            <option value="eingehend_email">Eingehend — E-Mail</option>
            <option value="eingehend_formular">Eingehend — Formular</option>
            <option value="ausgehend">Ausgehend — selbst gefunden</option>
          </select>
          <Button type="submit" className="w-full">
            Anlegen
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
