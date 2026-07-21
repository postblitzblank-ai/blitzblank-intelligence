"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chanceZuFirma } from "@/app/actions/marketing";

export function ChanceZuFirma({
  chanceId,
  vorschlagName,
}: {
  chanceId: string;
  vorschlagName: string;
}) {
  const [offen, setOffen] = React.useState(false);

  if (!offen) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOffen(true)}>
        Zur Firma machen
      </Button>
    );
  }

  return (
    <form action={chanceZuFirma} className="flex items-center gap-2">
      <input type="hidden" name="chanceId" value={chanceId} />
      <Input
        name="firmenname"
        defaultValue={vorschlagName}
        placeholder="Firmenname"
        className="h-8 w-48"
        autoFocus
        required
      />
      <Button type="submit" size="sm">
        Anlegen
      </Button>
    </form>
  );
}
