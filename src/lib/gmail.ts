/**
 * Gmail API (Modul 8): E-Mails im Namen des Nutzers versenden. Nutzt direkt
 * fetch statt der googleapis-Bibliothek, gleiche Herangehensweise wie
 * search-console.ts.
 */

export class GmailFehler extends Error {}

/** Übersetzt Gmail/Google-API-Fehlercodes in verständliche deutsche Sätze
 * statt rohe API-Fehlermeldungen an den Nutzer weiterzureichen. Die
 * technische Ursache wird zusätzlich geloggt, nie direkt gezeigt. */
function freundlicheGmailFehlermeldung(status: number, rohtext: string): string {
  console.error(`Gmail-API-Fehler (${status}):`, rohtext.slice(0, 500));
  if (status === 401) {
    return "Die Verbindung zu Google ist abgelaufen. Bitte in den Einstellungen erneut mit Google verbinden.";
  }
  if (status === 403) {
    return "Keine Berechtigung zum Versenden über dieses Gmail-Konto. Bitte die Google-Verbindung in den Einstellungen prüfen.";
  }
  if (status === 429) {
    return "Gmail hat gerade zu viele Anfragen erhalten. Bitte in ein paar Minuten erneut versuchen.";
  }
  if (status === 400) {
    return "Die E-Mail konnte nicht erstellt werden — bitte Empfängeradresse und Inhalt prüfen.";
  }
  if (status >= 500) {
    return "Gmail ist gerade nicht erreichbar. Bitte später erneut versuchen.";
  }
  return "E-Mail-Versand ist fehlgeschlagen. Bitte später erneut versuchen.";
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function mimeNachricht(an: string, betreff: string, text: string) {
  const zeilen = [
    `To: ${an}`,
    `Subject: =?UTF-8?B?${Buffer.from(betreff, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(text, "utf-8").toString("base64"),
  ];
  return base64UrlEncode(zeilen.join("\r\n"));
}

export async function emailSenden(
  accessToken: string,
  optionen: { an: string; betreff: string; text: string }
) {
  const raw = mimeNachricht(optionen.an, optionen.betreff, optionen.text);

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    const fehlertext = await res.text();
    throw new GmailFehler(freundlicheGmailFehlermeldung(res.status, fehlertext));
  }

  return res.json() as Promise<{ id: string; threadId: string }>;
}
