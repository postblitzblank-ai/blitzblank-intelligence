import { FirmenListe } from "@/components/firmen-liste";

export const dynamic = "force-dynamic";

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
