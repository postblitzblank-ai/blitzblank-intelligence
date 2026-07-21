/**
 * Legt die beiden E-Mail-Vorlagen aus /vorlagen an, falls sie fehlen.
 * Quelle der Texte: vorlagen/direktkunden.md und vorlagen/nachunternehmer.md
 */
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import { vorlage } from "../src/db/schema";

const direktkundenText = `{{anrede}}

wir sind das Vertriebsteam der Blitzblank Dienstleistung UG und möchten Ihnen unser Unternehmen als zuverlässigen Partner für professionelle Reinigungsdienstleistungen vorstellen.

Mit über 100 qualifizierten Mitarbeitenden sind wir in Berlin, Brandenburg, Potsdam, Dresden sowie den umliegenden Regionen tätig. Unsere Mitarbeitenden sind deutschsprachig, gepflegt, zuverlässig und kundenorientiert. Qualität, Flexibilität und eine langfristige Zusammenarbeit stehen für uns an erster Stelle.

Unser Leistungsspektrum umfasst unter anderem:

- Unterhaltsreinigung
- Glas- und Sonderreinigung
- Industriereinigung
- Reinraumreinigung
- Laborreinigung
- Grundreinigung
- Bauendreinigung
- Hausmeisterservice
- Grünanlagenpflege

Wir würden uns freuen, Ihr Unternehmen künftig mit unseren professionellen Reinigungsdienstleistungen unterstützen zu dürfen. Gerne erstellen wir Ihnen bei Bedarf ein individuelles und unverbindliches Angebot.

Weitere Informationen über unser Unternehmen und unsere Leistungen finden Sie auf unserer Website:
🌐 www.blitzblank-dienstleistung.com

Vielen Dank für Ihre Zeit und Ihr Interesse. Wir freuen uns auf Ihre Rückmeldung.`;

const nachunternehmerText = `{{anrede}}

wir sind das Vertriebsteam der Blitzblank Dienstleistung UG und möchten uns Ihnen als zuverlässiger Nachunternehmer im Bereich der professionellen Gebäudereinigung vorstellen.

Mit über 100 qualifizierten Mitarbeitenden unterstützen wir Unternehmen in Berlin, Brandenburg, Potsdam, Dresden sowie den umliegenden Regionen. Unsere Mitarbeitenden sind deutschsprachig, gepflegt, zuverlässig und professionell im Kundenumgang. Qualität, Flexibilität und eine langfristige Zusammenarbeit stehen für uns an erster Stelle.

Unser Leistungsspektrum umfasst unter anderem:

- Unterhaltsreinigung
- Industriereinigung
- Reinraumreinigung
- Laborreinigung
- Glas- und Sonderreinigung
- Grundreinigung
- Bauendreinigung
- Hausmeisterservice
- Grünanlagenpflege

Gerne möchten wir Ihr Unternehmen künftig als zuverlässiger Nachunternehmer unterstützen und würden uns über die Möglichkeit freuen, uns persönlich bei Ihnen vorzustellen.

Weitere Informationen über unser Unternehmen und unsere Leistungen finden Sie auf unserer Website:
🌐 www.blitzblank-dienstleistung.com

Vielen Dank für Ihre Zeit und Ihr Interesse. Wir freuen uns auf Ihre Rückmeldung und auf eine mögliche Zusammenarbeit.`;

async function main() {
  const url = process.env.DATABASE_URL!;
  const istNeon = url.includes("neon.tech");
  const client = istNeon ? null : postgres(url, { max: 1, prepare: false });
  const db = istNeon ? drizzleNeon(neon(url)) : drizzlePostgres(client!);

  const vorhanden = await db.select({ typ: vorlage.typ }).from(vorlage);
  const typen = new Set(vorhanden.map((v) => v.typ));

  if (!typen.has("direktkunde")) {
    await db.insert(vorlage).values({
      typ: "direktkunde",
      betreff:
        "Professionelle Gebäudereinigung – Vorstellung der Blitzblank Dienstleistung UG",
      textMitPlatzhaltern: direktkundenText,
    });
    console.log("Vorlage Direktkunden angelegt.");
  }

  if (!typen.has("nachunternehmer")) {
    await db.insert(vorlage).values({
      typ: "nachunternehmer",
      betreff: "Vorstellung als Nachunternehmer im Bereich Gebäudereinigung",
      textMitPlatzhaltern: nachunternehmerText,
    });
    console.log("Vorlage Nachunternehmer angelegt.");
  }

  console.log("Seed abgeschlossen.");
  if (client) await client.end();
}

main();
