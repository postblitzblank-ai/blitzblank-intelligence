/**
 * Direkter Schreibzugriff auf das Website-Repository (clean-sparkle-berlin)
 * über die GitHub Contents API -- damit die tägliche SEO-Automatik echte
 * Commits auf main erzeugen kann, statt nur Empfehlungen zu speichern.
 * Bewusst auf einen einzigen, fest hinterlegten Repository-Ziel beschränkt
 * (kein generischer GitHub-Client), damit ein gestohlener Token nur genau
 * dieses eine Repo betreffen kann.
 */
const OWNER = "postblitzblank-ai";
const REPO = "clean-sparkle-berlin";
const BRANCH = "main";

function token(): string {
  const t = process.env.WEBSITE_GITHUB_TOKEN;
  if (!t) {
    throw new Error(
      "Kein GitHub-Zugriff auf die Website hinterlegt -- bitte WEBSITE_GITHUB_TOKEN eintragen."
    );
  }
  return t;
}

async function githubFetch(pfad: string, init?: RequestInit) {
  const antwort = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${pfad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });
  if (!antwort.ok) {
    const text = await antwort.text();
    throw new Error(`GitHub-API-Fehler (${antwort.status}): ${text.slice(0, 300)}`);
  }
  return antwort.json();
}

export async function dateiLesen(dateipfad: string): Promise<{ inhalt: string; sha: string } | null> {
  try {
    const daten = (await githubFetch(
      `/contents/${dateipfad}?ref=${BRANCH}`
    )) as { content: string; sha: string; encoding: string };
    const inhalt = Buffer.from(daten.content, "base64").toString("utf-8");
    return { inhalt, sha: daten.sha };
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function dateiAktualisieren(
  dateipfad: string,
  neuerInhalt: string,
  sha: string,
  commitNachricht: string
): Promise<{ commitUrl: string }> {
  const ergebnis = (await githubFetch(`/contents/${dateipfad}`, {
    method: "PUT",
    body: JSON.stringify({
      message: commitNachricht,
      content: Buffer.from(neuerInhalt, "utf-8").toString("base64"),
      sha,
      branch: BRANCH,
    }),
  })) as { commit: { html_url: string } };
  return { commitUrl: ergebnis.commit.html_url };
}
