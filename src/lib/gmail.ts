/**
 * Gmail API (Modul 8): E-Mails im Namen des Nutzers versenden. Nutzt direkt
 * fetch statt der googleapis-Bibliothek, gleiche Herangehensweise wie
 * search-console.ts.
 */

export class GmailFehler extends Error {}

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
    throw new GmailFehler(`Gmail-Versand fehlgeschlagen (${res.status}): ${fehlertext.slice(0, 300)}`);
  }

  return res.json() as Promise<{ id: string; threadId: string }>;
}
