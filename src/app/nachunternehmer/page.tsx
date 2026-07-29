import { FirmenListe } from "@/components/firmen-liste";

export const dynamic = "force-dynamic";
// KI-Recherche (web_search + web_fetch) dauert regelmässig 30-60s -- ohne
// dieses Limit killt Vercels Standard-Timeout die Server Action vorzeitig.
export const maxDuration = 180;

export default function NachunternehmerPage() {
  return (
    <FirmenListe
      typ="nachunternehmer"
      titel="Nachunternehmer"
      untertitel="Firmen, die Reinigungsleistungen vergeben — Beziehungsaufbau über Jahre."
      basisPfad="/nachunternehmer"
    />
  );
}
