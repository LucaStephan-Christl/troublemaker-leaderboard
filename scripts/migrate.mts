/**
 * Wendet die SQL-Migrationen aus ./drizzle auf die Neon-Datenbank an.
 * Läuft vor `next build` (siehe package.json). Ohne DATABASE_URL passiert nichts –
 * lokal migriert PGlite sich beim ersten Zugriff selbst.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL nicht gesetzt – überspringe (lokal übernimmt PGlite).");
  process.exit(0);
}

await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
console.log("[migrate] Migrationen angewendet.");
