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
 * Markenbegriffe, die eine Suchanfrage eindeutig als Marken-Suche
 * kennzeichnen (jemand kennt die Firma bereits), nicht als generische Suche
 * nach einer Dienstleistung. Eine Anfrage wie "blitz blank gebäudereinigung
 * berlin" enthält zwar wörtlich "gebäudereinigung berlin", sagt aber nichts
 * über das generische Ranking aus — wer nur "Gebäudereinigung Berlin" sucht,
 * kennt die Marke noch nicht. Ohne diesen Ausschluss würden Marken-Treffer
 * ein gutes generisches Ranking vortäuschen, das es nicht gibt.
 */
const MARKENBEGRIFFE = ["blitzblank", "blitz blank", "blitz-blank"];

/**
 * Aggregiertes Ranking für ein Ziel-Keyword: fasst alle echten,
 * NICHT-markengebundenen Suchanfragen zusammen, die das Keyword enthalten
 * (z. B. "gebäudereinigung berlin firma" zählt mit zu "Gebäudereinigung
 * Berlin"), gewichtet die Position nach Impressionen. Gibt null zurück,
 * wenn dafür noch keinerlei echte generische Daten vorliegen — dann lieber
 * "noch keine verlässlichen Rankingdaten" zeigen als eine durch
 * Marken-Suchen verfälschte Zahl.
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
                operator: "contains",
                expression: keyword.toLowerCase(),
              },
              ...MARKENBEGRIFFE.map((marke) => ({
                dimension: "query",
                operator: "notContains",
                expression: marke,
              })),
            ],
          },
        ],
        rowLimit: 25,
      }),
    }
  );

  const zeilen = (daten.rows ?? []) as SearchConsoleZeile[];
  if (zeilen.length === 0) return null;

  const klicks = zeilen.reduce((s, z) => s + z.clicks, 0);
  const impressionen = zeilen.reduce((s, z) => s + z.impressions, 0);
  const position =
    impressionen > 0
      ? zeilen.reduce((s, z) => s + z.position * z.impressions, 0) / impressionen
      : zeilen.reduce((s, z) => s + z.position, 0) / zeilen.length;

  return { klicks, impressionen, position };
}

export function letzte28Tage() {
  const heute = new Date();
  const start = new Date(heute);
  start.setDate(start.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(heute) };
}
