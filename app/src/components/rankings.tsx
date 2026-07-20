import Link from "next/link";
import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeywordStrategie } from "@/components/keyword-strategie";
import {
  letzte28Tage,
  searchAnalyticsAbfragen,
  SearchConsoleFehler,
  verifizierteSiteFinden,
} from "@/lib/search-console";

const REINIGUNG_MUSTER = /reinig|gebäude|büro|glas|grund/i;

export async function Rankings() {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardDescription>
            Noch nicht mit Google verbunden. Verbinde dich in den{" "}
            <Link href="/einstellungen" className="underline">
              Einstellungen
            </Link>
            , um echte Rankings aus der Search Console zu sehen.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  try {
    const site = await verifizierteSiteFinden(session.accessToken);
    if (!site) {
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardDescription>
              Mit Google verbunden, aber keine verifizierte Search-Console-
              Property gefunden. Prüfe, ob die Rechteübertragung für
              blitzblank-dienstleistung.com abgeschlossen ist.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    const zeilen = await searchAnalyticsAbfragen(session.accessToken, site.siteUrl, {
      ...letzte28Tage(),
      rowLimit: 15,
    });

    if (zeilen.length === 0) {
      return (
        <Card className="border-dashed">
          <CardHeader>
            <CardDescription>
              Verbunden mit {site.siteUrl}, aber noch keine Suchdaten für die
              letzten 28 Tage vorhanden.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Suchanfrage</th>
                  <th className="pb-2 font-medium">Klicks</th>
                  <th className="pb-2 font-medium">Impr.</th>
                  <th className="pb-2 font-medium">CTR</th>
                  <th className="pb-2 font-medium">Ø Position</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z) => (
                  <tr key={z.keys[0]} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <span className="flex items-center gap-2">
                        {z.keys[0]}
                        {REINIGUNG_MUSTER.test(z.keys[0]) && (
                          <Badge variant="secondary" className="text-[10px]">
                            Gebäudereinigung
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="py-2 tabular-nums">{z.clicks}</td>
                    <td className="py-2 tabular-nums">{z.impressions}</td>
                    <td className="py-2 tabular-nums">
                      {(z.ctr * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 tabular-nums">{z.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <KeywordStrategie />
      </div>
    );
  } catch (error) {
    const nachricht =
      error instanceof SearchConsoleFehler
        ? error.message
        : "Rankings konnten nicht geladen werden.";
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardDescription>{nachricht}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
}
