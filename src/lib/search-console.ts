/**
 * Google Search Console API (Modul 9). Nutzt direkt fetch statt der
 * schweren googleapis-Bibliothek — die REST-API ist einfach genug dafür.
 */

export type SearchConsoleZeile = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export class SearchConsoleFehler extends Error {}

async function scFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new SearchConsoleFehler(
      `Search Console API Fehler (${res.status}): ${text.slice(0, 300)}`
    );
  }
  return res.json();
}

/** Ermittelt automatisch die verifizierte Property, die zur Blitzblank-Domain passt. */
export async function verifizierteSiteFinden(accessToken: string) {
  const daten = await scFetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    accessToken
  );
  const sites = (daten.siteEntry ?? []) as {
    siteUrl: string;
    permissionLevel: string;
  }[];

  const passend = sites.find((s) => s.siteUrl.includes("blitzblank"));
  return passend ?? sites[0] ?? null;
}

export async function searchAnalyticsAbfragen(
  accessToken: string,
  siteUrl: string,
  options: { startDate: string; endDate: string; rowLimit?: number }
) {
  const daten = await scFetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        startDate: options.startDate,
        endDate: options.endDate,
        dimensions: ["query"],
        rowLimit: options.rowLimit ?? 25,
      }),
    }
  );
  return (daten.rows ?? []) as SearchConsoleZeile[];
}

/**
 * Exakte, unveränderte Google-Search-Console-Daten für genau diese eine
 * Suchanfrage (z. B. "gebäudereinigung berlin") — keine Schätzung, keine
 * Zusammenfassung mehrerer unterschiedlicher Suchanfragen, kein gewichteter
 * Durchschnitt über verwandte Begriffe. GSC normalisiert Anfragen intern auf
 * Kleinschreibung, ein einzelner "equals"-Filter liefert den exakten
 * Treffer für genau dieses Ziel-Keyword.
 *
 * Gibt null zurück, wenn Google für diese exakte Anfrage in den letzten
 * 28 Tagen keine einzige Impression gemessen hat — die Oberfläche zeigt
 * dann ehrlich "Keine Daten verfügbar" statt einer Schätzung.
 */
export async function positionFuerKeyword(
  accessToken: string,
  siteUrl: string,
  keyword: string
) {
  const { startDate, endDate } = letzte28Tage();
  const daten = await scFetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: "query",
                operator: "equals",
                expression: keyword.toLowerCase(),
              },
            ],
          },
        ],
        rowLimit: 1,
      }),
    }
  );

  const zeile = ((daten.rows ?? []) as SearchConsoleZeile[])[0];
  if (!zeile || zeile.impressions === 0) return null;

  return {
    klicks: zeile.clicks,
    impressionen: zeile.impressions,
    position: zeile.position,
    quelle: "Google Search Console" as const,
    zeitraumStart: startDate,
    zeitraumEnde: endDate,
  };
}

export function letzte28Tage() {
  const heute = new Date();
  const start = new Date(heute);
  start.setDate(start.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(heute) };
}
