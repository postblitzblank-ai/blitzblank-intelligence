import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { accessTokenErneuern, refreshTokenSpeichern } from "@/lib/google-token";

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
        // Zusätzlich dauerhaft speichern, damit Cron-Jobs ohne Browser-Session
        // auf Gmail/Search Console zugreifen können.
        if (account.refresh_token) {
          await refreshTokenSpeichern(account.refresh_token);
        }
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
