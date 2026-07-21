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

export function CommandBar() {
  const [open, setOpen] = React.useState(false);
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

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="KI-Assistent"
      description="Befehl eingeben oder Modul öffnen"
    >
      <Command>
        <CommandInput placeholder="Befehl eingeben … (z. B. „Priorisiere Hotels“)" />
        <CommandList>
        <CommandEmpty>
          <span className="flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles className="size-4" />
            Freie KI-Befehle folgen in einem späteren Schritt.
          </span>
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
