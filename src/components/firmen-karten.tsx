"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Mail, Phone, Globe, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmailStatusBadge } from "@/components/email-status-badge";

export type FirmaKarte = {
  id: string;
  name: string;
  branche: string | null;
  region: string | null;
  status: string;
  email: string | null;
  website: string | null;
  rechercheProtokoll: string | null;
  score: number;
  naechsteAufgabe: string;
  ansprechpartner: { vorname: string | null; nachname: string | null; rolle: string | null; telefon: string | null; email: string | null }[];
};

const statusLabel: Record<string, string> = {
  vorschlag: "Vorschlag",
  neu: "Neu",
  kontaktiert: "Kontaktiert",
  gewonnen: "Gewonnen",
  kein_interesse: "Kein Interesse",
};

const statusFarbe: Record<string, string> = {
  vorschlag: "bg-slate-100 text-slate-600 border-slate-200",
  neu: "bg-sky-100 text-sky-700 border-sky-200",
  kontaktiert: "bg-amber-100 text-amber-700 border-amber-200",
  gewonnen: "bg-emerald-100 text-emerald-700 border-emerald-200",
  kein_interesse: "bg-slate-100 text-slate-400 border-slate-200",
};

function scoreFarbe(score: number) {
  if (score >= 70) return "bg-red-50 text-red-700 border-red-200";
  if (score >= 45) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

function initialen(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function externeUrl(url: string) {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

export function FirmenKarten({
  firmen,
  basisPfad,
}: {
  firmen: FirmaKarte[];
  basisPfad: string;
}) {
  const [suche, setSuche] = React.useState("");

  const gefiltert = React.useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return firmen;
    const begriffe = q.split(/\s+/);
    return firmen.filter((f) => {
      const haystack = [f.name, f.branche, f.region, ...f.ansprechpartner.map((a) => a.nachname)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return begriffe.every((b) => haystack.includes(b));
    });
  }, [firmen, suche]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder='Suchen … z. B. "Hotels Berlin" oder "Piepenbrock"'
          className="pl-9"
        />
      </div>

      {gefiltert.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Keine Firmen gefunden{suche ? ` für „${suche}“` : ""}.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gefiltert.map((f) => {
            const kontakt = f.ansprechpartner[0];
            return (
              <div
                key={f.id}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initialen(f.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{f.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[f.branche, f.region].filter(Boolean).join(" · ") || "Keine Details"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-xs ${scoreFarbe(f.score)}`}>
                    {f.score}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`text-xs ${statusFarbe[f.status] ?? ""}`}>
                    {statusLabel[f.status] ?? f.status}
                  </Badge>
                  <EmailStatusBadge
                    hatEmail={Boolean(f.email || kontakt?.email)}
                    protokoll={f.rechercheProtokoll}
                  />
                </div>

                {kontakt && (kontakt.vorname || kontakt.nachname) && (
                  <p className="text-xs text-muted-foreground">
                    {[kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ")}
                    {kontakt.rolle ? ` · ${kontakt.rolle}` : ""}
                  </p>
                )}

                <p className="text-xs font-medium">{f.naechsteAufgabe}</p>

                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <a
                    href={f.email || kontakt?.email ? `mailto:${f.email || kontakt?.email}` : undefined}
                    aria-disabled={!f.email && !kontakt?.email}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                      f.email || kontakt?.email
                        ? "hover:bg-accent"
                        : "pointer-events-none opacity-40"
                    }`}
                  >
                    <Mail className="size-3" /> E-Mail
                  </a>
                  <a
                    href={kontakt?.telefon ? `tel:${kontakt.telefon}` : undefined}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                      kontakt?.telefon ? "hover:bg-accent" : "pointer-events-none opacity-40"
                    }`}
                  >
                    <Phone className="size-3" /> Anrufen
                  </a>
                  <a
                    href={f.website ? externeUrl(f.website) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
                      f.website ? "hover:bg-accent" : "pointer-events-none opacity-40"
                    }`}
                  >
                    <Globe className="size-3" /> Webseite
                  </a>
                  <Link
                    href={`${basisPfad}/${f.id}`}
                    className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
                  >
                    <FolderOpen className="size-3" /> CRM öffnen
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
