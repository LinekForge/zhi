import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import { resolve } from "path";

import { mkdirSync } from "fs";

process.umask(0o077);

const DB_DIR = resolve(import.meta.dir, "../../data");
const DB_PATH = resolve(DB_DIR, "journal.db");

mkdirSync(DB_DIR, { recursive: true });
mkdirSync(resolve(DB_DIR, "images"), { recursive: true });

const sqlite = new Database(DB_PATH, { create: true });
sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export { schema };
