import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Single-User-System (Konzept Abschnitt 13): Login ist ausschließlich über
 * das Google-Konto der Blitzblank Dienstleistung UG vorgesehen. Die Scopes
 * decken Gmail-Versand (Modul 8) und Search Console (Modul 9) ab.
 */
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

async function accessTokenErneuern(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const daten = await response.json();
  if (!response.ok) throw new Error("Token-Erneuerung fehlgeschlagen: " + JSON.stringify(daten));
  return {
    accessToken: daten.access_token as string,
    expiresAt: Math.floor(Date.now() / 1000) + (daten.expires_in as number),
    refreshToken: (daten.refresh_token as string | undefined) ?? refreshToken,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      const expiresAt = token.expiresAt as number | undefined;
      const refreshToken = token.refreshToken as string | undefined;
      if (expiresAt && Date.now() / 1000 > expiresAt - 60 && refreshToken) {
        try {
          const erneuert = await accessTokenErneuern(refreshToken);
          token.accessToken = erneuert.accessToken;
          token.expiresAt = erneuert.expiresAt;
          token.refreshToken = erneuert.refreshToken;
        } catch (error) {
          console.error("Google-Token konnte nicht erneuert werden:", error);
          token.accessToken = undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/einstellungen",
  },
});
