import { drizzle as drizzlePostgres, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL ist nicht gesetzt (siehe .env.example)");
}

/**
 * Neon wird über den HTTP-Treiber angesprochen (Port 443 statt 5432) —
 * empfohlen für Vercel/Serverless und funktioniert auch hinter Firewalls.
 * Für eine lokale Postgres-Instanz wird der klassische TCP-Treiber genutzt.
 * Beide Treiber bieten dieselbe Drizzle-API; der Cast vereinheitlicht den Typ.
 */
export const db = (
  connectionString.includes("neon.tech")
    ? drizzleNeon(neon(connectionString), { schema })
    : drizzlePostgres(postgres(connectionString, { prepare: false }), { schema })
) as PostgresJsDatabase<typeof schema>;
