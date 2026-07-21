import { Firmenakte } from "@/components/firmenakte";

export const dynamic = "force-dynamic";

export default async function DirektkundenAktePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Firmenakte firmaId={id} basisPfad="/direktkunden" />;
}
