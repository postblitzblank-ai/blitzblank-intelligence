import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { CommandBar } from "@/components/command-bar";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blitzblank Intelligence",
  description:
    "Digitaler Geschäftsführungs-Assistent der Blitzblank Dienstleistung UG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Navigation />
        <CommandBar />
        <main className="pl-56">
          <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
        </main>
      </body>
    </html>
  );
}
