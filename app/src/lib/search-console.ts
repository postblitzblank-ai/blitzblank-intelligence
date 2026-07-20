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

export function letzte28Tage() {
  const heute = new Date();
  const start = new Date(heute);
  start.setDate(start.getDate() - 28);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(heute) };
}
