import { Freigabe } from "@/components/freigabe";

export const dynamic = "force-dynamic";

export default function NachunternehmerFreigabePage() {
  return (
    <Freigabe
      typ="nachunternehmer"
      basisPfad="/nachunternehmer"
      titel="Nachunternehmer"
    />
  );
}
