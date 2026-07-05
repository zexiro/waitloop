import path from "node:path";
import * as schema from "./schema";

type Db = ReturnType<typeof import("drizzle-orm/node-postgres").drizzle<typeof schema>>;

declare global {
  // Reused across HMR reloads in dev so we don't open a new pool/PGlite per reload.
  var __waitloopDb: Promise<Db> | undefined;
}

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

async function createDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(process.env.DATABASE_URL, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    return db;
  }
  // Local dev fallback: embedded Postgres (PGlite), stored under .data/
  const { mkdir } = await import("node:fs/promises");
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  await mkdir(dataDir, { recursive: true });
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(dataDir, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  if (!globalThis.__waitloopDb) {
    globalThis.__waitloopDb = createDb().catch((err) => {
      // Don't cache a failed init — let the next request retry.
      globalThis.__waitloopDb = undefined;
      throw err;
    });
  }
  return globalThis.__waitloopDb;
}

export * from "./schema";
