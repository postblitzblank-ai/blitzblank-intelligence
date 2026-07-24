import { Freigabe } from "@/components/freigabe";

export const dynamic = "force-dynamic";
// E-Mail-Nachsuche pro Firma (web_search + web_fetch) kann 20-40s dauern.
export const maxDuration = 60;

export default function DirektkundenFreigabePage() {
  return (
    <Freigabe typ="direktkunde" basisPfad="/direktkunden" titel="Direktkunden" />
  );
}
