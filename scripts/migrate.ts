/**
 * Wendet die SQL-Migrationen aus ./drizzle auf die Datenbank an.
 * Nutzt für Neon den HTTP-Treiber (Port 443), sonst den TCP-Treiber.
 */
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL!;
  if (url.includes("neon.tech")) {
    const db = drizzleNeon(neon(url));
    await migrateNeon(db, { migrationsFolder: "./drizzle" });
  } else {
    const client = postgres(url, { max: 1, prepare: false });
    const db = drizzlePostgres(client);
    await migratePostgres(db, { migrationsFolder: "./drizzle" });
    await client.end();
  }
  console.log("Migration abgeschlossen.");
}

main();
