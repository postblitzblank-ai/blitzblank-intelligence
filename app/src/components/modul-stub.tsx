import { Card, CardDescription, CardHeader } from "@/components/ui/card";

export function ModulStub({
  titel,
  untertitel,
  hinweis,
}: {
  titel: string;
  untertitel: string;
  hinweis: string;
}) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{untertitel}</p>
      </div>
      <Card>
        <CardHeader>
          <CardDescription>{hinweis}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
