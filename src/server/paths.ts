import { resolve } from "path";

const fallback = resolve(import.meta.dir, "../../data");
export const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : fallback;
export const DB_PATH = resolve(DATA_DIR, "journal.db");
export const IMAGES_DIR = resolve(DATA_DIR, "images");
export const CONFIG_PATH = resolve(DATA_DIR, "config.json");
export const BACKUP_DIR = resolve(DATA_DIR, "backups");
