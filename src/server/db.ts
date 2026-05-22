import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { mkdirSync } from "fs";
import { DATA_DIR, DB_PATH, IMAGES_DIR } from "./paths";

process.umask(0o077);

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(IMAGES_DIR, { recursive: true });

const sqlite = new Database(DB_PATH, { create: true });
sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export { schema };
