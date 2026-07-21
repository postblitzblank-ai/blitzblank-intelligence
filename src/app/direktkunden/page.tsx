import { FirmenListe } from "@/components/firmen-liste";

export const dynamic = "force-dynamic";

export default function DirektkundenPage() {
  return (
    <FirmenListe
      typ="direktkunde"
      titel="Direktkunden"
      untertitel="Neue Auftraggeber gewinnen — eingehend und ausgehend, eine gemeinsame Firmenakte."
      basisPfad="/direktkunden"
    />
  );
}
