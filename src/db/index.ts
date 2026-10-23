import fs from "node:fs";
import path from "node:path";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

const g = globalThis as unknown as { __mlbDb?: Promise<Db> };

/**
 * Mit DATABASE_URL (Vercel + Neon): Neon HTTP. Migrationen laufen beim Build (scripts/migrate.ts).
 * Ohne DATABASE_URL (lokale Entwicklung): eingebettetes Postgres (PGlite) unter .data/.
 */
export function getDb(): Promise<Db> {
  if (!g.__mlbDb) {
    g.__mlbDb = init().catch((err) => {
      g.__mlbDb = undefined;
      throw err;
    });
  }
  return g.__mlbDb;
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle(neon(url), { schema }) as unknown as Db;
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL ist nicht gesetzt (Neon-Integration in Vercel hinzufügen).");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  const client = new PGlite(path.join(dir, "pglite"));
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as Db;
}

export { schema };
