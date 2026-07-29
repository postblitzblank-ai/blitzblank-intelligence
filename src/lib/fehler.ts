/**
 * Der Nutzer darf nie eine rohe technische Fehlermeldung sehen (Stacktrace,
 * JSON-Fehlerkörper einer API, Datenbank-Fehlercode). Eigene, bewusst
 * geschriebene Fehlertexte (kurz, auf Deutsch, ohne Klammern/JSON) werden
 * durchgereicht; alles andere wird geloggt und durch eine verständliche
 * Standardmeldung ersetzt.
 */
function wirktWieEigeneMeldung(text: string): boolean {
  if (text.length > 200) return false;
  if (/[{}[\]]/.test(text)) return false;
  if (/\bat\s.+\(.+:\d+:\d+\)/.test(text)) return false;
  if (/^[A-Za-z]+Error[: ]/.test(text)) return false;
  // Eigene Meldungen sind immer auf Deutsch geschrieben (Umlaute/ß oder
  // typische deutsche Funktionswörter) — ein rein englischer, technisch
  // wirkender Text (z. B. "fetch failed", "ECONNREFUSED") ist damit
  // zuverlässig als fremd erkennbar.
  if (!/[äöüßÄÖÜ]|(?:\bbitte\b|\bnicht\b|\bkein[e]?\b|\berneut\b|\bversuchen\b)/i.test(text)) {
    return false;
  }
  return true;
}

/** Anthropic-Fehler, die sich NIE von selbst durch "später erneut
 * versuchen" lösen, sondern ein echtes Handeln des Nutzers brauchen
 * (Guthaben aufladen, Rate-Limit ist ein anderer Fall). Diese muessen
 * als das benannt werden, was sie sind, statt hinter einer generischen
 * "versuch's später"-Meldung versteckt zu werden. */
function anthropicKontostandFehler(error: unknown): string | null {
  const nachricht = error instanceof Error ? error.message : String(error);
  if (/credit balance is too low/i.test(nachricht)) {
    return "Das Anthropic-API-Guthaben ist aufgebraucht — die KI kann gerade nicht arbeiten. Bitte unter console.anthropic.com/settings/billing Guthaben aufladen, danach funktioniert diese Funktion sofort wieder.";
  }
  return null;
}

export async function mitFreundlicherFehlerbehandlung<T>(
  kontext: string,
  aktion: () => Promise<T>,
  fallback = "Das hat gerade nicht funktioniert. Bitte in ein paar Minuten erneut versuchen."
): Promise<T> {
  try {
    return await aktion();
  } catch (error) {
    const guthabenFehler = anthropicKontostandFehler(error);
    if (guthabenFehler) {
      console.error(`${kontext} fehlgeschlagen (Anthropic-Guthaben aufgebraucht):`, error);
      throw new Error(guthabenFehler);
    }

    const nachricht = error instanceof Error ? error.message : String(error);
    if (wirktWieEigeneMeldung(nachricht)) {
      throw error;
    }
    console.error(`${kontext} fehlgeschlagen:`, error);
    throw new Error(fallback);
  }
}
