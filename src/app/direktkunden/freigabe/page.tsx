import { Freigabe } from "@/components/freigabe";

export const dynamic = "force-dynamic";

export default function DirektkundenFreigabePage() {
  return (
    <Freigabe typ="direktkunde" basisPfad="/direktkunden" titel="Direktkunden" />
  );
}
