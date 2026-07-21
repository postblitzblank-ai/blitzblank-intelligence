"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  Search,
  Radar,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { befehlAusfuehren } from "@/app/actions/befehl";

export function CommandBar() {
  const [open, setOpen] = React.useState(false);
  const [wert, setWert] = React.useState("");
  const [laeuft, setLaeuft] = React.useState(false);
  const [antwort, setAntwort] = React.useState<string | null>(null);
  const [fehler, setFehler] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const schliessenUndZuruecksetzen = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setWert("");
      setAntwort(null);
      setFehler(null);
    }
  };

  const befehlStellen = async () => {
    if (!wert.trim() || laeuft) return;
    setLaeuft(true);
    setFehler(null);
    setAntwort(null);
    try {
      const formData = new FormData();
      formData.set("text", wert);
      const ergebnis = await befehlAusfuehren(formData);
      setAntwort(ergebnis);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : "Befehl fehlgeschlagen.");
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={schliessenUndZuruecksetzen}
      title="KI-Assistent"
      description="Befehl eingeben oder Modul öffnen"
    >
      <Command shouldFilter={!antwort && !laeuft}>
        <CommandInput
          placeholder="Befehl eingeben … (z. B. „Priorisiere Hotels“)"
          value={wert}
          onValueChange={(v) => {
            setWert(v);
            setAntwort(null);
            setFehler(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") befehlStellen();
          }}
        />
        <CommandList>
        <CommandEmpty>
          {laeuft ? (
            <span className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="size-4 animate-pulse" />
              Denke nach …
            </span>
          ) : antwort ? (
            <div className="px-2 py-1 text-left text-sm whitespace-pre-wrap">
              {antwort}
            </div>
          ) : fehler ? (
            <span className="text-sm text-destructive">{fehler}</span>
          ) : wert.trim() ? (
            <button
              onClick={befehlStellen}
              className="flex w-full items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="size-4" />
              KI fragen: „{wert}“ (Enter)
            </button>
          ) : (
            <span className="flex items-center justify-center gap-2 text-muted-foreground">
              <Sparkles className="size-4" />
              Freien Befehl eingeben oder Modul auswählen.
            </span>
          )}
        </CommandEmpty>
        <CommandGroup heading="Module">
          <CommandItem onSelect={() => go("/")}>
            <LayoutDashboard /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/direktkunden")}>
            <Building2 /> Direktkunden
          </CommandItem>
          <CommandItem onSelect={() => go("/nachunternehmer")}>
            <Handshake /> Nachunternehmer
          </CommandItem>
          <CommandItem onSelect={() => go("/seo")}>
            <Search /> SEO-Center
          </CommandItem>
          <CommandItem onSelect={() => go("/marketing")}>
            <Radar /> Marketing Intelligence
          </CommandItem>
          <CommandItem onSelect={() => go("/analyse")}>
            <BarChart3 /> Unternehmensanalyse
          </CommandItem>
          <CommandItem onSelect={() => go("/einstellungen")}>
            <Settings /> Einstellungen
          </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
