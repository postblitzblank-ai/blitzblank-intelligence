"use client";

import * as React from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { entwurfSenden } from "@/app/actions/kommunikation";

function Checkzeile({ erledigt, text }: { erledigt: boolean; text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full ${
          erledigt ? "bg-emerald-500 text-white" : "border border-muted-foreground/30"
        }`}
      >
        {erledigt && <Check className="size-2.5" strokeWidth={3} />}
      </span>
      <span className={erledigt ? "" : "text-muted-foreground"}>{text}</span>
    </li>
  );
}

export function EmailEntwurf({
  firmaId,
  betreff,
  text,
  hatAnsprechpartner,
  hatTelefon,
  hatWebsite,
  hatEmail,
}: {
  firmaId: string;
  betreff: string;
  text: string;
  hatAnsprechpartner: boolean;
  hatTelefon: boolean;
  hatWebsite: boolean;
  hatEmail: boolean;
}) {
  const [bearbeiten, setBearbeiten] = React.useState(false);
  const [betreffWert, setBetreffWert] = React.useState(betreff);
  const [textWert, setTextWert] = React.useState(text);
  const [laeuft, setLaeuft] = React.useState(false);
  const [gesendet, setGesendet] = React.useState(false);
  const [fehler, setFehler] = React.useState<string | null>(null);

  if (gesendet) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        ✔ E-Mail gesendet, Follow-up automatisch geplant.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <ul className="space-y-1.5">
        <Checkzeile erledigt text="Firma recherchiert" />
        <Checkzeile erledigt={hatAnsprechpartner} text="Ansprechpartner gefunden" />
        <Checkzeile erledigt={hatTelefon} text="Telefonnummer gefunden" />
        <Checkzeile erledigt={hatWebsite} text="Webseite gefunden" />
        <Checkzeile erledigt={hatEmail} text="E-Mail-Adresse gefunden" />
        <Checkzeile erledigt text="E-Mail geschrieben" />
        <Checkzeile erledigt={false} text="Follow-up wird nach dem Senden automatisch geplant" />
      </ul>

      {bearbeiten ? (
        <div className="space-y-2">
          <Input value={betreffWert} onChange={(e) => setBetreffWert(e.target.value)} />
          <Textarea
            value={textWert}
            onChange={(e) => setTextWert(e.target.value)}
            rows={8}
            className="text-sm"
          />
        </div>
      ) : (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="mb-1 font-medium">{betreffWert}</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{textWert}</p>
        </div>
      )}

      {fehler && <p className="text-sm text-destructive">{fehler}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={() => setBearbeiten((v) => !v)}>
          {bearbeiten ? "Fertig" : "Bearbeiten"}
        </Button>
        <Button
          size="sm"
          disabled={laeuft || !hatEmail}
          onClick={async () => {
            setLaeuft(true);
            setFehler(null);
            const formData = new FormData();
            formData.set("firmaId", firmaId);
            formData.set("betreff", betreffWert);
            formData.set("text", textWert);
            try {
              await entwurfSenden(formData);
              setGesendet(true);
            } catch (e) {
              setFehler(e instanceof Error ? e.message : "Versand fehlgeschlagen.");
            } finally {
              setLaeuft(false);
            }
          }}
        >
          <Send className="size-3.5" />
          {laeuft ? "Wird gesendet …" : "Senden"}
        </Button>
      </div>
    </div>
  );
}
